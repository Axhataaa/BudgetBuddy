from rest_framework import viewsets

from reports.notification_service import create_notification
from reports.models import Notification

from .filters import IncomeFilter
from .models import Income
from .serializers import IncomeSerializer


class IncomeViewSet(viewsets.ModelViewSet):
    """
    Full CRUD on the current user's incomes.

    Mirrors ExpenseViewSet exactly - same get_queryset()/perform_create()
    ownership pattern (API Design Doc §10), same reasoning for 404-not-403
    on cross-user access. Income has no `title` field (only `source`),
    so search_fields only covers `description`.
    """

    serializer_class = IncomeSerializer
    filterset_class = IncomeFilter
    search_fields = ["description"]
    ordering_fields = ["date", "amount", "created_at"]
    ordering = ["-date", "-created_at"]

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        income = serializer.save(user=self.request.user)

        # "Income Added" - reuses the same create_notification() helper
        # every other notification in the app goes through. dedup_key
        # keys off the created income row's own id, so it's inherently
        # unique per income and safe against an accidental duplicate
        # call for the same request.
        create_notification(
            user=self.request.user,
            message=(
                f"Income of ₹{income.amount} added from {income.source}."
            ),
            notification_type=Notification.NotificationType.GENERAL,
            dedup_key=f"income:{income.id}:added",
        )

