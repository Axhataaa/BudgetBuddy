from django.urls import path
from .views import (
    ChangePasswordView,
    LogoutView,
    ProfileView,
    RegisterView,
    UserListView,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", ProfileView.as_view(), name="profile-me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("", UserListView.as_view(), name="user-list"),
]