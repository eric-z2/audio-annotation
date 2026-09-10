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


class QuestionAssignment(models.Model):
    class Status(models.TextChoices):
        ASSIGNED = 'assigned', 'Assigned'
        COMPLETED = 'completed', 'Completed'
        EXPIRED = 'expired', 'Expired'

    trial_name = models.CharField(max_length=50)
    question_id = models.CharField(max_length=100)
    user_id = models.CharField(max_length=100)
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ASSIGNED)

    class Meta:
        indexes = [
            models.Index(fields=['trial_name', 'question_id', 'status']),
            models.Index(fields=['user_id', 'status']),
        ]
