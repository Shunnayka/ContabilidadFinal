from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import ProgresoUsuario
from evaluacion_diagnostico.models import ResultadoDiagnostico
from modulos_aprendizaje.models import Modulo

@login_required
def panel_progreso(request):
    # Obtener el progreso actual de cada módulo
    progreso = ProgresoUsuario.objects.filter(usuario=request.user)
    
    # Obtener solo los RESULTADOS MÁS RECIENTES de cada módulo
    resultados_recientes = []
    modulos_con_resultado = set()
    
    # Ordenar resultados por fecha (más reciente primero) y tomar el más reciente de cada módulo
    todos_resultados = ResultadoDiagnostico.objects.filter(
        usuario=request.user
    ).order_by('-fecha')  # Ordenar por fecha descendente
    
    for resultado in todos_resultados:
        if resultado.modulo.id not in modulos_con_resultado:
            resultados_recientes.append(resultado)
            modulos_con_resultado.add(resultado.modulo.id)
    
    # Obtener módulos recomendados (los que no están completados o tienen bajo progreso)
    modulos_recomendados = Modulo.objects.exclude(
        id__in=progreso.filter(completado=True).values_list('modulo_id', flat=True)
    )
    
    return render(request, 'progreso/panel_progreso.html', {
        'progreso': progreso,
        'resultados': resultados_recientes,  # Solo los más recientes
        'modulos_recomendados': modulos_recomendados
    })