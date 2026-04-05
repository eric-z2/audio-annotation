from django.shortcuts import redirect, render
from django.http import HttpResponse, JsonResponse
from django.template import loader
import base64
import json
from django.core.files.base import ContentFile
from .models import EssayAudioStorage, AITAAudioStorage
import datetime

from django.conf import settings

def homepage(request):
    if request.method == 'POST' and request.POST.get('id'):
        request.session['crowdworker_id'] = request.POST.get('id')
        return redirect('annotation')
    context = {'task_name': settings.ANNOTATION_TASK_NAME}
    return render(request, 'homepage.html', context=context)

def annotation(request):
    if 'crowdworker_id' not in request.session:
        return redirect('homepage')
    context = {
        'lengths': [
            {
                'min_len_test': settings.MIN_LEN_TEST,
                'max_len_test': settings.MAX_LEN_TEST,
                'min_len_essay': settings.MIN_LEN_ESSAY,
                'max_len_essay': settings.MAX_LEN_ESSAY,
                'min_len_aita': settings.MIN_LEN_AITA,
                'max_len_aita': settings.MAX_LEN_AITA
            }
        ],
        'aita_options': settings.ANNOTATION_TASK_MC_OPTIONS
    }
    return render(request, "annotation.html", context=context)

def save_audio_essay(request):    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            audio_data = data.get('audio_base64') 
            date = datetime.datetime.now()
            crowdworker_id = request.session.get('crowdworker_id', 'unknown')

            audio_file = ContentFile(base64.b64decode(audio_data), name=f"{crowdworker_id}_essay_{date}.webm")

            new_entry = EssayAudioStorage(
                user_id=crowdworker_id,
                essay_id=data.get('essay_id'),
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

def save_audio_aita(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            audio_data = data.get('audio_base64') 
            date = datetime.datetime.now()
            crowdworker_id = request.session.get('crowdworker_id', 'unknown')

            audio_file = ContentFile(base64.b64decode(audio_data), name=f"{crowdworker_id}_aita_{date}.webm")

            new_entry = AITAAudioStorage(
                user_id=crowdworker_id,
                post_id=data.get('aita_id'),
                audio_file=audio_file,
                label=data.get('label')
            )
            print(data.get('label'))
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