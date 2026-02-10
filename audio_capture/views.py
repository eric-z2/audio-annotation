from django.shortcuts import redirect, render
from django.http import HttpResponse, JsonResponse
from django.template import loader
import base64
import json
from django.core.files.base import ContentFile
from .models import EssayAudioStorage, AITAAudioStorage
import datetime

def homepage(request):
    if request.method == 'POST' and request.POST.get('id'):
        request.session['crowdworker_id'] = request.POST.get('id')
        return redirect('annotation')
    return render(request, 'homepage.html')

def annotation(request):
    if 'crowdworker_id' not in request.session:
        return redirect('homepage')
    template = loader.get_template("annotation.html")
    return HttpResponse(template.render())

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