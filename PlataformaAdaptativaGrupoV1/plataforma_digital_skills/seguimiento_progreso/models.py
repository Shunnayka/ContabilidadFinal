from django.db import models
from django.contrib.auth.models import User
from modulos_aprendizaje.models import Modulo

class ProgresoUsuario(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE)
    completado = models.BooleanField(default=False)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_completado = models.DateTimeField(null=True, blank=True)
    porcentaje_completado = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['usuario', 'modulo']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.modulo.nombre} ({self.porcentaje_completado}%)"