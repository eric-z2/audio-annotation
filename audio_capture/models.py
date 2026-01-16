from django.db import models

# Create your models here.

class EssayAudioStorage(models.Model):
    user_id = models.IntegerField() # Not sure whether to use int or strings for this field (or if we even want this field)
    essay_id = models.IntegerField()
    audio_file = models.FileField(upload_to='essay/')
    datetime = models.DateTimeField(auto_now=True)

class AITAAudioStorage(models.Model): # Make more general
    user_id = models.IntegerField() # Not sure whether to use int or strings for this field (or if we even want this field)
    post_id = models.IntegerField()
    audio_file = models.FileField(upload_to='aita/')
    label = models.CharField(max_length=100)
    datetime = models.DateTimeField(auto_now=True)