
from django.contrib import admin
from django.urls import path,include
from django.contrib.auth import views as auth_views
from projects.views import *
from accounts.views import search_users
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from rest_framework_simplejwt.views import TokenBlacklistView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'api/projects', ProjectViewSet, basename='project')
router.register(r'api/tasks',TaskViewSet,basename='task')
router.register(r'api/projectMembership',ProjectMembershipViewSet,basename='ProjectMembership')



urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/me/', me),
    path('login/',auth_views.LoginView.as_view(template_name='login.html'),name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('users/search/',search_users),
    path('api/token/blacklist/', TokenBlacklistView.as_view()),
    path('api/token/',TokenObtainPairView.as_view(),name='token_obtain_pair'),
    path('api/token/refresh',TokenRefreshView.as_view(),name='token_refresh'),

    path('', include(router.urls)),

]


