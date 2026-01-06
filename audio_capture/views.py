from django.shortcuts import redirect, render
from django.http import HttpResponse
from django.template import loader
import base64
import json
from django.core.files.base import ContentFile
from .models import EssayAudioStorage, AITAAudioStorage
import datetime

def homepage(request):
    if request.method == 'POST' and request.POST.get('consent'):
        return redirect('annotation')
    return render(request, 'homepage.html')

def annotation(request):
    template = loader.get_template("annotation.html")
    return HttpResponse(template.render())

def save_audio_essay(request):
    template = loader.get_template("homepage.html") # Fix
    user_id = EssayAudioStorage.objects.all().count() + 1
    
    if request.method == 'POST':
        data = json.loads(request.body)
        audio_data = data.get('audio_base64') 
        date = datetime.datetime.now()

        audio_file = ContentFile(base64.b64decode(audio_data), name=f"essay_{date}.webm")

        new_entry = EssayAudioStorage(
            user_id=user_id,
            essay_id=data.get('essay_id'),
            audio_file=audio_file
        )
        new_entry.save()

        # # Debugging
        # print("FILE SAVED TO:", new_entry.audio_file.path)

        return HttpResponse(template.render()) # Not sure what to return here
    else:
        return HttpResponse(template.render()) # And here
    

def save_audio_aita(request):
    template = loader.get_template("homepage.html") # Fix
    user_id = AITAAudioStorage.objects.all().count() + 1
    
    if request.method == 'POST':
        data = json.loads(request.body)
        audio_data = data.get('audio_base64') 
        date = datetime.datetime.now()

        audio_file = ContentFile(base64.b64decode(audio_data), name=f"aita_{date}.webm")

        new_entry = AITAAudioStorage(
            user_id=user_id,
            post_id=data.get('aita_id'),
            audio_file=audio_file
        )
        new_entry.save()

        # # Debugging
        # print("FILE SAVED TO:", new_entry.audio_file.path)

        return HttpResponse(template.render()) # Not sure what to return here
    else:
        return HttpResponse(template.render()) # And here