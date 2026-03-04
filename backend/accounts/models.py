from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    role_choices=[
        ('admin','Admin'),
        ('manager','Manager'),
        ('member','Member')
    ]

    role=models.CharField(
        max_length=20,
        choices=role_choices,
        default='member'
    )

    def __str__(self):
        return self.username

# Create your models here.
