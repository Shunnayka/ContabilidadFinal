from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import PreguntaDiagnostico, ResultadoDiagnostico
from seguimiento_progreso.models import ProgresoUsuario

@login_required
def diagnostico(request):
    # Obtener módulo específico si se pasa por parámetro
    modulo_id = request.GET.get('modulo')
    modulo = None
    if modulo_id:
        from modulos_aprendizaje.models import Modulo
        try:
            modulo = Modulo.objects.get(id=modulo_id)
        except Modulo.DoesNotExist:
            modulo = None
    
    # ⚠️ REDIRIGIR SI NO HAY MÓDULO ESPECÍFICO
    if not modulo:
        messages.warning(request, 'Por favor selecciona un módulo para realizar la evaluación.')
        return redirect('lista_modulos')
    
    if request.method == 'POST':
        print("🔍 INICIANDO PROCESAMIENTO POST...")
        print(f"📨 Datos POST recibidos: {list(request.POST.keys())}")
        
        # Procesar respuestas
        puntajes = {}
        modulo_evaluado = None
        
        for key, value in request.POST.items():
            if key.startswith('pregunta_'):
                pregunta_id = key.split('_')[1]
                print(f"🔍 Procesando pregunta ID: {pregunta_id}, respuesta: {value}")
                
                pregunta = PreguntaDiagnostico.objects.get(id=pregunta_id)
                modulo = pregunta.modulo
                modulo_evaluado = modulo
                
                print(f"   Módulo: {modulo.nombre} (ID: {modulo.id})")
                print(f"   Respuesta correcta: {pregunta.respuesta_correcta}")
                
                if modulo.id not in puntajes:
                    puntajes[modulo.id] = {'correctas': 0, 'total': 0}
                    print(f"   Nuevo módulo en puntajes: {modulo.id}")
                
                puntajes[modulo.id]['total'] += 1
                if value == pregunta.respuesta_correcta:
                    puntajes[modulo.id]['correctas'] += 1
                    print(f"   ✅ Respuesta CORRECTA")
                else:
                    print(f"   ❌ Respuesta INCORRECTA")
        
        print(f"📊 Puntajes calculados: {puntajes}")
        
        # Guardar resultados y actualizar progreso
        for modulo_id, resultado in puntajes.items():
            porcentaje = (resultado['correctas'] / resultado['total']) * 100
            print(f"🎯 Módulo {modulo_id}: {resultado['correctas']}/{resultado['total']} = {porcentaje}%")
            
            ResultadoDiagnostico.objects.create(
                usuario=request.user,
                modulo_id=modulo_id,
                puntaje=porcentaje,
                necesita_refuerzo=porcentaje < 70
            )
            
            # ACTUALIZAR PROGRESO - Marcar como completado si aprueba
            progreso, created = ProgresoUsuario.objects.get_or_create(
                usuario=request.user,
                modulo_id=modulo_id
            )
            
            if porcentaje >= 70:  # Si aprueba con 70% o más
                progreso.completado = True
                progreso.porcentaje_completado = 100
                progreso.save()
                print(f"✅ Módulo {modulo_id} MARCADO COMO COMPLETADO")
            else:
                progreso.porcentaje_completado = porcentaje
                progreso.save()
                print(f"📚 Módulo {modulo_id} EN PROGRESO: {porcentaje}%")
        
        # Redirigir al módulo completado o al progreso
        if modulo_evaluado and modulo_evaluado.id in puntajes:
            porcentaje_modulo = (puntajes[modulo_evaluado.id]['correctas'] / puntajes[modulo_evaluado.id]['total']) * 100
            if porcentaje_modulo >= 70:
                return redirect('detalle_modulo', modulo_id=modulo_evaluado.id)
        
        return redirect('panel_progreso')
    
    else:
        # MOSTRAR PREGUNTAS FILTRADAS POR MÓDULO
        preguntas = PreguntaDiagnostico.objects.filter(modulo=modulo)
        print(f"🔍 Mostrando {preguntas.count()} preguntas del módulo: {modulo.nombre}")
            
        return render(request, 'evaluacion/diagnostico.html', {
            'preguntas': preguntas,
            'modulo_especifico': modulo
        })