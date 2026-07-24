from rest_framework import serializers

from .models import Notification


class ReportQuerySerializer(serializers.Serializer):
    """
    Validates ?date_from=&date_to= query parameters, following the same
    param naming already used by ExpenseFilter/IncomeFilter's
    DateRangeFilterMixin (config/filters.py) elsewhere in the API.
    """

    date_from = serializers.DateField()
    date_to = serializers.DateField()

    def validate(self, attrs):
        if attrs["date_from"] > attrs["date_to"]:
            raise serializers.ValidationError(
                {"date_to": "date_to must be on or after date_from."}
            )
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "message",
            "notification_type",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields
