from django.urls import path
from . import views

urlpatterns = [
    path('', views.lista_certificados, name='lista_certificados'),
    path('ver/<int:modulo_id>/', views.ver_certificado, name='ver_certificado'),
    path('generar/<int:modulo_id>/', views.generar_certificado_view, name='generar_certificado'),
]