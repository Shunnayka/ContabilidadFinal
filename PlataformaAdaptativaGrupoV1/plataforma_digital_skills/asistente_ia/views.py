# En asistente_ia/views.py
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json

@login_required
def chat_ia(request):
    return render(request, 'asistente/chat_ia.html')

@csrf_exempt
@login_required  
def chat_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message', '').lower().strip()
            
            # SISTEMA DE REGLAS INTELIGENTES
            respuesta = generar_respuesta_inteligente(user_message, request.user)
            
            return JsonResponse({'respuesta': respuesta})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

def generar_respuesta_inteligente(mensaje, usuario):
    """Sistema de reglas para respuestas inteligentes"""
    
    # REGLAS PARA COMPETENCIAS DIGITALES
    if any(palabra in mensaje for palabra in ['contraseña', 'password', 'segura']):
        return "🔐 **Contraseñas Seguras:**\n• Usa al menos 8 caracteres\n• Combina mayúsculas, minúsculas, números y símbolos\n• No uses información personal\n• Ejemplo: 'MiPlataforma2024!'"
    
    elif any(palabra in mensaje for palabra in ['phishing', 'correo falso', 'estafa']):
        return "🚨 **Protección contra Phishing:**\n• Verifica el remitente del correo\n• No hagas clic en enlaces sospechosos\n• Revisa la URL antes de ingresar datos\n• Las empresas legítimas no piden contraseñas por email"
    
    elif any(palabra in mensaje for palabra in ['excel', 'hoja cálculo', 'tablas']):
        return "📊 **Excel Básico:**\n• Usa fórmulas como =SUMA() y =PROMEDIO()\n• Filtra datos con Autofiltro\n• Crea gráficos para visualizar información\n• Ordena datos alfabética o numéricamente"
    
    elif any(palabra in mensaje for palabra in ['word', 'documento', 'texto']):
        return "📝 **Word Básico:**\n• Usa estilos para títulos y párrafos\n• Inserta imágenes y tablas\n• Revisa ortografía automáticamente\n• Configura márgenes y numeración de páginas"
    
    elif any(palabra in mensaje for palabra in ['módulo', 'curso', 'aprender']):
        return "📚 **Módulos Disponibles:**\n• Seguridad Digital - Protege tu información\n• Herramientas Ofimáticas - Domina Word y Excel\n• ¡Completa el diagnóstico para recomendaciones personalizadas!"
    
    elif any(palabra in mensaje for palabra in ['progreso', 'avance', 'resultado']):
        return "📈 **Tu Progreso:**\nRevisa tu panel de progreso para ver:\n• Resultados del diagnóstico\n• Módulos recomendados\n• Porcentaje de completado\n• ¡Sigue aprendiendo!"
    
    elif any(palabra in mensaje for palabra in ['hola', 'hi', 'buenas']):
        return "¡Hola! 👋 Soy tu asistente de competencias digitales. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre:\n• Contraseñas seguras\n• Protección contra phishing\n• Herramientas ofimáticas\n• Tu progreso de aprendizaje"
    
    elif any(palabra in mensaje for palabra in ['gracias', 'thanks', 'agradecer']):
        return "¡De nada! 🐱 Me alegra poder ayudarte. ¿Hay algo más sobre competencias digitales que quieras saber?"
    
    # RESPUESTA POR DEFECTO INTELIGENTE
    else:
        return "🤔 No estoy seguro de entender tu pregunta sobre competencias digitales. Puedo ayudarte con:\n• **Seguridad:** contraseñas, phishing, protección\n• **Ofimática:** Word, Excel, presentaciones\n• **Progreso:** tus resultados y módulos\n• **General:** conceptos digitales básicos\n\n¿En qué tema específico necesitas ayuda?"