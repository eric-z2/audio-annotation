from django.urls import path

from . import views

urlpatterns = [
    path("annotation/homepage/", views.homepage, name="homepage"),
    path("annotation/audio_annotation/", views.annotation, name="annotation"),
    path("annotation/audio_annotation/save_audio/", views.save_audio, name="save_audio"),
    path("annotation/audio_annotation/save_feedback/", views.save_feedback, name="save_feedback"),
]