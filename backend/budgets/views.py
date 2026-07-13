from rest_framework import viewsets

from .filters import BudgetFilter
from .models import Budget
from .serializers import BudgetSerializer


class BudgetViewSet(viewsets.ModelViewSet):
    """
    Full CRUD on the current user's budgets. Same ownership pattern as
    ExpenseViewSet/IncomeViewSet (API Design Doc §10) - only SavingsGoal
    (the other model in this app) is out of scope for this slice.
    """

    serializer_class = BudgetSerializer
    filterset_class = BudgetFilter
    search_fields = ["category"]
    ordering_fields = ["year", "month", "category", "monthly_limit"]
    ordering = ["-year", "-month", "category"]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

