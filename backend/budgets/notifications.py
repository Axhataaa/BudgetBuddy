from decimal import Decimal

from django.db.models import Sum

from common.formatting import format_inr
from expenses.models import Expense
from notifications.notification_service import create_notification
from notifications.models import Notification

from .models import Budget

WARNING_THRESHOLD = 80
HIGH_WARNING_THRESHOLD = 90
EXCEEDED_THRESHOLD = 100


def check_and_notify_budget_alerts(user, category, month, year):
    """
    Fires a persistent notification when a budget crosses 80%, 90%, or
    100% usage. Called after an expense is created/updated
    (expenses/views.py) - a change to any OTHER category's expense
    can't affect this budget, so it's only checked for the specific
    category/month/year that just changed, not every budget the user
    has.

    Uses the same spend calculation (sum of Expense amounts for that
    user/category/month/year) as BudgetViewSet.summary() and
    analytics/views.py's DashboardSummaryView - not a new formula, and
    matches BudgetViewSet.summary()'s alert_level tiers exactly
    (80-89.99% warning, 90-99.99% high_warning, 100%+ exceeded).

    Deduplicated per (budget, threshold tier) via dedup_key, so a
    budget only ever produces one notification per tier, no matter how
    many further expenses are added afterward - not a notification per
    expense. The three tiers use three distinct dedup_key suffixes, so
    crossing 80% then later 90% then later 100% on the same budget
    produces three separate notifications (one per tier reached), not
    zero (already alerted) or duplicates of the same tier.

    Priority: Budget Warning (80-89%) is MEDIUM rather than HIGH now
    that there's a genuinely higher tier above it (High Warning,
    90-99%) - previously this was the single most-urgent non-exceeded
    tier and was HIGH, but with High Warning now sitting above it,
    keeping both at HIGH would make them indistinguishable by urgency.
    Budget Exceeded and Budget High Warning are both HIGH, matching
    Budget Exceeded's existing priority.
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
            title="Budget Exceeded",
            priority=Notification.Priority.HIGH,
            message=(
                f"Your {category_label} budget has been fully exhausted - "
                f"you've spent {percent_used:.0f}% of your "
                f"₹{format_inr(budget.monthly_limit)} limit."
            ),
            notification_type=Notification.NotificationType.BUDGET_ALERT,
            action_url="/budgets",
            dedup_key=f"budget_alert:{budget.id}:{EXCEEDED_THRESHOLD}",
        )
    elif percent_used >= HIGH_WARNING_THRESHOLD:
        create_notification(
            user=user,
            title="Budget High Warning",
            priority=Notification.Priority.HIGH,
            message=(
                f"You've used {percent_used:.0f}% of your {category_label} "
                f"budget for this period - it's almost exhausted."
            ),
            notification_type=Notification.NotificationType.BUDGET_ALERT,
            action_url="/budgets",
            dedup_key=f"budget_alert:{budget.id}:{HIGH_WARNING_THRESHOLD}",
        )
    elif percent_used >= WARNING_THRESHOLD:
        create_notification(
            user=user,
            title="Budget Warning",
            priority=Notification.Priority.MEDIUM,
            message=(
                f"You've used {percent_used:.0f}% of your {category_label} "
                f"budget for this period."
            ),
            notification_type=Notification.NotificationType.BUDGET_ALERT,
            action_url="/budgets",
            dedup_key=f"budget_alert:{budget.id}:{WARNING_THRESHOLD}",
        )
