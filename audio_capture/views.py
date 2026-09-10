from datetime import timedelta
import base64
import datetime
import json
import random

from django.conf import settings
from django.db import transaction
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils import timezone
from pathlib import Path
from django.core.files.base import ContentFile

from .models import AudioStorage, QuestionAssignment


def load_question_config():
    with open(settings.QUESTION_CONFIG_FILE, encoding='utf-8') as question_file:
        return json.load(question_file)


def expire_assignments(now):
    QuestionAssignment.objects.filter(
        status=QuestionAssignment.Status.ASSIGNED,
        expires_at__lte=now,
    ).update(status=QuestionAssignment.Status.EXPIRED)


def assignment_question(question, assignment):
    assigned_question = question.copy()
    assigned_question['assignment_id'] = assignment.id
    return assigned_question

def homepage(request):
    if request.method == 'POST' and request.POST.get('id'):
        request.session['crowdworker_id'] = request.POST.get('id')
        return redirect('annotation')
    context = {
        'task_name': settings.PROJECT_NAME,
        'intro_text': settings.INTRODUCTION_TEXT,
        'colour': settings.BASE_COLOUR,
        'colour_dark': settings.BASE_COLOUR_DARK
    }
    return render(request, 'homepage.html', context=context)

def annotation(request):
    if 'crowdworker_id' not in request.session:
        return redirect('homepage')
    context = {
        'lengths': [
            {
                'min_len_test': settings.MIN_LEN_TEST,
                'max_len_test': settings.MAX_LEN_TEST,
            }
        ],
        'task_name': settings.PROJECT_NAME,
        'end_text': settings.ENDING_TEXT,
        'colour': settings.BASE_COLOUR,
        'colour_dark': settings.BASE_COLOUR_DARK
    }
    return render(request, "annotation.html", context=context)


def assign_questions(request):
    if request.method != 'GET':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)
    if 'crowdworker_id' not in request.session:
        return JsonResponse({'status': 'error', 'message': 'Participant ID is required'}, status=403)

    try:
        all_trials = load_question_config()
    except (OSError, json.JSONDecodeError) as error:
        return JsonResponse({'status': 'error', 'message': f'Unable to load questions: {error}'}, status=500)

    crowdworker_id = request.session['crowdworker_id']
    target = settings.TARGET_ANNOTATIONS_PER_QUESTION
    lease = timedelta(hours=settings.QUESTION_ASSIGNMENT_LEASE_HOURS)
    now = timezone.now()

    # The transaction keeps the assignment creation and its capacity check together.
    with transaction.atomic():
        expire_assignments(now)
        response_trials = []

        for trial in all_trials:
            trial_name = trial['trial_name']
            repetitions = trial.get('repetitions', 1)
            raw_questions = trial.get('questions', [])
            questions_by_id = {str(question['id']): question for question in raw_questions}

            # Reloading the page returns the participant's still-valid lease rather
            # than consuming another allocation for the same question.
            existing = list(QuestionAssignment.objects.filter(
                trial_name=trial_name,
                user_id=crowdworker_id,
                status=QuestionAssignment.Status.ASSIGNED,
                expires_at__gt=now,
            ).order_by('assigned_at'))
            selected = [
                assignment_question(questions_by_id[assignment.question_id], assignment)
                for assignment in existing
                if assignment.question_id in questions_by_id
            ][:repetitions]

            selected_ids = {str(question['id']) for question in selected}
            completed_counts = dict(QuestionAssignment.objects.filter(
                trial_name=trial_name,
                status=QuestionAssignment.Status.COMPLETED,
            ).values('question_id').annotate(total=Count('id')).values_list('question_id', 'total'))
            active_counts = dict(QuestionAssignment.objects.filter(
                trial_name=trial_name,
                status=QuestionAssignment.Status.ASSIGNED,
                expires_at__gt=now,
            ).values('question_id').annotate(total=Count('id')).values_list('question_id', 'total'))

            eligible = [
                question for question in raw_questions
                if str(question['id']) not in selected_ids
                and completed_counts.get(str(question['id']), 0) < target
                # Never allow completed plus still-active assignments to exceed
                # the target. For target=3 and two active leases, exactly one
                # more participant can receive the question.
                and (
                    completed_counts.get(str(question['id']), 0)
                    + active_counts.get(str(question['id']), 0)
                    < target
                )
            ]
            if trial.get('selection', 'random') != 'sequential':
                random.shuffle(eligible)

            for question in eligible[:max(0, repetitions - len(selected))]:
                assignment = QuestionAssignment.objects.create(
                    trial_name=trial_name,
                    question_id=str(question['id']),
                    user_id=crowdworker_id,
                    expires_at=now + lease,
                )
                selected.append(assignment_question(question, assignment))

            response_trial = trial.copy()
            response_trial['questions'] = selected
            response_trials.append(response_trial)

    return JsonResponse(response_trials, safe=False)

def save_audio(request):    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            audio_data = data.get('audio_base64') 
            date = datetime.datetime.now().strftime("%Y-%m-%d")
            crowdworker_id = request.session.get('crowdworker_id', 'unknown')
            trial_name = data.get('trial_name')
            trial_id = data.get('trial_id')
            assignment_id = data.get('assignment_id')

            if not assignment_id:
                raise ValueError('An assignment ID is required')

            with transaction.atomic():
                expire_assignments(timezone.now())
                assignment = QuestionAssignment.objects.select_for_update().get(
                    id=assignment_id,
                    user_id=crowdworker_id,
                    status=QuestionAssignment.Status.ASSIGNED,
                )
                if assignment.trial_name != trial_name or assignment.question_id != str(trial_id):
                    raise ValueError('Assignment does not match the submitted question')

                audio_file = ContentFile(base64.b64decode(audio_data), name=f"{date}_{trial_name}_{crowdworker_id}.webm")
                new_entry = AudioStorage(
                    trial_name=trial_name,
                    user_id=crowdworker_id,
                    trial_id=trial_id,
                    audio_file=audio_file
                )
                new_entry.save()
                assignment.status = QuestionAssignment.Status.COMPLETED
                assignment.save(update_fields=['status'])

            return JsonResponse({
                'status': 'success',
                'message': 'Audio saved successfully'
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)
    else:
        return JsonResponse({
            'status': 'error',
            'message': 'Method not allowed'
        }, status=405)    

def save_feedback(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            feedback_text = (data.get('feedback_text') or '').strip()
            if not feedback_text:
                return JsonResponse({
                    'status': 'success',
                    'message': 'No feedback provided'
                })

            crowdworker_id = request.session.get('crowdworker_id', 'unknown')
            safe_worker_id = ''.join(ch if ch.isalnum() or ch in {'_', '-'} else '_' for ch in crowdworker_id)
            date = datetime.datetime.now().strftime("%Y-%m-%d")
            filename = f'feedback_{safe_worker_id}_{date}.txt'

            feedback_dir = Path(settings.MEDIA_ROOT) / 'feedback'
            feedback_dir.mkdir(parents=True, exist_ok=True)

            feedback_path = feedback_dir / filename
            with open(feedback_path, 'w') as f:
                f.write(feedback_text)

            return JsonResponse({
                'status': 'success',
                'message': 'Feedback saved successfully'
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)
    else:
        return JsonResponse({
            'status': 'error',
            'message': 'Method not allowed'
        }, status=405)
