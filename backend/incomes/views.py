from rest_framework import viewsets

from notifications.notification_service import sync_entity_notification
from notifications.models import Notification

from .filters import IncomeFilter
from .models import Income
from .serializers import IncomeSerializer


class IncomeViewSet(viewsets.ModelViewSet):

    serializer_class = IncomeSerializer
    filterset_class = IncomeFilter
    search_fields = ["description"]
    ordering_fields = ["date", "amount", "created_at"]
    ordering = ["-date", "-created_at"]

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        income = serializer.save(user=self.request.user)


        sync_entity_notification(
            user=self.request.user,
            title="Income Added",
            priority=Notification.Priority.LOW,
            message=f"Income received from {income.source}.",
            notification_type=Notification.NotificationType.INCOME,
            action_url="/income",
            dedup_key=f"income:{income.id}:added",
            income=income,
        )

    def perform_update(self, serializer):
        income = serializer.save()

        sync_entity_notification(
            user=self.request.user,
            title="Income Added",
            priority=Notification.Priority.LOW,
            message=f"Income received from {income.source}.",
            notification_type=Notification.NotificationType.INCOME,
            action_url="/income",
            dedup_key=f"income:{income.id}:added",
            income=income,
        )
