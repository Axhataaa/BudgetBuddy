from rest_framework import serializers

from reports.serializers import ReportQuerySerializer


class AIAnalysisRequestSerializer(ReportQuerySerializer):
    """
    Same date_from/date_to validation as the Reports summary endpoint
    (reused rather than duplicated), plus an optional `refresh` flag the
    frontend sends when the user clicks "Refresh Analysis" to bypass the
    short-lived cache.
    """

    refresh = serializers.BooleanField(required=False, default=False)
