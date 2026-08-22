import secrets

from django.conf import settings
from django.core.management import call_command
from rest_framework import exceptions, mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import NotificationFilter
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.DestroyModelMixin,
    viewsets.ReadOnlyModelViewSet,
):

    serializer_class = NotificationSerializer
    filterset_class = NotificationFilter
    ordering = ["-created_at"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."})

    @action(detail=False, methods=["delete"], url_path="clear-all")
    def clear_all(self, request):

        self.get_queryset().delete()
        return Response({"message": "All notifications cleared."})


SCHEDULED_JOB_COMMANDS = {
    "savings": "send_savings_reminders",
    "monthly": "generate_monthly_report_notifications",
}


class RunScheduledTaskView(APIView):
    """
    Server-to-server trigger for scheduled notification jobs, called by a
    GitHub Actions cron workflow (Render Free has no built-in scheduler).
    Authenticated exclusively via the X-Scheduled-Task-Secret header - never
    by JWT/session, since there is no human user on this request.
    """

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        configured_secret = settings.SCHEDULED_TASK_SECRET
        if not configured_secret:
            # Fail closed: an unset server-side secret must never be
            # treated as "no auth required".
            raise exceptions.PermissionDenied("Scheduled task endpoint is not configured.")

        provided_secret = request.headers.get("X-Scheduled-Task-Secret", "")
        if not secrets.compare_digest(provided_secret, configured_secret):
            raise exceptions.AuthenticationFailed("Invalid scheduled task credentials.")

        job = request.query_params.get("job")
        command_name = SCHEDULED_JOB_COMMANDS.get(job)
        if command_name is None:
            raise exceptions.ValidationError({"job": "Must be 'savings' or 'monthly'."})

        call_command(command_name)

        return Response({"job": job, "command": command_name, "status": "completed"})
