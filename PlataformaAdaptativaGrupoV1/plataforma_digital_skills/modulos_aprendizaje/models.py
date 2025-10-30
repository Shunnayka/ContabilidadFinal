from django.db import models

class Modulo(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    duracion_minutos = models.IntegerField()
    nivel_dificultad = models.CharField(max_length=20, choices=[
        ('basico', 'Básico'),
        ('intermedio', 'Intermedio'), 
        ('avanzado', 'Avanzado')
    ])
    orden = models.IntegerField(default=1)
    
    def __str__(self):
        return self.nombre

class ContenidoModulo(models.Model):
    modulo = models.ForeignKey(Modulo, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    tipo = models.CharField(max_length=20, choices=[
        ('teoria', 'Teoría'),
        ('ejemplo', 'Ejemplo'),
        ('actividad', 'Actividad')
    ])
    
    def __str__(self):
        return f"{self.modulo.nombre} - {self.titulo}"