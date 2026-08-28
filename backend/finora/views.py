from datetime import timedelta

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .context import build_finora_context
from .exceptions import FinoraProviderUnavailable
from .serializers import FinoraChatRequestSerializer
from .services import generate_finora_reply

# When the client doesn't specify a period, Finora looks at a trailing
# 30-day window - enough recent activity to be useful without silently
# scanning a user's entire history on every message.
DEFAULT_CONTEXT_WINDOW_DAYS = 30

UNAVAILABLE_MESSAGE = (
    "Finora is temporarily unavailable. Your financial data and the rest of "
    "BudgetBuddy are unaffected."
)


class FinoraChatView(APIView):
    """
    POST /api/v1/finora/chat/

    Backend foundation for the Finora AI conversational assistant.
    Builds a financial context strictly scoped to the CURRENTLY
    AUTHENTICATED user (request.user; never taken from the request
    body), then asks the centralized AI provider service for a reply.

    Conversation history is supplied by the client on every request and
    is never persisted server-side - there is no conversation model in
    this app.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        body = FinoraChatRequestSerializer(data=request.data)
        body.is_valid(raise_exception=True)

        message = body.validated_data["message"]
        history = body.validated_data["history"]
        date_from = body.validated_data.get("date_from")
        date_to = body.validated_data.get("date_to")

        if not date_from or not date_to:
            date_to = timezone.localdate()
            date_from = date_to - timedelta(days=DEFAULT_CONTEXT_WINDOW_DAYS - 1)

        context, has_activity = build_finora_context(
            user=request.user, date_from=date_from, date_to=date_to
        )

        try:
            reply, scenario_result = generate_finora_reply(
                context=context, message=message, history=history
            )
        except FinoraProviderUnavailable:
            return Response(
                {
                    "status": "unavailable",
                    "message": UNAVAILABLE_MESSAGE,
                    "period": context["period"],
                }
            )

        # scenario_result is only present when the message was recognised
        # as a what-if question; kept as a separate structured field
        # (rather than folded into `reply`) so a future frontend can
        # render it distinctly. It is never written anywhere - purely a
        # response payload.
        return Response(
            {
                "status": "ok",
                "reply": reply,
                "currency": context["currency"],
                "period": context["period"],
                "has_activity": has_activity,
                "scenario": scenario_result,
                "generated_at": timezone.now().isoformat(),
            }
        )
