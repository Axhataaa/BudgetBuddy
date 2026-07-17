from django.shortcuts import render

# Create your views here.
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..analytics.serializers import DashboardSummarySerializer
from ..analytics.services import get_dashboard_summary


class DashboardSummaryView(APIView):
    """
    Returns all summary information required by the dashboard.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary = get_dashboard_summary(request.user)

        serializer = DashboardSummarySerializer(summary)

        return Response(serializer.data)