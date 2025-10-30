from django.contrib import admin
from .models import Modulo, ContenidoModulo

@admin.register(Modulo)
class ModuloAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'nivel_dificultad', 'duracion_minutos', 'orden']
    list_filter = ['nivel_dificultad']
    search_fields = ['nombre', 'descripcion']
    ordering = ['orden']

@admin.register(ContenidoModulo)
class ContenidoModuloAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'modulo', 'tipo']
    list_filter = ['modulo', 'tipo']
    search_fields = ['titulo', 'contenido']