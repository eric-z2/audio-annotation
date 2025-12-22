from django.urls import path

from . import views

urlpatterns = [
    path("audio_capture/", views.index, name="index"),
]