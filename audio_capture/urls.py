from django.urls import path

from . import views

urlpatterns = [
    path("homepage/", views.homepage, name="homepage"),
    path("annotation/", views.annotation, name="annotation"),
    path("save_audio/", views.save_audio, name="save_audio")
]