from django.urls import path

from . import views

urlpatterns = [
    path("annotation/homepage/", views.homepage, name="homepage"),
    path("annotation/audio_annotation/", views.annotation, name="annotation"),
    path("save_audio_essay/", views.save_audio_essay, name="save_audio_essay"),
    path("save_audio_aita/", views.save_audio_aita, name="save_audio_aita"),
]