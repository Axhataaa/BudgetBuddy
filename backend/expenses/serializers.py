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

        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate_date(self, value):
        import datetime

        # The server runs with TIME_ZONE = "UTC" (see settings), but users can
        # be in timezones ahead of UTC (e.g. IST, UTC+5:30). Right after local
        # midnight, the server's UTC calendar date can still be "yesterday",
        # so comparing against a bare `datetime.date.today()` would wrongly
        # reject a transaction dated with the user's correct local "today" as
        # being "in the future". The most extreme UTC-ahead offset in use is
        # UTC+14, so a local date can never be more than one calendar day
        # ahead of the UTC date. Allow that one-day grace window while still
        # rejecting genuinely future dates.
        max_allowed_date = datetime.date.today() + datetime.timedelta(days=1)
        if value > max_allowed_date:
            raise serializers.ValidationError("Expense date cannot be in the future.")
        return value

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank.")
        return value.strip()
