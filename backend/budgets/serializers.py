from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from common.formatting import format_currency_for_user
from notifications.notification_service import create_notification
from notifications.models import Notification

from .models import (
    Budget,
    SavingsGoal,
    SavingsTransaction,
)


# ==========================================================
# Budget
# ==========================================================

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = [
            "id",
            "category",
            "monthly_limit",
            "month",
            "year",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_monthly_limit(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Monthly limit must be greater than 0."
            )
        return value

    def validate(self, attrs):
        request = self.context["request"]

        category = attrs.get(
            "category",
            getattr(self.instance, "category", None),
        )

        month = attrs.get(
            "month",
            getattr(self.instance, "month", None),
        )

        year = attrs.get(
            "year",
            getattr(self.instance, "year", None),
        )

        existing = Budget.objects.filter(
            user=request.user,
            category=category,
            month=month,
            year=year,
        )

        if self.instance:
            existing = existing.exclude(
                pk=self.instance.pk
            )

        if existing.exists():
            raise serializers.ValidationError(
                {
                    "category": (
                        "A budget for this category already exists "
                        "for this month."
                    )
                }
            )

        return attrs


# ==========================================================
# Savings Transaction Summary (Nested inside Goal)
# ==========================================================

class SavingsTransactionSummarySerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = SavingsTransaction

        fields = [
            "id",
            "transaction_amount",
            "transaction_type",
            "note",
            "created_at",
        ]



# ==========================================================
# Savings Goal
# ==========================================================

class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.SerializerMethodField()

    remaining_amount = serializers.SerializerMethodField()

    transactions = SavingsTransactionSummarySerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = SavingsGoal

        fields = [
            "id",
            "goal_name",
            "description",
            "target_amount",
            "current_amount",
            "remaining_amount",
            "progress_percentage",
            "transactions",
            "target_date",
            "is_completed",
            "is_purchased",
            "is_archived",
            "purchase_date",
            "purchase_note",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "is_completed",
            "is_purchased",
            "is_archived",
            "purchase_date",
            "purchase_note",
            "remaining_amount",
            "progress_percentage",
            "transactions",
            "created_at",
            "updated_at",
        ]

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Target amount must be greater than 0."
            )

        return value

    def validate_current_amount(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Current amount cannot be negative."
            )

        return value

    def validate(self, attrs):
        target_amount = attrs.get(
            "target_amount",
            getattr(self.instance, "target_amount", None),
        )

        current_amount = attrs.get(
            "current_amount",
            getattr(self.instance, "current_amount", None),
        )

        target_date = attrs.get(
            "target_date",
            getattr(self.instance, "target_date", None),
        )

        if (
            target_amount is not None
            and current_amount is not None
            and current_amount > target_amount
        ):
            raise serializers.ValidationError(
                {
                    "current_amount": (
                        "Current amount cannot exceed the target amount."
                    )
                }
            )

        if target_date is None:
            raise serializers.ValidationError(
                {
                    "target_date": (
                        "Target date is required."
                    )
                }
            )

        if self.instance is None and target_date < timezone.localdate():
            raise serializers.ValidationError(
                {
                    "target_date": (
                        "Target date must be in the future."
                    )
                }
            )

        return attrs

    def get_progress_percentage(self, obj):
        if obj.target_amount == 0:
            return 0

        return round(
            (obj.current_amount / obj.target_amount) * 100,
            2,
        )

    def get_remaining_amount(self, obj):
        return max(
            obj.target_amount - obj.current_amount,
            0,
        )
    

# ==========================================================
# Savings Transaction CRUD
# ==========================================================

class SavingsTransactionSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = SavingsTransaction

        fields = [
            "id",
            "goal",
            "transaction_amount",
            "transaction_type",
            "note",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_transaction_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Transaction amount must be greater than 0."
            )

        return value

    @transaction.atomic
    def create(self, validated_data):
        goal = validated_data["goal"]

        amount = validated_data[
            "transaction_amount"
        ]

        if (
            validated_data["transaction_type"]
            == SavingsTransaction.WITHDRAWAL
            and goal.current_amount < amount
        ):
            raise serializers.ValidationError(
                {
                    "transaction_amount": (
                        "Withdrawal cannot make savings negative."
                    )
                }
            )

        transaction_obj = super().create(
            validated_data
        )

        was_completed = goal.is_completed
        is_deposit = (
            transaction_obj.transaction_type
            == SavingsTransaction.DEPOSIT
        )

        if is_deposit:
            goal.current_amount += amount
        else:
            goal.current_amount -= amount

        goal.save()

        if is_deposit:

            create_notification(
                user=goal.user,
                title="Deposit Added",
                priority=Notification.Priority.LOW,
                message=(
                    f'You added {format_currency_for_user(goal.user, amount)} to "{goal.goal_name}". '
                    f"Current balance: {format_currency_for_user(goal.user, goal.current_amount)}."
                ),
                notification_type=Notification.NotificationType.SAVINGS_GOAL,
                action_url="/savings-goals",
                dedup_key=f"savings_goal:{goal.id}:deposit:{transaction_obj.id}",
            )
        else:

            create_notification(
                user=goal.user,
                title="Withdrawal Made",
                priority=Notification.Priority.LOW,
                message=(
                    f'You withdrew {format_currency_for_user(goal.user, amount)} from "{goal.goal_name}". '
                    f"Current balance: {format_currency_for_user(goal.user, goal.current_amount)}."
                ),
                notification_type=Notification.NotificationType.SAVINGS_GOAL,
                action_url="/savings-goals",
                dedup_key=f"savings_goal:{goal.id}:withdrawal:{transaction_obj.id}",
            )

        if goal.is_completed and not was_completed:
            create_notification(
                user=goal.user,
                title="Goal Completed",
                priority=Notification.Priority.MEDIUM,
                message=(
                    f'Your savings goal "{goal.goal_name}" has reached its '
                    f"target of {format_currency_for_user(goal.user, goal.target_amount)}! "
                    f"You can now mark it as purchased."
                ),
                notification_type=Notification.NotificationType.SAVINGS_GOAL,
                action_url="/savings-goals",
                dedup_key=f"savings_goal:{goal.id}:completed",
            )

        return transaction_obj


# ==========================================================
# Budget Summary Serializer
# ==========================================================

class BudgetSummarySerializer(serializers.Serializer):
    category = serializers.CharField()

    budget_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    total_expense = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    remaining_budget = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    overspent_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    usage_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    is_overspent = serializers.BooleanField()

    alert = serializers.CharField(
        allow_null=True,
    )

    alert_level = serializers.CharField(
        allow_null=True,
    )