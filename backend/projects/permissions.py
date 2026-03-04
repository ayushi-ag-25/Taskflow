from rest_framework.permissions import BasePermission

class IsOwnerOrMember(BasePermission):
    def has_object_permission(self,request,view,obj):

        if obj.owner==request.user:
            return True
        if request.method in ['GET'] and request.user in obj.members.all():
            return True
        return False
    