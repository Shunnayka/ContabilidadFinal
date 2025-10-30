from django.core.management.base import BaseCommand
from modulos_aprendizaje.models import Modulo
from evaluacion_diagnostico.models import PreguntaDiagnostico

class Command(BaseCommand):
    def handle(self, *args, **options):
        print("🌱 Agregando más preguntas al diagnóstico...")
        
        # Obtener módulos existentes
        seguridad = Modulo.objects.get(nombre="Seguridad Digital")
        ofimatica = Modulo.objects.get_or_create(
            nombre="Herramientas Ofimáticas Básicas",
            defaults={
                "descripcion": "Domina herramientas de oficina digitales",
                "duracion_minutos": 60,
                "nivel_dificultad": "basico",
                "orden": 2
            }
        )[0]
        
        # Preguntas de Seguridad Digital
        preguntas_seguridad = [
            {
                "texto": "¿Qué es el phishing?",
                "opciones": {
                    "A": "Un tipo de pez",
                    "B": "Una técnica de pesca",
                    "C": "Un ataque para robar información personal",
                    "D": "Un programa de edición de fotos"
                },
                "respuesta_correcta": "C"
            },
            {
                "texto": "¿Cuál es la característica de una contraseña segura?",
                "opciones": {
                    "A": "Ser tu nombre",
                    "B": "Tener solo números", 
                    "C": "Combinar letras, números y símbolos",
                    "D": "Ser muy corta"
                },
                "respuesta_correcta": "C"
            }
        ]
        
        # Preguntas de Ofimática
        preguntas_ofimatica = [
            {
                "texto": "¿Para qué sirve un procesador de texto?",
                "opciones": {
                    "A": "Para navegar en internet",
                    "B": "Para crear y editar documentos",
                    "C": "Para hacer presentaciones", 
                    "D": "Para manejar bases de datos"
                },
                "respuesta_correcta": "B"
            },
            {
                "texto": "¿Qué permite hacer una hoja de cálculo?",
                "opciones": {
                    "A": "Editar imágenes",
                    "B": "Organizar y analizar datos numéricos",
                    "C": "Programar sitios web",
                    "D": "Enviar correos electrónicos"
                },
                "respuesta_correcta": "B"
            }
        ]
        
        # Crear preguntas
        for pregunta in preguntas_seguridad:
            PreguntaDiagnostico.objects.get_or_create(
                modulo=seguridad,
                texto=pregunta["texto"],
                defaults=pregunta
            )
        
        for pregunta in preguntas_ofimatica:
            PreguntaDiagnostico.objects.get_or_create(
                modulo=ofimatica,
                texto=pregunta["texto"], 
                defaults=pregunta
            )
        
        print(f"✅ Se agregaron {len(preguntas_seguridad) + len(preguntas_ofimatica)} preguntas")
