from django.contrib import admin
from .models import PreguntaDiagnostico, ResultadoDiagnostico

@admin.register(PreguntaDiagnostico)
class PreguntaDiagnosticoAdmin(admin.ModelAdmin):
    list_display = ['texto', 'modulo', 'respuesta_correcta']
    list_filter = ['modulo']
    search_fields = ['texto']

@admin.register(ResultadoDiagnostico)
class ResultadoDiagnosticoAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'modulo', 'puntaje', 'necesita_refuerzo', 'fecha']
    list_filter = ['modulo', 'necesita_refuerzo', 'fecha']
    search_fields = ['usuario__username']