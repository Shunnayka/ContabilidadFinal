from django.urls import path
from . import views

urlpatterns = [
    path('', views.lista_modulos, name='lista_modulos'),
    path('<int:modulo_id>/', views.detalle_modulo, name='detalle_modulo'),
    path('<int:modulo_id>/completar/', views.completar_modulo, name='completar_modulo'),
]