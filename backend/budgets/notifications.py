from decimal import Decimal

from django.db.models import Sum

from expenses.models import Expense
from reports.notification_service import create_notification
from reports.models import Notification

from .models import Budget

WARNING_THRESHOLD = 80
EXCEEDED_THRESHOLD = 100


def check_and_notify_budget_alerts(user, category, month, year):
    """
    Task 2: fires a persistent notification when a budget crosses 80%
    or 100% usage. Called after an expense is created/updated
    (expenses/views.py) - a change to any OTHER category's expense
    can't affect this budget, so it's only checked for the specific
    category/month/year that just changed, not every budget the user
    has.

    Uses the same spend calculation (sum of Expense amounts for that
    user/category/month/year) as BudgetViewSet.summary() and
    analytics/views.py's DashboardSummaryView - not a new formula.

    Deduplicated per (budget, threshold tier) via dedup_key, so a
    budget only ever produces one "approaching limit" notification and
    one "exceeded" notification, no matter how many further expenses
    are added afterward - not a notification per expense.
    """
    budget = Budget.objects.filter(
        user=user, category=category, month=month, year=year
    ).first()

    if not budget or budget.monthly_limit <= 0:
        return

    total_spent = (
        Expense.objects.filter(
            user=user, category=category, date__month=month, date__year=year
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )

    percent_used = float((total_spent / budget.monthly_limit) * 100)
    category_label = budget.get_category_display()

    if percent_used >= EXCEEDED_THRESHOLD:
        create_notification(
            user=user,
            message=(
                f"Your {category_label} budget has been fully exhausted - "
                f"you've spent {percent_used:.0f}% of your ₹{budget.monthly_limit} limit."
            ),
            notification_type=Notification.NotificationType.BUDGET_ALERT,
            dedup_key=f"budget_alert:{budget.id}:{EXCEEDED_THRESHOLD}",
        )
    elif percent_used >= WARNING_THRESHOLD:
        create_notification(
            user=user,
            message=(
                f"You've used {percent_used:.0f}% of your {category_label} "
                f"budget for this period."
            ),
            notification_type=Notification.NotificationType.BUDGET_ALERT,
            dedup_key=f"budget_alert:{budget.id}:{WARNING_THRESHOLD}",
        )
