from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ReportQuerySerializer
from .services import get_report_data


class ReportSummaryView(APIView):
    """
    GET /api/v1/reports/summary/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD

    Single aggregate endpoint for the whole Reports page - same
    "one call, one payload" pattern already used by the dashboard's
    /dashboard/summary/, rather than one round trip per chart.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = ReportQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)

        data = get_report_data(
            user=request.user,
            date_from=query.validated_data["date_from"],
            date_to=query.validated_data["date_to"],
        )
        return Response(data)
