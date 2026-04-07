from django.db import models

# Create your models here.

def audio_path(instance, filename):
    return f'{instance.user_id}/{filename}'

class AudioStorage(models.Model):
    trial_name = models.CharField(max_length=50)
    user_id = models.CharField(max_length=100) 
    trial_id = models.IntegerField()
    audio_file = models.FileField(upload_to=audio_path)
    datetime = models.DateTimeField(auto_now=True)