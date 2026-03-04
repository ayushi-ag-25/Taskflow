from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserSearchSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    query = request.query_params.get('q', '')

    if len(query) < 2:          # min 2 characters to search
        return Response([])

    users = User.objects.filter(
        username__icontains=query   # search by username
    ).exclude(
        id=request.user.id          # exclude yourself ✅
    )[:10]                          # max 10 results

    serializer = UserSearchSerializer(users, many=True)
    return Response(serializer.data)

