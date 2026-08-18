from django.core.cache import cache
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .gemini_client import AIAnalysisUnavailable, generate_financial_analysis
from .serializers import AIAnalysisRequestSerializer
from .services import build_financial_snapshot

# Short-lived, per-user, per-period cache so double-clicks or accidental
# re-renders don't burn extra Gemini calls. Always keyed by the
# authenticated user's own id, so it can never leak across users even if
# the underlying cache backend were ever swapped for a shared one.
CACHE_TIMEOUT_SECONDS = 180

INSUFFICIENT_DATA_MESSAGE = (
    "There isn't enough financial activity yet in this period to generate a "
    "meaningful analysis. Add a few incomes or expenses and try again."
)

UNAVAILABLE_MESSAGE = (
    "AI analysis is temporarily unavailable. Your financial data and regular "
    "BudgetBuddy reports are unaffected."
)


class AIFinancialAnalysisView(APIView):
    """
    POST /api/v1/ai-analysis/analyze/

    Generates (or returns a cached) AI-powered financial analysis for the
    CURRENTLY AUTHENTICATED user only. The user is always taken from
    request.user - the request body cannot select another user's data.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = AIAnalysisRequestSerializer(data=request.data)
        query.is_valid(raise_exception=True)

        date_from = query.validated_data["date_from"]
        date_to = query.validated_data["date_to"]
        force_refresh = query.validated_data["refresh"]

        currency = getattr(request.user.profile, "currency", None) or "INR"
        cache_key = f"ai_analysis:{request.user.id}:{date_from}:{date_to}:{currency}"

        if not force_refresh:
            cached = cache.get(cache_key)
            if cached is not None:
                return Response({**cached, "cached": True})

        snapshot, has_activity = build_financial_snapshot(
            user=request.user, date_from=date_from, date_to=date_to
        )

        if not has_activity:
            return Response(
                {
                    "status": "insufficient_data",
                    "message": INSUFFICIENT_DATA_MESSAGE,
                    "period": {"date_from": date_from, "date_to": date_to},
                }
            )

        try:
            analysis = generate_financial_analysis(snapshot)
        except AIAnalysisUnavailable:
            return Response(
                {
                    "status": "unavailable",
                    "message": UNAVAILABLE_MESSAGE,
                    "period": {"date_from": date_from, "date_to": date_to},
                }
            )

        payload = {
            "status": "ok",
            "currency": currency,
            "period": {"date_from": date_from, "date_to": date_to},
            "analysis": analysis,
            "generated_at": timezone.now().isoformat(),
            "cached": False,
        }

        cache.set(cache_key, payload, timeout=CACHE_TIMEOUT_SECONDS)

        return Response(payload)
