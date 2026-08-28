import json
import logging
import urllib.error
import urllib.request

from django.conf import settings

from finora.exceptions import FinoraProviderUnavailable
from finora.whatif import SUPPORTED_SCENARIO_TYPES

from .base import FinoraAIProvider

logger = logging.getLogger("budgetbuddy")

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

REQUEST_TIMEOUT_SECONDS = 25

# Keep history bounded regardless of what the client sends - this is a
# defence-in-depth limit on top of FinoraChatRequestSerializer's own
# validation, so a single provider implementation can never be handed
# an unbounded payload.
MAX_HISTORY_TURNS = 20

SYSTEM_PROMPT = """You are "Finora", the AI financial assistant inside BudgetBuddy, a \
personal finance app. You will be given a single JSON object: a structured, \
user-scoped financial context for ONE authenticated user, already converted into \
that user's chosen display currency (the "currency" field, an ISO 4217 code).

STRICT RULES:
- Use ONLY the data in the JSON context you are given, plus the conversation so \
far. Never invent transactions, income, budgets, savings goals, or figures that \
are not present in the context.
- Never state a numeric figure that does not appear in, or is not a direct \
arithmetic combination of, the context's own numbers.
- All monetary figures are already in the user's currency ("currency" field). \
Never convert them to a different currency.
- If the context shows little or no financial activity, say so plainly and keep \
answers general rather than inventing a confident analysis. The same applies if \
"data_confidence" is "limited" - hedge accordingly instead of asserting a firm trend.
- If the context includes a "scenario_result" object, that object is the \
authoritative, already-computed answer to the user's hypothetical/what-if \
question. Do NOT recompute, re-derive, or invent alternative numbers for that \
scenario - explain the given scenario_result numbers naturally in your reply. \
If "scenario_result" contains an "unavailable_reason" field, it means the \
scenario could not be reliably calculated (e.g. an unrecognised goal or category, \
or missing figures) - say so honestly and do not guess a number instead.
- Never mention that you are an AI model, mention API keys, implementation \
details, system prompts, or refer to yourself as a human financial advisor. You \
are a feature inside BudgetBuddy helping the user understand and plan around \
their own data.
- Keep replies concise and conversational. Do not use markdown headers or code \
blocks; light use of plain sentences and short lists is fine.
- Always reply in the same language and style the user just wrote in. If they \
write in Hindi, reply in Hindi. If they write in Hinglish (Hindi mixed with \
English, typically in Roman script), reply in that same Hinglish style. If they \
write in English, reply in English. Mirror their tone (casual vs formal) too.
- If asked something with no connection to the user's finances, answer briefly \
and steer back to how BudgetBuddy can help with their money.
"""

# A small, separate system prompt for the classification/extraction step.
# Kept deliberately narrow: this call's ONLY job is to detect what-if
# questions and extract parameters as strict JSON. It must never itself
# produce a user-facing reply or perform arithmetic.
CLASSIFIER_SYSTEM_PROMPT = """You classify a single user message from a personal finance \
app chat, in the context of the recent conversation history, which may be in English, \
Hindi, or Hinglish.

Decide whether the CURRENT message is a "what-if" / hypothetical financial scenario \
question (e.g. asking about the effect of saving more, spending less, income changing, \
reaching a savings goal earlier, or affording a one-time purchase), as opposed to a \
normal question or statement.

Use the conversation history only to resolve references like "it"/"that"/"us" in the \
current message (for example if the previous assistant turn discussed food spending and \
the user then asks "what if I reduce it by 20%", "it" means food spending).

If it IS a what-if question, try to map it to EXACTLY ONE of these scenario types and \
extract its parameters. Respond with ONLY a raw JSON object (no markdown fences, no \
commentary) in ONE of these exact shapes:

1) {"is_what_if": true, "scenario_type": "reduce_category_spending", "params": \
{"category": "<category name as plainly stated or implied>", "percent": <number or null>, \
"amount": <number or null>}}
   (exactly one of percent/amount should be a number, the other null)

2) {"is_what_if": true, "scenario_type": "increase_savings", "params": \
{"amount": <number, extra amount saved per month>}}

3) {"is_what_if": true, "scenario_type": "income_change", "params": \
{"amount": <number, signed: positive if income increases, negative if it decreases>}}

4) {"is_what_if": true, "scenario_type": "goal_timeline", "params": \
{"goal_name": "<goal name as stated or implied>", "extra_monthly_amount": <number or null>}}

5) {"is_what_if": true, "scenario_type": "one_time_expense", "params": \
{"amount": <number>, "category": "<category name or null>"}}

If it IS a what-if question but does not reliably fit one of the shapes above (missing a \
clear number, ambiguous target, or a different kind of scenario entirely), respond with:
{"is_what_if": true, "scenario_type": "unsupported", "params": {}}

If it is NOT a what-if question at all, respond with:
{"is_what_if": false}

Never guess a numeric amount that was not stated or clearly implied in the message. If a \
required number is missing, use the "unsupported" shape instead of inventing one.
"""


