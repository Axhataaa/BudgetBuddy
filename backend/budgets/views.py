from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.utils import timezone

from reports.notification_service import create_notification
from reports.models import Notification

from .filters import BudgetFilter
from .models import (
    Budget,
    SavingsGoal,
    SavingsTransaction,
)

from .serializers import (
    BudgetSerializer,
    BudgetSummarySerializer,
    SavingsGoalSerializer,
    SavingsTransactionSerializer,
)

from decimal import Decimal
from django.db.models import Sum
from expenses.models import Expense


class BudgetViewSet(viewsets.ModelViewSet):
    """
    Full CRUD on the current user's budgets.
    """

    lookup_value_regex = r"\d+"

    serializer_class = BudgetSerializer
    filterset_class = BudgetFilter
    search_fields = ["category"]
    ordering_fields = ["year", "month", "category", "monthly_limit"]
    ordering = ["-year", "-month", "category"]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


    @action(
        detail=False,
        methods=["get"],
        url_path="summary",
    )
    def summary(self, request):

        budgets = self.get_queryset()

        summary = []

        for budget in budgets:

            total_expense = (
                Expense.objects.filter(
                    user=request.user,
                    category=budget.category,
                    date__month=budget.month,
                    date__year=budget.year,
                ).aggregate(
                    total=Sum("amount")
                )["total"]
                or Decimal("0.00")
            )

            remaining_budget = budget.monthly_limit - total_expense

            overspent_amount = Decimal("0.00")

            if remaining_budget < 0:
                overspent_amount = abs(remaining_budget)
                remaining_budget = Decimal("0.00")

            usage_percentage = (
                round((total_expense / budget.monthly_limit) * 100, 2)
                if budget.monthly_limit > 0
                else Decimal("0.00")
            )

            is_overspent = usage_percentage >= 100

            if is_overspent:
                alert = (
                    f"Budget exceeded for {budget.get_category_display()} "
                    f"by ₹{overspent_amount}."
                )
            elif usage_percentage >= 90:
                alert = (
                    f"Warning: You have used {usage_percentage}% "
                    f"of your {budget.get_category_display()} budget."
                )
            else:
                alert = None

            summary.append(
                {
                    "category": budget.category,
                    "budget_amount": budget.monthly_limit,
                    "total_expense": total_expense,
                    "remaining_budget": remaining_budget,
                    "overspent_amount": overspent_amount,
                    "usage_percentage": usage_percentage,
                    "is_overspent": is_overspent,
                    "alert": alert,
                }
            )

        serializer = BudgetSummarySerializer(
            summary,
            many=True,
        )

        return Response(serializer.data)

class SavingsGoalViewSet(viewsets.ModelViewSet):
    """
    Full CRUD on the current user's savings goals.
    """

    lookup_value_regex = r"\d+"

    serializer_class = SavingsGoalSerializer

    search_fields = [
        "goal_name",
        "description",
    ]

    ordering_fields = [
        "goal_name",
        "target_amount",
        "current_amount",
        "target_date",
        "created_at",
    ]

    ordering = [
        "target_date",
        "-created_at",
    ]

    def get_queryset(self):
        queryset = SavingsGoal.objects.filter(user=self.request.user)

        # Only the list endpoint (the main Savings Goals page) should
        # exclude archived/purchased goals - retrieve, update, destroy,
        # and the complete-purchase action all need to reach an already-
        # archived goal by id (e.g. deleting an achievement from the
        # Achievements page, which is just an archived SavingsGoal row).
        if self.action == "list":
            queryset = queryset.filter(is_archived=False)

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="complete-purchase",
    )
    def complete_purchase(self, request, pk=None):
        goal = self.get_object()

        if not goal.is_completed:
            return Response(
                {
                    "error": "Goal has not reached its target yet."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if goal.is_purchased:
            return Response(
                {
                    "error": "Goal is already marked as purchased."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        goal.is_purchased = True
        goal.is_archived = True
        goal.purchase_date = (
            request.data.get("purchase_date")
            or timezone.now().date()
        )
        goal.purchase_note = request.data.get(
            "purchase_note",
            "",
        )

        goal.save(
            update_fields=[
                "is_purchased",
                "is_archived",
                "purchase_date",
                "purchase_note",
                "updated_at",
            ]
        )

        create_notification(
            user=request.user,
            message=(
                f'You marked "{goal.goal_name}" as purchased. '
                f"Find it in your Achievements."
            ),
            notification_type=Notification.NotificationType.SAVINGS_GOAL,
            dedup_key=f"savings_goal:{goal.id}:purchased",
        )

        return Response(
            SavingsGoalSerializer(goal).data,
            status=status.HTTP_200_OK,
        )
    
    @action(
        detail=False,
        methods=["get"],
        url_path="achievements",
    )
    def achievements(self, request):
        queryset = SavingsGoal.objects.filter(
            user=request.user,
            is_archived=True,
        ).order_by("-purchase_date")

        serializer = self.get_serializer(
            queryset,
            many=True,
        )

        return Response(serializer.data)


class SavingsTransactionViewSet(viewsets.ModelViewSet):
    """
    Full CRUD on the current user's savings transactions.
    """

    lookup_value_regex = r"\d+"

    serializer_class = SavingsTransactionSerializer

    search_fields = [
        "note",
    ]

    ordering_fields = [
        "created_at",
        "transaction_amount",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return (
            SavingsTransaction.objects
            .filter(goal__user=self.request.user)
            .select_related("goal")
        )

    def perform_create(self, serializer):
        goal = serializer.validated_data.get("goal")

        if goal.user != self.request.user:
            raise PermissionDenied(
                "You cannot add transactions to another user's goal."
            )

        serializer.save()