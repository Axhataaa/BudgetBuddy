from rest_framework import viewsets

from notifications.notification_service import sync_entity_notification
from notifications.models import Notification

from .filters import ExpenseFilter
from .models import Expense
from .serializers import ExpenseSerializer
from budgets.notifications import check_and_notify_budget_alerts


class ExpenseViewSet(viewsets.ModelViewSet):


    serializer_class = ExpenseSerializer
    filterset_class = ExpenseFilter
    search_fields = ["title", "description"]
    ordering_fields = ["date", "amount", "created_at", "title"]

    ordering = ["-date", "-created_at"]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)

        ordering_param = self.request.query_params.get("ordering")
        if ordering_param == "date":
            queryset = queryset.order_by("date", "created_at")
        elif ordering_param == "-date":
            queryset = queryset.order_by("-date", "-created_at")

        return queryset

    def perform_create(self, serializer):
        expense = serializer.save(user=self.request.user)


        sync_entity_notification(
            user=self.request.user,
            title="Expense Recorded",
            priority=Notification.Priority.LOW,
            message=f"Expense added for {expense.category}.",
            notification_type=Notification.NotificationType.EXPENSE,
            action_url="/expenses",
            dedup_key=f"expense:{expense.id}:added",
            expense=expense,
        )


        check_and_notify_budget_alerts(
            self.request.user, expense.category, expense.date.month, expense.date.year
        )

    def perform_update(self, serializer):
        expense = serializer.save()

        sync_entity_notification(
            user=self.request.user,
            title="Expense Recorded",
            priority=Notification.Priority.LOW,
            message=f"Expense added for {expense.category}.",
            notification_type=Notification.NotificationType.EXPENSE,
            action_url="/expenses",
            dedup_key=f"expense:{expense.id}:added",
            expense=expense,
        )

        check_and_notify_budget_alerts(
            self.request.user, expense.category, expense.date.month, expense.date.year
        )

