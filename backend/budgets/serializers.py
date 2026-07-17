from django.db import transaction
from rest_framework import serializers

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

        if (
            transaction_obj.transaction_type
            == SavingsTransaction.DEPOSIT
        ):
            goal.current_amount += amount
        else:
            goal.current_amount -= amount

        goal.save()

        return transaction_obj