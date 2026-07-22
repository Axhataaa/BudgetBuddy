"""
Aggregation logic for the Reports page.

Deliberately NOT calling analytics.services.get_dashboard_summary() -
that function is unused, all-time (no date filtering) dead code; the
actual Dashboard endpoint (analytics/views.py DashboardSummaryView)
builds its own month/year-filtered queries inline instead. Reports
needs arbitrary date_from/date_to ranges (not just calendar months),
so this module follows the SAME aggregation patterns as that view
(Sum(), Decimal handling, category grouping, savings-rate formula)
rather than reusing a function that doesn't do what's needed here.
"""

from decimal import Decimal
from collections import defaultdict

from django.db.models import Sum

from expenses.models import Expense
from incomes.models import Income
from budgets.models import Budget


def _money(value):
    return round(Decimal(value or 0), 2)


def _date_range_months(date_from, date_to):
    """Every (month, year) pair a date range touches, even partially -
    used to find which monthly Budgets are relevant to the range,
    since Budget is keyed by month/year rather than a date field."""
    months = set()
    cursor = date_from.replace(day=1)
    while cursor <= date_to:
        months.add((cursor.month, cursor.year))
        if cursor.month == 12:
            cursor = cursor.replace(year=cursor.year + 1, month=1)
        else:
            cursor = cursor.replace(month=cursor.month + 1)
    return months


def get_report_data(user, date_from, date_to):
    expense_qs = Expense.objects.filter(
        user=user, date__gte=date_from, date__lte=date_to
    )
    income_qs = Income.objects.filter(
        user=user, date__gte=date_from, date__lte=date_to
    )

    # ---------------- Summary ----------------
    total_income = expense_income_total(income_qs)
    total_expenses = expense_income_total(expense_qs)
    net_savings = total_income - total_expenses
    current_balance = total_income - total_expenses
    savings_rate = (
        round(float((net_savings / total_income) * 100), 1)
        if total_income > 0
        else 0.0
    )

    # ---------------- Trend (income vs expense over time) ----------------
    # Daily buckets for ranges up to ~45 days (readable on a chart);
    # monthly buckets for anything longer, same threshold used below
    # to decide how "best saving period" is labeled.
    #
    # Bucketed in Python rather than via TruncDate/TruncMonth - `date`
    # is already a plain DateField (not a datetime), and this keeps
    # the aggregation portable across DB backends without relying on
    # each backend's date-truncation SQL functions.
    span_days = (date_to - date_from).days + 1
    monthly_buckets = span_days > 45

    def bucket_key(d):
        return f"{d.year:04d}-{d.month:02d}" if monthly_buckets else d.isoformat()

    income_by_period = defaultdict(Decimal)
    for d, amount in income_qs.values_list("date", "amount"):
        income_by_period[bucket_key(d)] += amount

    expense_by_period = defaultdict(Decimal)
    for d, amount in expense_qs.values_list("date", "amount"):
        expense_by_period[bucket_key(d)] += amount

    all_periods = sorted(set(income_by_period) | set(expense_by_period))

    trend = [
        {
            "period": period,
            "income": _money(income_by_period.get(period, 0)),
            "expenses": _money(expense_by_period.get(period, 0)),
        }
        for period in all_periods
    ]

    # ---------------- Expense category breakdown ----------------
    category_rows = (
        expense_qs.values("category")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    expense_by_category = [
        {"category": row["category"], "total": _money(row["total"])}
        for row in category_rows
    ]

    # ---------------- Income source analysis ----------------
    source_rows = (
        income_qs.values("source")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    income_by_source = [
        {"source": row["source"], "total": _money(row["total"])}
        for row in source_rows
    ]

    # ---------------- Budget performance ----------------
    # Budgets are keyed by (category, month, year), not a date field,
    # so "budget performance for this range" = every budget whose
    # month falls inside the range, compared against actual spend in
    # that category during the range (not the whole month) - the
    # honest comparison for an arbitrary date window.
    relevant_months = _date_range_months(date_from, date_to)
    budget_qs = Budget.objects.filter(user=user)
    budget_qs = [
        b for b in budget_qs if (b.month, b.year) in relevant_months
    ]

    budget_limit_by_category = {}
    for b in budget_qs:
        budget_limit_by_category[b.category] = (
            budget_limit_by_category.get(b.category, Decimal("0.00")) + b.monthly_limit
        )

    spend_by_category = {
        row["category"]: row["total"] for row in category_rows
    }

    budget_performance = []
    for category, limit in budget_limit_by_category.items():
        spent = spend_by_category.get(category, Decimal("0.00"))
        percent_used = float((spent / limit) * 100) if limit else 0.0
        budget_performance.append(
            {
                "category": category,
                "limit": _money(limit),
                "spent": _money(spent),
                "percent_used": round(percent_used, 1),
            }
        )
    budget_performance.sort(key=lambda b: b["percent_used"], reverse=True)

    # ---------------- Insights (derived only from the above - no
    # invented numbers) ----------------
    highest_category = expense_by_category[0] if expense_by_category else None

    largest_expense_row = expense_qs.order_by("-amount").first()
    largest_expense = (
        {
            "title": largest_expense_row.title,
            "amount": _money(largest_expense_row.amount),
            "category": largest_expense_row.category,
            "date": largest_expense_row.date.isoformat(),
        }
        if largest_expense_row
        else None
    )

    average_daily_spending = _money(total_expenses / max(span_days, 1))

    best_period = None
    if trend:
        best = max(trend, key=lambda t: t["income"] - t["expenses"])
        best_period = {
            "period": best["period"],
            "net_savings": _money(Decimal(str(best["income"])) - Decimal(str(best["expenses"]))),
            "granularity": "month" if monthly_buckets else "day",
        }

    return {
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "summary": {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_savings": net_savings,
            "current_balance": current_balance,
            "savings_rate": savings_rate,
        },
        "trend": trend,
        "trend_granularity": "month" if monthly_buckets else "day",
        "expense_by_category": expense_by_category,
        "income_by_source": income_by_source,
        "budget_performance": budget_performance,
        "insights": {
            "highest_spending_category": highest_category,
            "largest_expense": largest_expense,
            "average_daily_spending": average_daily_spending,
            "best_saving_period": best_period,
        },
    }


def expense_income_total(queryset):
    return queryset.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
