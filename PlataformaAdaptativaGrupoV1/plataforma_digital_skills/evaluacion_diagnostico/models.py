from django.db import models
from django.contrib.auth.models import User
from modulos_aprendizaje.models import Modulo

class PreguntaDiagnostico(models.Model):
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE)
    texto = models.TextField()
    opciones = models.JSONField()  # {"A": "Opción 1", "B": "Opción 2", ...}
    respuesta_correcta = models.CharField(max_length=1)  # A, B, C, etc.
    
    def __str__(self):
        return f"{self.modulo.nombre}: {self.texto[:50]}..."

class ResultadoDiagnostico(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE)
    puntaje = models.IntegerField()
    fecha = models.DateTimeField(auto_now_add=True)
    necesita_refuerzo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.usuario.username} - {self.modulo.nombre}: {self.puntaje}"