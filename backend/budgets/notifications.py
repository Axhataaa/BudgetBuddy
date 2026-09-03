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


def _tier_for_percent(percent_used):
    """
    Maps a usage percentage onto the fixed 80/90/100 threshold
    architecture, as a single "highest applicable" tier:

      - 0   = below 80%
      - 80  = 80% - 89.99%
      - 90  = 90% - 99.99%
      - 100 = 100%+
    """
    if percent_used >= EXCEEDED_THRESHOLD:
        return EXCEEDED_THRESHOLD
    if percent_used >= HIGH_WARNING_THRESHOLD:
        return HIGH_WARNING_THRESHOLD
    if percent_used >= WARNING_THRESHOLD:
        return WARNING_THRESHOLD
    return 0


def _total_spent(user, category, month, year):
    return (
        Expense.objects.filter(
            user=user, category=category, date__month=month, date__year=year
        ).aggregate(total=Sum("amount"))["total"]
        or Decimal("0.00")
    )


def check_and_notify_budget_alerts(user, category, month, year):
    
    budget = Budget.objects.filter(
        user=user, category=category, month=month, year=year
    ).first()

    if not budget or budget.monthly_limit <= 0:
        return

    total_spent = _total_spent(user, category, month, year)

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


def reconcile_budget_alerts(user, category, month, year):
    """
    Removes stale in-app 80/90/100 threshold Notification rows for the
    given (user, category, month, year) budget that no longer apply to
    its CURRENT usage (current expenses vs. the budget's current
    monthly_limit).

    This never creates a notification and never sends/retracts an email -
    it only ever deletes in-app Notification rows that are no longer
    applicable, using the same `budget_alert:{budget.id}:{threshold}`
    dedup keys check_and_notify_budget_alerts already writes. Any
    notification at or below the current tier is left untouched.

    Safe to call whenever a budget's usage may have gone down, whether
    because an expense was deleted or because the budget's monthly_limit
    was increased.
    """
    budget = Budget.objects.filter(
        user=user, category=category, month=month, year=year
    ).first()

    if not budget:
        return

    if budget.monthly_limit and budget.monthly_limit > 0:
        total_spent = _total_spent(user, category, month, year)
        percent_used = float((total_spent / budget.monthly_limit) * 100)
        tier = _tier_for_percent(percent_used)
    else:
        tier = 0

    stale_thresholds = [
        threshold
        for threshold in (WARNING_THRESHOLD, HIGH_WARNING_THRESHOLD, EXCEEDED_THRESHOLD)
        if threshold > tier
    ]

    if stale_thresholds:
        Notification.objects.filter(
            user=user,
            dedup_key__in=[
                f"budget_alert:{budget.id}:{threshold}" for threshold in stale_thresholds
            ],
        ).delete()


def reconcile_budget_alerts_for_amount_change(user, budget, old_monthly_limit):
    """
    Runs the REQUIRED RULE for a budget-amount edit: the 80/90/100 tier is
    computed BEFORE the edit (old_monthly_limit) and AFTER the edit
    (budget.monthly_limit, already saved), using the exact same existing
    expenses for both. Only the resulting transition decides what happens
    - never the mere fact that the budget was edited:

      - upward tier crossing -> a genuine new threshold-crossing event,
        handled through the exact same check_and_notify_budget_alerts()
        path an expense uses (in-app + email, deduped identically).
      - downward transition or same tier -> only reconcile_budget_alerts()
        runs, which removes now-stale higher-tier in-app notifications
        and never creates/sends anything new.

    Returns a dict describing the transition so callers (the view) can
    tell the frontend whether a genuine upward crossing just happened,
    without the frontend having to re-derive it via extra API calls.
    """
    total_spent = _total_spent(user, budget.category, budget.month, budget.year)

    percent_before = (
        float((total_spent / old_monthly_limit) * 100)
        if old_monthly_limit and old_monthly_limit > 0
        else 0.0
    )
    percent_after = (
        float((total_spent / budget.monthly_limit) * 100)
        if budget.monthly_limit and budget.monthly_limit > 0
        else 0.0
    )

    tier_before = _tier_for_percent(percent_before)
    tier_after = _tier_for_percent(percent_after)

    crossed_up = tier_after > tier_before

    if crossed_up:
        check_and_notify_budget_alerts(user, budget.category, budget.month, budget.year)
    else:
        reconcile_budget_alerts(user, budget.category, budget.month, budget.year)

    return {
        "tier_before": tier_before,
        "tier_after": tier_after,
        "threshold_crossed_up": crossed_up,
    }
