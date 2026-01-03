from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
import base64
import json
from django.core.files.base import ContentFile
from .models import EssayAudioStorage
import datetime

def homepage(request):
    template = loader.get_template('homepage.html')
    return HttpResponse(template.render())

def annotation(request):
    template = loader.get_template("annotation.html")
    return HttpResponse(template.render())

def save_audio(request):
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

        return HttpResponse(template.render())
    else:
        return HttpResponse(template.render())