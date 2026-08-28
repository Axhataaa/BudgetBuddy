"""
Builds the structured financial context Finora hands to the AI provider.

This module deliberately contains NO financial arithmetic of its own.
Every number in the context comes from BudgetBuddy's existing, already
tested calculation services:

- ai_analysis.services.build_financial_snapshot: period income/expense
  totals, category breakdowns, trend, budget performance, insights, and
  savings goals - itself built on reports.services.get_report_data
  (the Reports/Analytics source of truth) plus SavingsGoal. Reusing this
  directly (rather than re-deriving the same figures) is what keeps
  Finora from ever drifting from what the Reports page and the existing
  AI Financial Analyst show for the same period.
- analytics.services.get_dashboard_summary: all-time (lifetime) totals,
  the same figures the dashboard is built from.

Every query this module touches is scoped to the `user` argument that is
passed in - callers (finora/views.py) must always pass request.user and
never accept a user id from the request body/query params.
"""

from analytics.services import get_dashboard_summary
from ai_analysis.services import build_financial_snapshot
from common.formatting import convert_from_inr


def _lifetime_context(user, currency):
    lifetime = get_dashboard_summary(user)

    return {
        "total_income": float(convert_from_inr(lifetime["total_income"], currency)),
        "total_expenses": float(convert_from_inr(lifetime["total_expenses"], currency)),
        "total_savings": float(convert_from_inr(lifetime["total_savings"], currency)),
        "current_balance": float(convert_from_inr(lifetime["current_balance"], currency)),
        "active_goals": lifetime["active_goals"],
        "completed_goals": lifetime["completed_goals"],
        "achievements": lifetime["achievements"],
        "budgets_created": lifetime["budgets_created"],
    }


def build_finora_context(user, date_from, date_to):
    """
    Build the full Finora financial context for `user`, covering the
    given [date_from, date_to] period plus lifetime totals.

    Returns (context: dict, has_activity: bool). `has_activity` mirrors
    build_financial_snapshot's own signal for the selected period (it is
    False only when there is no income/expense activity in that window -
    lifetime activity elsewhere is still reflected in context["lifetime"]).
    """
    snapshot, has_activity = build_financial_snapshot(
        user=user, date_from=date_from, date_to=date_to
    )

    currency = snapshot["currency"]

    context = {
        "currency": currency,
        "period": snapshot["period"],
        "period_summary": {
            "income": snapshot["income"],
            "expenses": snapshot["expenses"],
            "net_savings": snapshot["net_savings"],
            "savings_rate_percent": snapshot["savings_rate_percent"],
            "trend_granularity": snapshot["trend_granularity"],
            "trend": snapshot["trend"],
            "budgets": snapshot["budgets"],
            "insights": snapshot["insights"],
            "transaction_count_in_period": snapshot["transaction_count_in_period"],
            "data_confidence": snapshot["data_confidence"],
        },
        "savings_goals": snapshot["savings_goals"],
        "lifetime": _lifetime_context(user, currency),
    }

    return context, has_activity
