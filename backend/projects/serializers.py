from rest_framework import serializers
from .models import *
from accounts.serializers import UserSearchSerializer

class TaskSerializer(serializers.ModelSerializer):
    assigned_user_detail=UserSearchSerializer(read_only=True,source='assigned_to')
    project_name = serializers.CharField(source='project.name', read_only=True)
    class Meta:
        model=Task
        fields='__all__'


class ProjectMembershipSerializer(serializers.ModelSerializer):
    user_detail=UserSearchSerializer(read_only=True,source='user')
    
    class Meta:
        model = ProjectMembership
        fields = [
            'id',
            'user',         # ← for sending (just id)
            'user_detail',  # ← for receiving (full info) 
            'project',
            'status',
            'invited_at',
            'accepted_at'
        ]
        read_only_fields = ['invited_at', 'accepted_at',  'user_detail']
        
        

class ProjectSerializer(serializers.ModelSerializer):
    tasks=TaskSerializer(many=True,read_only=True)
    members = ProjectMembershipSerializer(many=True, read_only=True, source='memberships')
    owner_detail = serializers.SerializerMethodField()  # ← add this

    def get_owner_detail(self, obj):
        return {
            'id': obj.owner.id,
            'username': obj.owner.username
        }


    class Meta:
        model=Project
        fields='__all__'
        read_only_fields = ['owner']


