import datetime

from rest_framework import serializers

from .models import Income


class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = [
            "id",
            "source",
            "amount",
            "date",
            "description",
            "created_at",
            "updated_at",
        ]
        # `user` deliberately absent - identical reasoning to
        # ExpenseSerializer: ownership is never client-supplied.
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_date(self, value):
        if value > datetime.date.today():
            raise serializers.ValidationError("Income date cannot be in the future.")
        return value
