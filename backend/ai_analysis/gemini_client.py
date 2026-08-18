import json
import logging
import urllib.error
import urllib.request

from django.conf import settings

logger = logging.getLogger("budgetbuddy")

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

REQUEST_TIMEOUT_SECONDS = 25

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

Respond with a single JSON object matching the required schema exactly."""

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "overall": {
            "type": "STRING",
            "description": "2-4 sentence holistic summary of the user's financial picture this period.",
        },
        "key_observations": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Notable observations that combine two or more financial signals.",
        },
        "patterns": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Patterns or relationships across income, spending, budgets, or trends.",
        },
        "risks": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Potential risks to savings goals or financial stability, only if supported by data.",
        },
        "recommendations": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Practical next steps tied to specific numbers/categories in the snapshot.",
        },
        "savings_strategy": {
            "type": "STRING",
            "description": "1-3 sentences on savings strategy given current goals, income, and expenses. Empty string if no savings goals exist.",
        },
        "positive_progress": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Genuine positive progress supported by the data.",
        },
    },
    "required": [
        "overall",
        "key_observations",
        "patterns",
        "risks",
        "recommendations",
        "savings_strategy",
        "positive_progress",
    ],
}


class AIAnalysisUnavailable(Exception):
    """
    Raised for any condition where we cannot safely return a Gemini-backed
    analysis (missing key, network failure, malformed response, etc). The
    view catches this and returns a generic, user-safe message - callers
    of this module should never surface str(exc) to the frontend.
    """


def generate_financial_analysis(snapshot):
    api_key = getattr(settings, "GEMINI_API_KEY", "")

    if not api_key:
        logger.error(
            "AI Financial Analyst: GEMINI_API_KEY is not configured. "
            "Set it in the backend environment to enable this feature."
        )
        raise AIAnalysisUnavailable("not_configured")

    model = getattr(settings, "GEMINI_MODEL", "gemini-3.6-flash")
    url = GEMINI_ENDPOINT.format(model=model)

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [
            {
                "role": "user",
                "parts": [{"text": json.dumps(snapshot, default=str)}],
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": RESPONSE_SCHEMA,
        },
    }

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            raw_body = response.read()
    except urllib.error.HTTPError as exc:
        error_detail = exc.read().decode("utf-8", errors="ignore")[:500]
        logger.error("AI Financial Analyst: Gemini HTTP %s - %s", exc.code, error_detail)
        raise AIAnalysisUnavailable("http_error") from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        logger.error("AI Financial Analyst: Gemini network error - %s", exc)
        raise AIAnalysisUnavailable("network_error") from exc

    try:
        response_json = json.loads(raw_body)
        text = response_json["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        logger.error("AI Financial Analyst: unexpected Gemini response shape - %s", exc)
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
