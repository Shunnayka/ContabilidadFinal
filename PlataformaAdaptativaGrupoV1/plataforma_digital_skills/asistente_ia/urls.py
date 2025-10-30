from django.urls import path
from . import views

urlpatterns = [
    path('', views.chat_ia, name='chat_ia'),
    path('api/', views.chat_api, name='chat_api'),
]