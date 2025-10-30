from django.contrib import admin
from .models import PerfilUsuario

@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'empresa', 'puesto', 'nivel_digital', 'fecha_registro']
    list_filter = ['empresa', 'nivel_digital', 'fecha_registro']
    search_fields = ['usuario__username', 'empresa', 'puesto']