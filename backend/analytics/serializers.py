from rest_framework import serializers


class DashboardSummaryQuerySerializer(serializers.Serializer):
    """
    Validates ?month=&year= query parameters.
    """

    month = serializers.IntegerField(
        min_value=1,
        max_value=12,
        required=False,
    )

    year = serializers.IntegerField(
        min_value=2000,
        max_value=2100,
        required=False,
    )


class DashboardSummarySerializer(serializers.Serializer):
    total_income = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    total_expenses = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    net_savings = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    total_savings = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    current_balance = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    active_goals = serializers.IntegerField()

    completed_goals = serializers.IntegerField()

    achievements = serializers.IntegerField()

    budgets_created = serializers.IntegerField()


class RecentActivitySerializer(serializers.Serializer):

    id = serializers.IntegerField()

    type = serializers.CharField()

    action = serializers.CharField()

    title = serializers.CharField()

    description = serializers.CharField(
        allow_blank=True,
        allow_null=True,
    )

    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        allow_null=True,
    )

    created_at = serializers.DateTimeField()