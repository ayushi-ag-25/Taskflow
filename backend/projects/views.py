
from django.db.models import Q


from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .serializers import *
from .permissions import IsOwnerOrMember


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated,IsOwnerOrMember]

    def get_queryset(self):
        queryset= Project.objects.filter(
        Q(owner=self.request.user)
        ).distinct()

        m=self.request.query_params.get('m')
        project_id=self.request.query_params.get('project')

        if project_id:
            clean_id = project_id.strip('/')
            queryset=queryset.filter(id=clean_id)
        elif m:
            queryset = Project.objects.filter(
            memberships__user=self.request.user,
            memberships__status='accepted'
        ).exclude(owner=self.request.user).distinct()
            
        return queryset


    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)



class TaskViewSet(viewsets.ModelViewSet):
    serializer_class=TaskSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        queryset= Task.objects.filter(
            Q(project__owner=self.request.user
        ) | Q(
            project__members=self.request.user,
            project__memberships__status='accepted'
        )).distinct()

        id=self.request.query_params.get('project')
        s=self.request.query_params.get('s')
        project_id=self.request.query_params.get('projectid')

        if s:
            queryset = Task.objects.filter(
            assigned_to=self.request.user
            ).filter(
            Q(project__owner=self.request.user) |  # owner's own projects
            Q(project__memberships__user=self.request.user,
              project__memberships__status='accepted')  # member projects
            ).distinct()

        elif id:
            clean_id = id.strip('/')
            queryset= Task.objects.filter(
            assigned_to=self.request.user,
            project_id=clean_id
        ).distinct()

        elif project_id:
            clean_id = project_id.strip('/')
            queryset=queryset.filter(
                project__owner=self.request.user,
                project_id=clean_id)
        return queryset
        
    
class ProjectMembershipViewSet(viewsets.ModelViewSet):
    serializer_class=ProjectMembershipSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        queryset = ProjectMembership.objects.filter(
            Q(project__owner=user) |  # owner sees all members
            Q(user=user)              # user sees own memberships
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            clean_id = project_id.strip('/')
            queryset = queryset.filter(project_id=clean_id)

        # filter by status if provided
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        return queryset
    
    def perform_create(self, serializer):
        serializer.save(status='accepted')
    

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
    })
        
        
