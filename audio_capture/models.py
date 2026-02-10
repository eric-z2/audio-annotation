from django.db import models

# Create your models here.

def essay_audio_path(instance, filename):
    return f'{instance.user_id}/{filename}'

def aita_audio_path(instance, filename):
    return f'{instance.user_id}/{filename}'

class EssayAudioStorage(models.Model):
    user_id = models.CharField(max_length=100) 
    essay_id = models.IntegerField()
    audio_file = models.FileField(upload_to=essay_audio_path)
    datetime = models.DateTimeField(auto_now=True)

class AITAAudioStorage(models.Model):
    user_id = models.CharField(max_length=100)
    post_id = models.IntegerField()
    audio_file = models.FileField(upload_to=aita_audio_path)
    label = models.CharField(max_length=100)
    datetime = models.DateTimeField(auto_now=True)