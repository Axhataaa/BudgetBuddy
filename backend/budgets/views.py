from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.utils import timezone

from .filters import BudgetFilter
from .models import (
    Budget,
    SavingsGoal,
    SavingsTransaction,
)

from .serializers import (
    BudgetSerializer,
    SavingsGoalSerializer,
    SavingsTransactionSerializer,
)


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
        return SavingsGoal.objects.filter(
            user=self.request.user,
            is_archived=False,
        )

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