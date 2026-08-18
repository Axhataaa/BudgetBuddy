from decimal import Decimal

from budgets.models import SavingsGoal
from common.formatting import convert_from_inr
from reports.services import get_report_data

# Below this many transactions in the selected period, we tell the model
# explicitly that data is limited so it hedges instead of inventing a
# confident "trend" out of one or two data points.
LOW_DATA_TRANSACTION_THRESHOLD = 5

# Cap on how many active/achieved savings goals we send - keeps the
# snapshot small and avoids sending unbounded history for long-time users.
MAX_GOALS_PER_SECTION = 12


def _num(value, currency):
    """
    Convert an INR-denominated Decimal/number into the user's display
    currency and return it as a plain float, rounded the same way the
    rest of BudgetBuddy rounds currency (see common/formatting.py). Using
    the existing conversion table here means the AI snapshot never
    diverges from what the user sees elsewhere in the app.
    """
    if value is None:
        return 0
    return float(convert_from_inr(value, currency))


def build_financial_snapshot(user, date_from, date_to):
    """
    Build a controlled, user-specific financial snapshot for the AI
    Financial Analyst. Only ever queries data belonging to `user` - every
    query below is either scoped via reports.services.get_report_data
    (which itself filters by `user=user`) or filtered by `user=user`
    directly here.

    Returns (snapshot: dict, has_activity: bool). `has_activity` is False
    when there is literally no income or expense activity in the period,
    which callers use to skip the Gemini call entirely (no point paying
    for an API call that can only say "not enough data").
    """
    currency = getattr(user.profile, "currency", None) or "INR"

    report = get_report_data(user=user, date_from=date_from, date_to=date_to)
    summary = report["summary"]

    has_activity = (
        Decimal(str(summary["total_income"])) > 0
        or Decimal(str(summary["total_expenses"])) > 0
    )

    income_by_source = [
        {"source": row["source"], "total": _num(row["total"], currency)}
        for row in report["income_by_source"]
    ]

    expenses_by_category = [
        {"category": row["category"], "total": _num(row["total"], currency)}
        for row in report["expense_by_category"]
    ]

    trend = [
        {
            "period": point["period"],
            "income": _num(point["income"], currency),
            "expenses": _num(point["expenses"], currency),
        }
        for point in report["trend"]
    ]

    budgets = [
        {
            "category": row["category"],
            "limit": _num(row["limit"], currency),
            "spent": _num(row["spent"], currency),
            "percent_used": row["percent_used"],
            "is_overspent": row["percent_used"] >= 100,
        }
        for row in report["budget_performance"]
    ]

    insights_raw = report["insights"]
    insights = {
        "highest_spending_category": (
            {
                "category": insights_raw["highest_spending_category"]["category"],
                "total": _num(insights_raw["highest_spending_category"]["total"], currency),
            }
            if insights_raw.get("highest_spending_category")
            else None
        ),
        "largest_expense": (
            {
                "title": insights_raw["largest_expense"]["title"],
                "category": insights_raw["largest_expense"]["category"],
                "amount": _num(insights_raw["largest_expense"]["amount"], currency),
                "date": insights_raw["largest_expense"]["date"],
            }
            if insights_raw.get("largest_expense")
            else None
        ),
        "average_daily_spending": _num(insights_raw.get("average_daily_spending"), currency),
        "best_saving_period": (
            {
                "period": insights_raw["best_saving_period"]["period"],
                "net_savings": _num(insights_raw["best_saving_period"]["net_savings"], currency),
                "granularity": insights_raw["best_saving_period"]["granularity"],
            }
            if insights_raw.get("best_saving_period")
            else None
        ),
    }

    active_goals_qs = SavingsGoal.objects.filter(
        user=user, is_archived=False
    ).order_by("target_date")[:MAX_GOALS_PER_SECTION]

    active_goals = [
        {
            "name": goal.goal_name,
            "target_amount": _num(goal.target_amount, currency),
            "current_amount": _num(goal.current_amount, currency),
            "progress_percent": (
                round(float(goal.current_amount / goal.target_amount) * 100, 1)
                if goal.target_amount
                else 0
            ),
            "target_date": goal.target_date.isoformat(),
            "is_completed": goal.is_completed,
        }
        for goal in active_goals_qs
    ]

    achieved_goals_qs = SavingsGoal.objects.filter(
        user=user, is_archived=True
    ).order_by("-purchase_date")[:MAX_GOALS_PER_SECTION]

    achieved_goals = [
        {
            "name": goal.goal_name,
            "target_amount": _num(goal.target_amount, currency),
            "purchase_date": goal.purchase_date.isoformat() if goal.purchase_date else None,
        }
        for goal in achieved_goals_qs
    ]

    transaction_count = len(report["transactions"])

    snapshot = {
        "currency": currency,
        "period": {"from": report["date_from"], "to": report["date_to"]},
        "income": {"total": _num(summary["total_income"], currency), "by_source": income_by_source},
        "expenses": {"total": _num(summary["total_expenses"], currency), "by_category": expenses_by_category},
        "net_savings": _num(summary["net_savings"], currency),
        "savings_rate_percent": summary["savings_rate"],
        "trend_granularity": report["trend_granularity"],
        "trend": trend,
        "budgets": budgets,
        "insights": insights,
        "savings_goals": {
            "active": active_goals,
            "achieved": achieved_goals,
        },
        "transaction_count_in_period": transaction_count,
        "data_confidence": (
            "limited" if transaction_count < LOW_DATA_TRANSACTION_THRESHOLD else "normal"
        ),
    }

    return snapshot, has_activity
