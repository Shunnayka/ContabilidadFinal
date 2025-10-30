from django.shortcuts import render, get_object_or_404
from django.http import FileResponse
from django.contrib.auth.decorators import login_required
import os
from modulos_aprendizaje.models import Modulo
from seguimiento_progreso.models import ProgresoUsuario

@login_required
def lista_certificados(request):
    """Mostrar todos los certificados disponibles"""
    
    # Obtener todos los progresos completados del usuario
    progresos_completados = ProgresoUsuario.objects.filter(
        usuario=request.user,
        completado=True
    )
    
    # Extraer los módulos de esos progresos
    modulos_completados = [progreso.modulo for progreso in progresos_completados]
    
    return render(request, 'certificados/lista_certificados.html', {
        'modulos_completados': modulos_completados
    })

@login_required
def ver_certificado(request, modulo_id):
    """Vista previa del certificado antes de descargar"""
    modulo = get_object_or_404(Modulo, id=modulo_id)
    
    # Verificar si el usuario completó el módulo
    try:
        progreso = ProgresoUsuario.objects.get(
            usuario=request.user, 
            modulo=modulo, 
            completado=True
        )
    except ProgresoUsuario.DoesNotExist:
        return render(request, 'certificados/error.html', {
            'mensaje': 'Debes completar el módulo antes de ver el certificado.'
        })
    
    return render(request, 'certificados/ver_certificado.html', {
        'modulo': modulo,
        'usuario': request.user
    })

@login_required
def generar_certificado_view(request, modulo_id):
    """Descargar el certificado PDF"""
    modulo = get_object_or_404(Modulo, id=modulo_id)
    
    # Verificar si el usuario completó el módulo
    try:
        progreso = ProgresoUsuario.objects.get(
            usuario=request.user, 
            modulo=modulo, 
            completado=True
        )
    except ProgresoUsuario.DoesNotExist:
        return render(request, 'certificados/error.html', {
            'mensaje': 'Debes completar el módulo antes de generar el certificado.'
        })
    
    # Generar certificado PDF REAL
    from .utils import generar_certificado
    certificado_path = generar_certificado(request.user, modulo)
    
    # Servir el archivo PDF para descarga
    response = FileResponse(
        open(certificado_path, 'rb'),
        content_type='application/pdf'
    )
    response['Content-Disposition'] = f'attachment; filename=\"certificado_{modulo.nombre}.pdf\"'
    
    return response