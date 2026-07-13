from rest_framework import serializers


class DashboardSummaryQuerySerializer(serializers.Serializer):
    """
    Validates ?month=&year= on the dashboard summary endpoint.

    Not a ModelSerializer - there's no backing model here, this only
    exists so malformed query params (e.g. ?month=13) return the
    standard validation-error envelope (API Design Doc §7) instead of
    a raw 500 from an unhandled ValueError deep in a date filter.
    """

    month = serializers.IntegerField(min_value=1, max_value=12, required=False)
    year = serializers.IntegerField(min_value=2000, max_value=2100, required=False)
