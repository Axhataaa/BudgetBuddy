from django.urls import path
from .views import (
    ChangePasswordView,
    ConfirmPasswordResetView,
    DeleteAccountView,
    LogoutView,
    GoogleLoginView,
    ProfileView,
    RegisterView,
    RequestPasswordResetView,
    ResendVerificationEmailView,
    UserListView,
    VerifyEmailView,
)
from .token_serializer import RoleAwareTokenObtainPairView

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", RoleAwareTokenObtainPairView.as_view(), name="login"),
    path("google-login/", GoogleLoginView.as_view(), name="google-login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", ProfileView.as_view(), name="profile-me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("delete-account/", DeleteAccountView.as_view(), name="delete-account"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification/", ResendVerificationEmailView.as_view(), name="resend-verification"),
    path("password-reset/", RequestPasswordResetView.as_view(), name="password-reset"),
    path("password-reset/confirm/", ConfirmPasswordResetView.as_view(), name="password-reset-confirm"),
    path("", UserListView.as_view(), name="user-list"),
]