from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User

from notifications.models import Notification
from notifications.notification_service import create_notification

from .logout_serializer import LogoutSerializer
from .google_auth import GoogleAuthenticationError, authenticate_google_credential, get_or_create_google_user
from .token_serializer import RoleAwareTokenObtainPairSerializer
from .serializers import (
    ChangePasswordSerializer,
    ConfirmPasswordResetSerializer,
    DeleteAccountSerializer,
    ProfileSerializer,
    RegisterSerializer,
    RequestPasswordResetSerializer,
    UserListSerializer,
)
from .permissions import IsAdmin
from .email_verification_service import (
    VerificationError,
    can_resend,
    generate_verification_token,
    send_verification_email,
    verify_token,
)
from .password_reset_service import (
    PasswordResetError,
    can_request_password_reset,
    generate_password_reset_token,
    reset_password,
    send_password_reset_email,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get("credential", "")
        mode = request.data.get("mode", "login")

        if mode not in {"login", "register"}:
            return Response(
                {
                    "error": {
                        "code": "invalid_mode",
                        "message": "Invalid Google authentication mode.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            email, first_name, last_name = authenticate_google_credential(credential)

            existing_user = User.objects.filter(email__iexact=email).first()

            if mode == "login" and existing_user is None:
                return Response(
                    {
                        "error": {
                            "code": "account_not_found",
                            "message": (
                                "No account is registered with this Google email. "
                                "Please create an account first."
                            ),
                        }
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

            if mode == "register" and existing_user is not None:
                return Response(
                    {
                        "error": {
                            "code": "account_exists",
                            "message": (
                                "An account with this email already exists. "
                                "Please log in instead."
                            ),
                        }
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            user, created = get_or_create_google_user(
                email,
                first_name,
                last_name,
            )

        except GoogleAuthenticationError as exc:
            return Response(
                {
                    "error": {
                        "code": "google_authentication_failed",
                        "message": str(exc),
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RoleAwareTokenObtainPairSerializer.get_token(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_new_user": created,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Logout successful."},
            status=status.HTTP_205_RESET_CONTENT,
        )


class ProfileView(generics.RetrieveUpdateAPIView):

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user.profile


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])

        # Post-success confirmation for an already-authenticated password
        # change. Distinct from the password RESET flow (mandatory,
        # preference-independent transactional email in
        # password_reset_service.py) - this is a preference-controlled
        # Important Notification. No dedup_key is used: there is no
        # genuine operation-specific identifier for a password change (no
        # entity row is created, unlike expense/income/budget/goal events
        # elsewhere in the codebase), and a synthetic timestamp-based key
        # would risk colliding two distinct legitimate changes together.
        # create_notification's no-dedup path already gives exactly the
        # required behavior: this single successful request creates exactly
        # one notification and triggers at most one email, and any later
        # request - legitimate or not - simply creates its own new one.
        create_notification(
            user=request.user,
            title="Password Changed",
            message="Your BudgetBuddy password was changed successfully.",
            notification_type=Notification.NotificationType.ADMIN,
            priority=Notification.Priority.HIGH,
            action_url="/settings",
        )

        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):


    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.delete()

        return Response(
            {"message": "Your account has been permanently deleted."},
            status=status.HTTP_200_OK,
        )
    

class UserListView(generics.ListAPIView):

    # Admin-only endpoint to list all registered users.

    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return User.objects.select_related("profile").order_by("id")


class VerifyEmailView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token", "")
        if not token:
            return Response(
                {"error": {"code": "missing_token", "message": "A verification token is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verify_token(token)
        except VerificationError as exc:
            return Response(
                {"error": {"code": exc.code, "message": exc.message}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Email verified successfully."},
            status=status.HTTP_200_OK,
        )


class ResendVerificationEmailView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        if profile.email_verified:
            return Response(
                {"message": "Your email is already verified."},
                status=status.HTTP_200_OK,
            )

        allowed, seconds_remaining = can_resend(request.user)
        if not allowed:
            return Response(
                {
                    "error": {
                        "code": "cooldown",
                        "message": f"Please wait {seconds_remaining}s before requesting another verification email.",
                    }
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        raw_token = generate_verification_token(request.user)
        send_verification_email(request.user, raw_token)

        return Response(
            {"message": "Verification email sent."},
            status=status.HTTP_200_OK,
        )


class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
        ).first()

        # Always return the same response so we don't reveal
        # whether an account exists with this email.
        if user is not None:
            allowed, seconds_remaining = can_request_password_reset(user)

            if allowed:
                raw_token = generate_password_reset_token(user)
                send_password_reset_email(user, raw_token)

        return Response(
            {
                "message": "If an account exists with this email, "
                "a password reset link has been sent."
            },
            status=status.HTTP_200_OK,
        )


class ConfirmPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reset_password(
                serializer.validated_data["token"],
                serializer.validated_data["new_password"],
            )
        except PasswordResetError as exc:
            return Response(
                {
                    "error": {
                        "code": exc.code,
                        "message": exc.message,
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )