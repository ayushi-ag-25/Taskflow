from rest_framework import serializers
###########from .models import User
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=[
            'id',
            'username',
            'email',
            'role',
        ]
