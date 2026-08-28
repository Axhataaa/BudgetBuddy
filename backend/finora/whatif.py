"""
Deterministic "what-if" scenario engine for Finora.

This module intentionally contains the ONLY arithmetic Finora performs on
hypothetical numbers. Gemini is used purely to (a) classify a message as a
what-if question and (b) extract structured parameters from natural
language - it never computes the actual result. Every function here is
pure/read-only: it takes the already-verified `context` dict produced by
`finora.context.build_finora_context` plus a small parameter dict, and
returns a plain-data result. Nothing in this module touches the database
or writes anywhere - hypothetical numbers must never be persisted.

Supported scenario "type" values (as extracted by the Gemini classifier):

- "reduce_category_spending": cut spending in one category by a percent
  or a flat amount, see the effect on net savings / savings rate.
- "increase_savings":         save an extra flat amount every month, see
  the effect on net savings / savings rate / projected balance.
- "income_change":            income goes up or down by a flat amount,
  see the effect on net savings / savings rate.
- "goal_timeline":            given a named savings goal, and optionally
  an extra monthly contribution, estimate when it will be reached.
- "one_time_expense":         a single extra expense of a given amount,
  see whether the user stays within the period's budgets / balance.

Anything that doesn't fit one of these shapes should be classified as
"unsupported" upstream (in the Gemini extraction step) rather than forced
into one of them.
"""

from decimal import Decimal, ROUND_HALF_UP
import datetime
import math

# Scenario types this engine knows how to compute. Kept as a constant so
# the Gemini extraction prompt and the calculator agree on the same set.
SUPPORTED_SCENARIO_TYPES = {
    "reduce_category_spending",
    "increase_savings",
    "income_change",
    "goal_timeline",
    "one_time_expense",
}


class WhatIfDataUnavailable(Exception):
    """
    Raised when a scenario is structurally supported but the specific
    data it needs isn't present in the verified context (e.g. a goal
    name that doesn't match any of the user's actual goals, or a
    category with no spending on record). Callers must surface this as
    an honest "I can't find that" rather than falling back to a guess.
    """


class WhatIfInvalidParameters(WhatIfDataUnavailable):
    """
    Raised when a what-if scenario's numeric parameters are present but
    structurally invalid: non-numeric, non-finite (NaN/inf), zero or
    negative where a positive value is required, or a change that would
    push a figure into an impossible state (e.g. negative income).

    Subclasses WhatIfDataUnavailable so existing callers (namely
    finora/services.py, which only catches WhatIfDataUnavailable) keep
    handling these exactly like any other "can't compute this" case -
    an honest unavailable_reason rather than a fabricated number.
    """


def _round2(value):
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _to_finite_float(value, field_name):
    """
    Coerce `value` to a plain float, rejecting anything that isn't a
    genuine finite number (non-numeric strings, None, NaN, +/-inf,
    booleans excluded implicitly since bool is a subclass of int but
    scenario params are never expected to be booleans here). Used
    anywhere a Gemini-extracted parameter is about to be used in
    arithmetic, since extraction is natural-language-derived and must
    never be trusted blindly.
    """
    if isinstance(value, bool):
        raise WhatIfInvalidParameters(f"'{field_name}' must be a number.")
    try:
        result = float(value)
    except (TypeError, ValueError):
        raise WhatIfInvalidParameters(f"'{field_name}' must be a number.")
    if not math.isfinite(result):
        raise WhatIfInvalidParameters(f"'{field_name}' must be a finite number.")
    return result


def _find_category(context, category_name):
    if not category_name:
        return None
    target = category_name.strip().lower()
    for row in context["period_summary"]["expenses"]["by_category"]:
        if row["category"].strip().lower() == target:
            return row
    return None


def _find_goal(context, goal_name):
    if not goal_name:
        return None
    target = goal_name.strip().lower()
    for goal in context["savings_goals"]["active"]:
        if goal["name"].strip().lower() == target:
            return goal
    return None


def _period_length_days(context):
    """
    Number of days spanned by the context's period, inclusive of both
    endpoints, or None if the period isn't present/parseable. Dates may
    arrive as ISO strings (from JSON-shaped contexts, e.g. in tests) or
    as date objects (from finora.context.build_finora_context directly).
    """
    period = context.get("period") or {}
    date_from = period.get("from")
    date_to = period.get("to")

    if not date_from or not date_to:
        return None

    if isinstance(date_from, str):
        try:
            date_from = datetime.date.fromisoformat(date_from)
        except ValueError:
            return None
    if isinstance(date_to, str):
        try:
            date_to = datetime.date.fromisoformat(date_to)
        except ValueError:
            return None

    return (date_to - date_from).days + 1


