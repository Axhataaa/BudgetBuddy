from rest_framework.permissions import BasePermission
from .models import Profile


class IsAdmin(BasePermission):
    """
    Allows access only to administrators.
    """

    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and (
                request.user.is_superuser
                or (
                    hasattr(request.user, "profile")
                    and request.user.profile.role == Profile.Role.ADMIN
                )
            )
        )


class IsStudent(BasePermission):
    message = "Only students can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == Profile.Role.STUDENT
        )


class IsBusinessOwner(BasePermission):
    message = "Only business owners can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == Profile.Role.BUSINESS_OWNER
        )


class IsFreelancer(BasePermission):
    message = "Only freelancers can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == Profile.Role.FREELANCER
        )


class IsWorkingProfessional(BasePermission):
    message = "Only working professionals can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "profile")
            and request.user.profile.role == Profile.Role.WORKING_PROFESSIONAL
        )