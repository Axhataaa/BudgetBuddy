from rest_framework import serializers

from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "id",
            "title",
            "amount",
            "category",
            "payment_method",
            "date",
            "description",
            "created_at",
            "updated_at",
        ]
        # `user` is deliberately absent from `fields` entirely - per API
        # Design Doc §4/§10, ownership is never accepted from the client,
        # so it isn't even exposed as a read-only field here. It's set
        # server-side in ExpenseViewSet.perform_create.
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_date(self, value):
        import datetime

        if value > datetime.date.today():
            raise serializers.ValidationError("Expense date cannot be in the future.")
        return value

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank.")
        return value.strip()
