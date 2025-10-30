from django.contrib.auth.models import User
from django.db import models

class PerfilUsuario(models.Model):
    # Opciones para nivel digital
    NIVELES_DIGITALES = [
        ('principiante', 'Principiante'),
        ('intermedio', 'Intermedio'),
        ('avanzado', 'Avanzado'),
    ]
    
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    empresa = models.CharField(max_length=100)
    puesto = models.CharField(max_length=100)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    nivel_digital = models.CharField(
        max_length=20, 
        choices=NIVELES_DIGITALES,  # ← Esto hace que aparezca como dropdown
        default='principiante'
    )
    
    def __str__(self):
        return f"{self.usuario.username} - {self.empresa}"