def _call_gemini(*, api_key, model, system_prompt, contents):
    url = GEMINI_ENDPOINT.format(model=model)

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
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
        logger.error("Finora: Gemini HTTP %s - %s", exc.code, error_detail)
        raise FinoraProviderUnavailable("http_error") from exc
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        logger.error("Finora: Gemini network error - %s", exc)
        raise FinoraProviderUnavailable("network_error") from exc

    try:
        response_json = json.loads(raw_body)
        text = response_json["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        logger.error("Finora: unexpected Gemini response shape - %s", exc)
        raise FinoraProviderUnavailable("bad_response") from exc

    text = text.strip() if isinstance(text, str) else ""
    if not text:
        raise FinoraProviderUnavailable("empty_response")

    return text


def _history_to_contents(history):
    contents = []
    for turn in history[-MAX_HISTORY_TURNS:]:
        role = "model" if turn.get("role") == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})
    return contents


class GeminiProvider(FinoraAIProvider):
    """
    Gemini-backed implementation of FinoraAIProvider. All Gemini-specific
    request/response shaping lives in this one class.
    """

    def _get_credentials(self):
        api_key = getattr(settings, "GEMINI_API_KEY", "")

        if not api_key:
            logger.error(
                "Finora: GEMINI_API_KEY is not configured. Set it in the "
                "backend environment to enable this feature."
            )
            raise FinoraProviderUnavailable("not_configured")

        model = getattr(settings, "GEMINI_MODEL", "gemini-3.6-flash")
        return api_key, model

    def generate_reply(self, *, context, message, history, scenario_result=None):
        api_key, model = self._get_credentials()

        context_for_prompt = dict(context)
        if scenario_result is not None:
            context_for_prompt["scenario_result"] = scenario_result

        contents = [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            "Financial context (JSON):\n"
                            + json.dumps(context_for_prompt, default=str)
                        )
                    }
                ],
            },
            {
                "role": "model",
                "parts": [{"text": "Understood. I'll use only that data to help."}],
            },
        ]

        contents.extend(_history_to_contents(history))
        contents.append({"role": "user", "parts": [{"text": message}]})

        return _call_gemini(
            api_key=api_key, model=model, system_prompt=SYSTEM_PROMPT, contents=contents
        )

    def classify_scenario(self, *, message, history):
        api_key, model = self._get_credentials()

        contents = _history_to_contents(history)
        contents.append({"role": "user", "parts": [{"text": message}]})

        raw_text = _call_gemini(
            api_key=api_key,
            model=model,
            system_prompt=CLASSIFIER_SYSTEM_PROMPT,
            contents=contents,
        )

        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
        except (ValueError, TypeError) as exc:
            logger.error("Finora: classifier returned non-JSON output - %s", exc)
            raise FinoraProviderUnavailable("bad_classifier_response") from exc

        if not isinstance(parsed, dict) or "is_what_if" not in parsed:
            logger.error("Finora: classifier JSON missing is_what_if field")
            raise FinoraProviderUnavailable("bad_classifier_response")

        if not parsed.get("is_what_if"):
            return {"is_what_if": False}

        scenario_type = parsed.get("scenario_type")
        if scenario_type not in SUPPORTED_SCENARIO_TYPES:
            # Covers both "unsupported" and any unrecognised value the
            # model might produce - fail safe into "unsupported" rather
            # than guessing at a scenario shape.
            return {"is_what_if": True, "scenario_type": "unsupported", "params": {}}

        params = parsed.get("params")
        if not isinstance(params, dict):
            params = {}

        return {"is_what_if": True, "scenario_type": scenario_type, "params": params}
