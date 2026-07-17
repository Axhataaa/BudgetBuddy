from decimal import Decimal

from django.db.models import Sum

from incomes.models import Income
from expenses.models import Expense
from budgets.models import (
    Budget,
    SavingsGoal,
)


def get_dashboard_summary(user):
    """
    Returns all summary statistics required by the dashboard.
    """

    # ==============================
    # Income
    # ==============================

    total_income = (
        Income.objects.filter(user=user)
        .aggregate(total=Sum("amount"))
        .get("total")
        or Decimal("0.00")
    )

    # ==============================
    # Expenses
    # ==============================

    total_expenses = (
        Expense.objects.filter(user=user)
        .aggregate(total=Sum("amount"))
        .get("total")
        or Decimal("0.00")
    )

    # ==============================
    # Savings
    # ==============================

    total_savings = (
        SavingsGoal.objects.filter(
            user=user,
            is_archived=False,
        )
        .aggregate(total=Sum("current_amount"))
        .get("total")
        or Decimal("0.00")
    )

    # ==============================
    # Balance
    # ==============================

    current_balance = (
        total_income
        - total_expenses
    )

    # ==============================
    # Goals
    # ==============================

    active_goals = SavingsGoal.objects.filter(
        user=user,
        is_archived=False,
        is_completed=False,
    ).count()

    completed_goals = SavingsGoal.objects.filter(
        user=user,
        is_completed=True,
        is_archived=False,
    ).count()

    achievements = SavingsGoal.objects.filter(
        user=user,
        is_archived=True,
    ).count()

    # ==============================
    # Budgets
    # ==============================

    budgets_created = Budget.objects.filter(
        user=user,
    ).count()

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "total_savings": total_savings,
        "current_balance": current_balance,
        "active_goals": active_goals,
        "completed_goals": completed_goals,
        "achievements": achievements,
        "budgets_created": budgets_created,
    }