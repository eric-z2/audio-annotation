from django.shortcuts import redirect, render
from django.http import HttpResponse, JsonResponse
from django.template import loader
import base64
import json
from django.core.files.base import ContentFile
from .models import AudioStorage
import datetime

from django.conf import settings

def homepage(request):
    if request.method == 'POST' and request.POST.get('id'):
        request.session['crowdworker_id'] = request.POST.get('id')
        return redirect('annotation')
    context = {
        'task_name': settings.ANNOTATION_TASK_NAME,
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
        'end_text': settings.ENDING_TEXT,
        'colour': settings.BASE_COLOUR,
        'colour_dark': settings.BASE_COLOUR_DARK
    }
    return render(request, "annotation.html", context=context)

def save_audio(request):    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            audio_data = data.get('audio_base64') 
            date = datetime.datetime.now()
            crowdworker_id = request.session.get('crowdworker_id', 'unknown')
            trial_name = data.get('trial_name')
            trial_id = data.get('trial_id')

            audio_file = ContentFile(base64.b64decode(audio_data), name=f"{date}_{trial_name}_{crowdworker_id}.webm")

            new_entry = AudioStorage(
                trial_name=trial_name,
                user_id=crowdworker_id,
                trial_id=trial_id,
                audio_file=audio_file
            )
            new_entry.save()

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