def _is_monthly_period(context):
    """
    Whether the context's period is close enough to a calendar month to
    treat its net savings as a "monthly pace" without further caveats.
    Finora's default context window is a trailing 30 days, which falls
    inside this range - so default-window behavior is unchanged. A
    custom, non-monthly date_from/date_to (e.g. a single week, or a full
    quarter) should NOT be silently described as monthly.
    """
    days = _period_length_days(context)
    return days is not None and 28 <= days <= 31


def _savings_rate(net_savings, income):
    if not income:
        return 0.0
    return _round2((net_savings / income) * 100)


def calculate_reduce_category_spending(context, params):
    """
    params: {"category": str, "percent": float | None, "amount": float | None}
    Exactly one of percent/amount is expected; percent takes precedence
    if both are somehow given.
    """
    category_row = _find_category(context, params.get("category"))
    if category_row is None:
        raise WhatIfDataUnavailable(
            f"No spending on record for category '{params.get('category')}' "
            "in the current period."
        )

    current_spend = category_row["total"]
    percent = params.get("percent")
    amount = params.get("amount")

    if percent is not None:
        percent = _to_finite_float(percent, "percent")
        if not (0 < percent <= 100):
            raise WhatIfInvalidParameters(
                "Reduction percent must be greater than 0 and at most 100."
            )
        reduction = current_spend * (percent / 100.0)
    elif amount is not None:
        amount = _to_finite_float(amount, "amount")
        if amount <= 0:
            raise WhatIfInvalidParameters("Reduction amount must be greater than 0.")
        reduction = min(amount, current_spend)
    else:
        raise WhatIfDataUnavailable(
            "No reduction percentage or amount was specified for the scenario."
        )

    income = context["period_summary"]["income"]["total"]
    current_net_savings = context["period_summary"]["net_savings"]

    new_expenses_total = context["period_summary"]["expenses"]["total"] - reduction
    new_net_savings = current_net_savings + reduction

    return {
        "type": "reduce_category_spending",
        "currency": context["currency"],
        "category": category_row["category"],
        "current_category_spend": _round2(current_spend),
        "reduction_amount": _round2(reduction),
        "new_category_spend": _round2(current_spend - reduction),
        "current_net_savings": _round2(current_net_savings),
        "new_net_savings": _round2(new_net_savings),
        "current_expenses_total": _round2(context["period_summary"]["expenses"]["total"]),
        "new_expenses_total": _round2(new_expenses_total),
        "current_savings_rate_percent": context["period_summary"]["savings_rate_percent"],
        "new_savings_rate_percent": _savings_rate(new_net_savings, income),
    }


def calculate_increase_savings(context, params):
    """
    params: {"amount": float} - an extra flat amount saved per month.

    Only genuinely meaningful when the context's period represents
    roughly a calendar month (the default 30-day Finora window does).
    For a non-monthly custom period, the result still computes but is
    flagged via "period_is_monthly": False so the final reply can caveat
    it instead of silently presenting it as a monthly projection.
    """
    amount = params.get("amount")
    if amount is None:
        raise WhatIfDataUnavailable("No extra savings amount was specified for the scenario.")

    amount = _to_finite_float(amount, "amount")
    if amount <= 0:
        raise WhatIfInvalidParameters("Extra savings amount must be greater than 0.")

    income = context["period_summary"]["income"]["total"]
    current_net_savings = context["period_summary"]["net_savings"]
    new_net_savings = current_net_savings + amount

    return {
        "type": "increase_savings",
        "currency": context["currency"],
        "extra_monthly_amount": _round2(amount),
        "current_net_savings": _round2(current_net_savings),
        "new_net_savings": _round2(new_net_savings),
        "current_savings_rate_percent": context["period_summary"]["savings_rate_percent"],
        "new_savings_rate_percent": _savings_rate(new_net_savings, income),
        "projected_extra_after_12_months": _round2(amount * 12),
        "period_days": _period_length_days(context),
        "period_is_monthly": _is_monthly_period(context),
    }


def calculate_income_change(context, params):
    """
    params: {"amount": float} - signed change to monthly income
    (positive = increase, negative = decrease).
    """
    amount = params.get("amount")
    if amount is None:
        raise WhatIfDataUnavailable("No income change amount was specified for the scenario.")

    amount = _to_finite_float(amount, "amount")
    current_income = context["period_summary"]["income"]["total"]
    current_net_savings = context["period_summary"]["net_savings"]

    new_income = current_income + amount
    if new_income < 0:
        raise WhatIfInvalidParameters(
            "That income change would make income negative, which isn't possible."
        )
    new_net_savings = current_net_savings + amount

    return {
        "type": "income_change",
        "currency": context["currency"],
        "income_change_amount": _round2(amount),
        "current_income": _round2(current_income),
        "new_income": _round2(new_income),
        "current_net_savings": _round2(current_net_savings),
        "new_net_savings": _round2(new_net_savings),
        "current_savings_rate_percent": context["period_summary"]["savings_rate_percent"],
        "new_savings_rate_percent": _savings_rate(new_net_savings, new_income),
    }


