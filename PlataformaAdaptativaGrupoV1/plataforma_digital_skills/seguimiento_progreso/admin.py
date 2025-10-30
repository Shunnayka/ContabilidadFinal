from django.contrib import admin
from .models import ProgresoUsuario

@admin.register(ProgresoUsuario)
class ProgresoUsuarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'modulo', 'completado', 'porcentaje_completado', 'fecha_inicio']
    list_filter = ['completado', 'modulo']
    search_fields = ['usuario__username', 'modulo__nombre']