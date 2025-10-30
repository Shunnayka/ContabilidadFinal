from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
import os
from django.conf import settings

def generar_certificado(usuario, modulo):
    """Genera un certificado PDF personalizado"""
    
    # Crear nombre de archivo
    filename = f"certificado_{usuario.username}_{modulo.id}.pdf"
    filepath = os.path.join(settings.MEDIA_ROOT, 'certificados', filename)
    
    # Crear directorio si no existe
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Crear PDF
    c = canvas.Canvas(filepath, pagesize=landscape(A4))
    width, height = landscape(A4)
    
    # Fondo decorativo
    c.setFillColor(HexColor('#f8f9fa'))
    c.rect(0, 0, width, height, fill=1)
    
    # Borde decorativo
    c.setStrokeColor(HexColor('#3498db'))
    c.setLineWidth(3)
    c.rect(1*cm, 1*cm, width-2*cm, height-2*cm, stroke=1, fill=0)
    
    # Logo o icono
    c.setFillColor(HexColor('#3498db'))
    c.setFont("Helvetica-Bold", 48)
    c.drawCentredString(width/2, height-4*cm, "🎓")
    
    # Título
    c.setFillColor(HexColor('#2c3e50'))
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width/2, height-6*cm, "CERTIFICADO DE COMPLETACIÓN")
    
    # Texto del certificado
    c.setFont("Helvetica", 16)
    c.drawCentredString(width/2, height-8*cm, "Se otorga el presente certificado a:")
    
    # Nombre del usuario
    c.setFillColor(HexColor('#e74c3c'))
    c.setFont("Helvetica-Bold", 20)
    nombre_completo = usuario.get_full_name() or usuario.username
    c.drawCentredString(width/2, height-10*cm, nombre_completo)
    
    # Texto de completación
    c.setFillColor(HexColor('#2c3e50'))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width/2, height-12*cm, "Por haber completado satisfactoriamente el módulo:")
    
    # Nombre del módulo
    c.setFillColor(HexColor('#3498db'))
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(width/2, height-14*cm, f'"{modulo.nombre}"')
    
    # Descripción
    c.setFillColor(HexColor('#7f8c8d'))
    c.setFont("Helvetica", 12)
    descripcion = modulo.descripcion[:80] + "..." if len(modulo.descripcion) > 80 else modulo.descripcion
    c.drawCentredString(width/2, height-16*cm, descripcion)
    
    # Fecha y firma
    from datetime import datetime
    fecha = datetime.now().strftime("%d de %B de %Y")
    c.setFillColor(HexColor('#2c3e50'))
    c.setFont("Helvetica", 10)
    c.drawCentredString(width/2, 3*cm, f"Emitido el {fecha}")
    c.drawCentredString(width/2, 2*cm, "Plataforma Digital Skills - Competencias Digitales")
    
    c.save()
    
    return filepath