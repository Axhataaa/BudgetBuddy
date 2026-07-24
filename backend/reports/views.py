from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer, ReportQuerySerializer
from .services import get_report_data


class ReportSummaryView(APIView):
    """
    GET /api/v1/reports/summary/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD

    Single aggregate endpoint for the whole Reports page - same
    "one call, one payload" pattern already used by the dashboard's
    /dashboard/summary/, rather than one round trip per chart.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = ReportQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)

        data = get_report_data(
            user=request.user,
            date_from=query.validated_data["date_from"],
            date_to=query.validated_data["date_to"],
        )
        return Response(data)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only CRUD (list/retrieve) plus two write actions, matching
    the same detail/list @action pattern already used by
    SavingsGoalViewSet's complete-purchase/achievements actions -
    notifications are system-generated (Task 2/3), never created
    directly by the client, so create/update/destroy aren't exposed.
    """

    serializer_class = NotificationSerializer
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
