from django.core.management.base import BaseCommand
from modulos_aprendizaje.models import Modulo

class Command(BaseCommand):
    def handle(self, *args, **options):
        print("🌱 Creando datos iniciales...")
        
        mod, created = Modulo.objects.get_or_create(
            nombre="Seguridad Digital",
            defaults={
                "descripcion": "Aprende seguridad en internet",
                "duracion_minutos": 45,
                "nivel_dificultad": "basico",
                "orden": 1
            }
        )
        
        if created:
            print("✅ Módulo creado!")
        else:
            print("📝 Módulo ya existía")
