from rest_framework import viewsets

from .filters import ExpenseFilter
from .models import Expense
from .serializers import ExpenseSerializer


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
        serializer.save(user=self.request.user)

