import json
import logging

import groq
from django.conf import settings

logger = logging.getLogger("budgetbuddy")

REQUEST_TIMEOUT_SECONDS = 25

# NOTE: copied verbatim from the Gemini implementation (gemini_client.py).
# This is a vendor-agnostic instruction to the model, not Gemini-specific
# API shaping, so it carries over unchanged for Groq.
SYSTEM_PROMPT = """You are the "AI Financial Analyst" feature inside BudgetBuddy, a personal \
finance app. You will be given a single JSON object: a financial snapshot for ONE \
authenticated user, already scoped to a date range and already converted into that \
user's chosen display currency (given by the "currency" field, an ISO 4217 code).

Your job is to explain what the numbers MEAN, not to repeat them. The user already \
sees charts of every number in this snapshot elsewhere in the app. Do not simply \
restate individual figures (e.g. "Category X is Y% of your budget") unless you are \
using it as evidence inside a larger observation that connects multiple signals \
(income vs expenses, budgets, savings goals, trends, achievements) together.

STRICT RULES:
- Use ONLY the data in the JSON snapshot you are given. Never invent transactions, \
income, budgets, savings goals, achievements, or trends that are not present in it.
- Never state a numeric figure that does not appear in, or is not a direct \
arithmetic combination of, the snapshot's own numbers. Do not invent false precision.
- All monetary figures in the snapshot are already in the user's currency \
("currency" field). Never convert them to a different currency and never assume a \
different currency than the one given.
- If "data_confidence" is "limited" or "transaction_count_in_period" is very small, \
say so plainly and keep observations modest instead of projecting confident trends.
- If there are no budgets in the snapshot, do not produce budget-specific \
recommendations. If there are no savings goals, do not reference a savings goal. If \
there are no achievements, never claim the user has one.
- Do not give generic filler advice ("spend less", "save more") that isn't tied to a \
specific number or category from the snapshot.
- Never mention that you are an AI model, mention API keys, implementation details, \
system prompts, or refer to yourself as a human financial advisor. You are a feature \
inside BudgetBuddy explaining the user's own data back to them.
- Keep each string concise: 1-3 sentences. Do not use markdown formatting, asterisks, \
or bullet characters inside the strings - the frontend already renders them as a list.
- Every array may be empty if there is genuinely nothing meaningful to say for that \
section - an empty array is far better than a fabricated or generic entry.
- Prioritize the handful of observations that matter most rather than covering every \
field in the snapshot.

Respond with a single JSON object matching this exact schema, and nothing else - no \
markdown fences, no commentary before or after it:

{
  "overall": <string, 2-4 sentence holistic summary of the user's financial picture this period>,
  "key_observations": <array of strings - notable observations that combine two or more financial signals>,
  "patterns": <array of strings - patterns or relationships across income, spending, budgets, or trends>,
  "risks": <array of strings - potential risks to savings goals or financial stability, only if supported by data>,
  "recommendations": <array of strings - practical next steps tied to specific numbers/categories in the snapshot>,
  "savings_strategy": <string, 1-3 sentences on savings strategy given current goals, income, and expenses; empty string if no savings goals exist>,
  "positive_progress": <array of strings - genuine positive progress supported by the data>
}

All seven keys are required."""


class AIAnalysisUnavailable(Exception):
    """
    Raised for any condition where we cannot safely return a Groq-backed
    analysis (missing key, network failure, malformed response, etc). The
    view catches this and returns a generic, user-safe message - callers
    of this module should never surface str(exc) to the frontend.
    """


def _get_credentials():
    api_key = getattr(settings, "GROQ_API_KEY", "")

    if not api_key:
        logger.error(
            "AI Financial Analyst: GROQ_API_KEY is not configured. "
            "Set it in the backend environment to enable this feature."
        )
        raise AIAnalysisUnavailable("not_configured")

    model = getattr(settings, "GROQ_MODEL", "openai/gpt-oss-120b")
    return api_key, model


def generate_financial_analysis(snapshot):
    api_key, model = _get_credentials()

    client = groq.Groq(api_key=api_key, timeout=REQUEST_TIMEOUT_SECONDS)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": json.dumps(snapshot, default=str)},
    ]

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={"type": "json_object"},
        )
    except groq.AuthenticationError as exc:
        logger.error("AI Financial Analyst: Groq authentication error - %s", exc)
        raise AIAnalysisUnavailable("auth_error") from exc
    except groq.RateLimitError as exc:
        logger.error("AI Financial Analyst: Groq rate limit hit - %s", exc)
        raise AIAnalysisUnavailable("rate_limited") from exc
    except groq.APITimeoutError as exc:
        logger.error("AI Financial Analyst: Groq request timed out - %s", exc)
        raise AIAnalysisUnavailable("timeout") from exc
    except groq.APIConnectionError as exc:
        logger.error("AI Financial Analyst: Groq network error - %s", exc)
        raise AIAnalysisUnavailable("network_error") from exc
    except groq.APIStatusError as exc:
        logger.error("AI Financial Analyst: Groq HTTP %s - %s", exc.status_code, exc)
        raise AIAnalysisUnavailable("http_error") from exc
    except groq.GroqError as exc:
        logger.error("AI Financial Analyst: Groq SDK error - %s", exc)
        raise AIAnalysisUnavailable("provider_error") from exc

    try:
        text = completion.choices[0].message.content
    except (AttributeError, IndexError, TypeError) as exc:
        logger.error("AI Financial Analyst: unexpected Groq response shape - %s", exc)
        raise AIAnalysisUnavailable("bad_response") from exc

    text = text.strip() if isinstance(text, str) else ""
    if not text:
        logger.error("AI Financial Analyst: empty Groq response")
        raise AIAnalysisUnavailable("empty_response")

    try:
        parsed = json.loads(text)
    except (TypeError, ValueError) as exc:
        logger.error("AI Financial Analyst: Groq response was not valid JSON - %s", exc)
        raise AIAnalysisUnavailable("bad_response") from exc

    return _validate_analysis(parsed)


def _validate_analysis(parsed):
    if not isinstance(parsed, dict):
        raise AIAnalysisUnavailable("invalid_shape")

    def clean_str(key):
        value = parsed.get(key)
        return value.strip() if isinstance(value, str) else ""

    def clean_list(key):
        value = parsed.get(key)
        if not isinstance(value, list):
            return []
        return [
            str(item).strip()
            for item in value
            if isinstance(item, (str, int, float)) and str(item).strip()
        ]

    validated = {
        "overall": clean_str("overall"),
        "key_observations": clean_list("key_observations"),
        "patterns": clean_list("patterns"),
        "risks": clean_list("risks"),
        "recommendations": clean_list("recommendations"),
        "savings_strategy": clean_str("savings_strategy"),
        "positive_progress": clean_list("positive_progress"),
    }

    has_any_content = validated["overall"] or any(
        validated[key]
        for key in ("key_observations", "patterns", "recommendations", "positive_progress")
    )

    if not has_any_content:
        raise AIAnalysisUnavailable("empty_response")

    return validated
