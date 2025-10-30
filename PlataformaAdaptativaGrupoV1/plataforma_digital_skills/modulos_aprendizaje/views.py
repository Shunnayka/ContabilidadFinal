from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.contrib import messages
from .models import Modulo, ContenidoModulo
from seguimiento_progreso.models import ProgresoUsuario

@login_required
def lista_modulos(request):
    modulos = Modulo.objects.all().order_by('orden')
    
    # Obtener el progreso del usuario para cada módulo
    modulos_con_progreso = []
    for modulo in modulos:
        try:
            progreso = ProgresoUsuario.objects.get(usuario=request.user, modulo=modulo)
            modulo.esta_completado = progreso.completado
            modulo.porcentaje_completado = progreso.porcentaje_completado
        except ProgresoUsuario.DoesNotExist:
            modulo.esta_completado = False
            modulo.porcentaje_completado = 0
        
        modulos_con_progreso.append(modulo)
    
    return render(request, 'modulos/lista_modulos.html', {
        'modulos': modulos_con_progreso
    })

@login_required
def detalle_modulo(request, modulo_id):
    """Ver el contenido de un módulo específico"""
    modulo = get_object_or_404(Modulo, id=modulo_id)
    contenidos = ContenidoModulo.objects.filter(modulo=modulo).order_by('id')
    
    # Obtener o crear progreso
    progreso, created = ProgresoUsuario.objects.get_or_create(
        usuario=request.user,
        modulo=modulo
    )
    
    # Verificar si el módulo ya está completado
    modulo_completado = progreso.completado
    
    return render(request, 'modulos/detalle_modulo.html', {
        'modulo': modulo,
        'contenidos': contenidos,
        'progreso': progreso,
        'modulo_completado': modulo_completado
    })

@login_required
def completar_modulo(request, modulo_id):
    """Marcar módulo como completado"""
    modulo = get_object_or_404(Modulo, id=modulo_id)
    
    # Actualizar progreso
    progreso, created = ProgresoUsuario.objects.get_or_create(
        usuario=request.user,
        modulo=modulo
    )
    
    progreso.completado = True
    progreso.porcentaje_completado = 100
    progreso.fecha_completado = timezone.now()
    progreso.save()
    
    messages.success(request, f'¡Felicidades! Has completado el módulo "{modulo.nombre}"')
    return redirect('lista_modulos')