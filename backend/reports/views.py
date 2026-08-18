from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ReportQuerySerializer
from .services import get_report_data


class ReportSummaryView(APIView):

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
