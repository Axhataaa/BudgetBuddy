from decimal import Decimal

from django.db.models import Sum

from common.formatting import format_currency_for_user
from expenses.models import Expense
from notifications.notification_service import create_notification
from notifications.models import Notification

from .models import Budget

WARNING_THRESHOLD = 80
HIGH_WARNING_THRESHOLD = 90
EXCEEDED_THRESHOLD = 100


def check_and_notify_budget_alerts(user, category, month, year):
    
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
                f"{format_currency_for_user(user, budget.monthly_limit)} limit."
            ),
            notification_type=Notification.NotificationType.BUDGET_EXCEEDED,
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
            notification_type=Notification.NotificationType.BUDGET_WARNING,
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
            notification_type=Notification.NotificationType.BUDGET_WARNING,
            action_url="/budgets",
            dedup_key=f"budget_alert:{budget.id}:{WARNING_THRESHOLD}",
        )
