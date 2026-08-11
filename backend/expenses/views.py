from rest_framework import viewsets

from common.formatting import format_inr
from notifications.notification_service import create_notification
from notifications.models import Notification

from .filters import ExpenseFilter
from .models import Expense
from .serializers import ExpenseSerializer
from budgets.notifications import check_and_notify_budget_alerts


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    Full CRUD on the current user's expenses.

    - get_queryset()/perform_create() follow the exact ownership pattern
      mandated in API Design Doc §10 - identical to every other module's
      ViewSet, so a request for another user's expense returns 404, not
      403 (§10 explains why: 403 would confirm the object exists).
    - Search/filter/sort fields are whitelisted explicitly per §15, not
      left open, so only fields we've deliberately decided are safe and
      useful to query on are exposed.
    """

    serializer_class = ExpenseSerializer
    filterset_class = ExpenseFilter
    search_fields = ["title", "description"]
    ordering_fields = ["date", "amount", "created_at", "title"]
    # Meta.ordering on the model already defaults to newest-first (§ Phase 0);
    # this just makes that the explicit default for the ordering param too.
    ordering = ["-date", "-created_at"]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        expense = serializer.save(user=self.request.user)

        # "Expense Added" - was missing entirely; every other CRUD
        # module (Income, Budget, Savings Goal) already notifies on
        # create via this same create_notification() helper. Mirrors
        # Income Added exactly: fires only on create (not update, same
        # as Income), LOW priority, dedup_key keyed on this specific
        # expense's own id so it's inherently unique and idempotent.
        create_notification(
            user=self.request.user,
            title="Expense Recorded",
            priority=Notification.Priority.LOW,
            message=(
                f"Expense of ₹{format_inr(expense.amount)} added for "
                f"{expense.category}."
            ),
            notification_type=Notification.NotificationType.EXPENSE,
            action_url="/expenses",
            dedup_key=f"expense:{expense.id}:added",
        )

        # Task 2: only the specific budget this expense's category/
        # month/year belongs to can have changed - not a full re-scan
        # of every budget the user has.
        check_and_notify_budget_alerts(
            self.request.user, expense.category, expense.date.month, expense.date.year
        )

    def perform_update(self, serializer):
        expense = serializer.save()
        check_and_notify_budget_alerts(
            self.request.user, expense.category, expense.date.month, expense.date.year
        )

