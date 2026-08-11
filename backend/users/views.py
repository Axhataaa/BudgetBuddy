from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User

from .logout_serializer import LogoutSerializer
from .serializers import (
    ChangePasswordSerializer,
    DeleteAccountSerializer,
    ProfileSerializer,
    RegisterSerializer,
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


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


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
    """
    GET/PATCH /api/v1/users/me/

    Accepts multipart (when profile_picture is included) or JSON
    (everything else) per API Design Doc §18.
    """

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
        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    """
    POST /api/v1/users/delete-account/

    Permanently deletes the authenticated user, requiring either their
    current password or the literal text "DELETE" as confirmation
    (Settings > Danger Zone). Deleting the User row cascades (all
    user-owned models use on_delete=models.CASCADE) to Profile,
    Expenses, Incomes, Budgets, SavingsGoals and their
    SavingsTransactions - nothing is left orphaned, and there is no
    undo.
    """

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
    """
    Admin-only endpoint to list all registered users.
    """

    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return User.objects.select_related("profile").all()


class VerifyEmailView(APIView):
    """
    POST /api/v1/users/verify-email/  body: {"token": "<raw token>"}

    AllowAny (not IsAuthenticated) - a freshly registered user clicking
    the link in their inbox may not have an active session in whatever
    browser/device they're checking email from, and there's no reason
    to require one: the token itself, not the request's auth state, is
    what proves the request is legitimate (see
    email_verification_service.verify_token()'s own docstring for the
    validation chain - hash lookup, single-use, expiry, and the
    still-matches-current-email check).
    """

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
    """
    POST /api/v1/users/resend-verification/

    IsAuthenticated, and deliberately takes NO email address in the
    request body - it always uses request.user.email, the caller's own
    current registered address, so there is no way to make this
    endpoint send a verification email to anyone else's inbox.
    """

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