def calculate_goal_timeline(context, params):
    """
    params: {"goal_name": str, "extra_monthly_amount": float | None}

    Estimates months-to-completion using the user's current period net
    savings as their "monthly pace", optionally boosted by an extra
    monthly contribution. This is necessarily an approximation (a single
    period's net savings is used as a stand-in for an ongoing monthly
    rate) - the reply must be framed as an estimate, not a guarantee.
    """
    goal = _find_goal(context, params.get("goal_name"))
    if goal is None:
        raise WhatIfDataUnavailable(
            f"No active savings goal named '{params.get('goal_name')}' was found."
        )

    remaining = goal["target_amount"] - goal["current_amount"]
    if remaining <= 0:
        return {
            "type": "goal_timeline",
            "currency": context["currency"],
            "goal_name": goal["name"],
            "already_reached": True,
            "remaining_amount": 0,
        }

    extra_raw = params.get("extra_monthly_amount")
    if extra_raw is not None:
        extra = _to_finite_float(extra_raw, "extra_monthly_amount")
        if extra < 0:
            raise WhatIfInvalidParameters("Extra monthly contribution cannot be negative.")
    else:
        extra = 0.0

    monthly_pace = context["period_summary"]["net_savings"] + extra
    period_days = _period_length_days(context)
    period_is_monthly = _is_monthly_period(context)

    if monthly_pace <= 0:
        return {
            "type": "goal_timeline",
            "currency": context["currency"],
            "goal_name": goal["name"],
            "already_reached": False,
            "remaining_amount": _round2(remaining),
            "monthly_pace": _round2(monthly_pace),
            "months_to_goal": None,
            "reachable": False,
            "period_days": period_days,
            "period_is_monthly": period_is_monthly,
        }

    months_to_goal = math.ceil(remaining / monthly_pace)

    return {
        "type": "goal_timeline",
        "currency": context["currency"],
        "goal_name": goal["name"],
        "already_reached": False,
        "remaining_amount": _round2(remaining),
        "extra_monthly_amount": _round2(extra),
        "monthly_pace": _round2(monthly_pace),
        "months_to_goal": months_to_goal,
        "target_date_on_record": goal["target_date"],
        "reachable": True,
        "period_days": period_days,
        "period_is_monthly": period_is_monthly,
    }


def calculate_one_time_expense(context, params):
    """
    params: {"amount": float, "category": str | None}

    Checks the effect of a single extra expense against the period's net
    savings and, when a matching budget exists, against that budget's
    remaining headroom.
    """
    amount = params.get("amount")
    if amount is None:
        raise WhatIfDataUnavailable("No expense amount was specified for the scenario.")

    amount = _to_finite_float(amount, "amount")
    if amount <= 0:
        raise WhatIfInvalidParameters("Expense amount must be greater than 0.")
    current_net_savings = context["period_summary"]["net_savings"]
    new_net_savings = current_net_savings - amount

    result = {
        "type": "one_time_expense",
        "currency": context["currency"],
        "expense_amount": _round2(amount),
        "current_net_savings": _round2(current_net_savings),
        "new_net_savings": _round2(new_net_savings),
        "stays_positive": new_net_savings >= 0,
    }

    category_name = params.get("category")
    if category_name:
        budget_match = None
        for row in context["period_summary"]["budgets"]:
            if row["category"].strip().lower() == category_name.strip().lower():
                budget_match = row
                break

        if budget_match is not None:
            remaining_budget = budget_match["limit"] - budget_match["spent"]
            result["matched_budget_category"] = budget_match["category"]
            result["budget_limit"] = _round2(budget_match["limit"])
            result["budget_already_spent"] = _round2(budget_match["spent"])
            result["budget_remaining_before"] = _round2(remaining_budget)
            result["budget_remaining_after"] = _round2(remaining_budget - amount)
            result["exceeds_budget"] = (remaining_budget - amount) < 0

    return result


_CALCULATORS = {
    "reduce_category_spending": calculate_reduce_category_spending,
    "increase_savings": calculate_increase_savings,
    "income_change": calculate_income_change,
    "goal_timeline": calculate_goal_timeline,
    "one_time_expense": calculate_one_time_expense,
}


def calculate_scenario(context, scenario_type, params):
    """
    Dispatch to the right pure calculator. Returns a plain dict result on
    success. Raises WhatIfDataUnavailable if the scenario type is
    structurally supported but the specific data needed isn't available.

    Raises KeyError if scenario_type isn't one of SUPPORTED_SCENARIO_TYPES
    - callers should only reach this function after confirming the type
    is supported.
    """
    calculator = _CALCULATORS[scenario_type]
    return calculator(context, params or {})
