import logging

from .providers.groq import GroqProvider
from .whatif import WhatIfDataUnavailable, calculate_scenario

logger = logging.getLogger("budgetbuddy")

# Single place that decides which AI provider backs Finora. Groq is the
# active implementation today; adding a new provider later means adding a
# class in finora/providers/ and changing what this function returns -
# views and other services never import a provider class directly.


def get_ai_provider():
    return GroqProvider()


def _resolve_scenario_result(context, message, history):
    """
    Ask the provider to classify `message` as a what-if question and, if
    so, run the deterministic finora.whatif calculator against the
    verified `context`. Never touches the database; never lets the AI provider
    itself compute the numbers.

    Returns a plain dict to attach to the response/prompt as
    "scenario_result", or None if the message wasn't a what-if question
    at all. If classification itself fails (provider error), that
    propagates to the caller like any other provider failure - the view
    already has a single unavailable-response path for that.
    """
    provider = get_ai_provider()
    classification = provider.classify_scenario(message=message, history=history)

    if not classification.get("is_what_if"):
        return None

    scenario_type = classification.get("scenario_type")

    if scenario_type == "unsupported":
        return {
            "type": "unsupported",
            "unavailable_reason": (
                "This scenario could not be reliably matched to a supported "
                "calculation."
            ),
        }

    params = classification.get("params") or {}

    try:
        result = calculate_scenario(context, scenario_type, params)
    except WhatIfDataUnavailable as exc:
        return {
            "type": scenario_type,
            "unavailable_reason": str(exc),
        }

    return result


def generate_finora_reply(*, context, message, history):
    """
    Orchestrates the full conversational turn:

    1. Classify the message and, for what-if questions, compute a
       deterministic scenario_result via finora.whatif (never via the AI provider's
       arithmetic, never touching the database).
    2. Ask the provider for the final natural-language reply, handing it
       the scenario_result (if any) as the authoritative numbers for
       that hypothetical.

    Returns (reply: str, scenario_result: dict | None).
    """
    scenario_result = _resolve_scenario_result(context, message, history)

    provider = get_ai_provider()
    reply = provider.generate_reply(
        context=context, message=message, history=history, scenario_result=scenario_result
    )

    return reply, scenario_result
