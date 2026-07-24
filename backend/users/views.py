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