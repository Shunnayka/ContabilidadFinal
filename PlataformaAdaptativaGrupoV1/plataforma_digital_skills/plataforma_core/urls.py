from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('gestion_usuarios.urls')),
    path('modulos/', include('modulos_aprendizaje.urls')),
    path('evaluacion/', include('evaluacion_diagnostico.urls')),
    path('progreso/', include('seguimiento_progreso.urls')),
    path('certificados/', include('certificacion_digital.urls')),
    path('asistente/', include('asistente_ia.urls')),
    path('panel/', include('panel_control.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)