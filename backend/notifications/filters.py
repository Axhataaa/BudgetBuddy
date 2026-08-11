import django_filters

from .models import Notification


class NotificationFilter(django_filters.FilterSet):
    """
    Mirrors the existing FilterSet convention already used across the
    API (budgets/filters.py's BudgetFilter, expenses/filters.py's
    ExpenseFilter, etc.) - server-side filtering via the globally
    enabled DjangoFilterBackend (config/settings.py), not a new
    mechanism. Needed because the Notifications page is server-
    paginated: a purely client-side "Unread" filter would only ever
    filter whatever happens to be on the current page.

    notification_type accepts a single value ("expense") exactly as
    before, OR a comma-separated list ("budget,budget_warning,
    budget_exceeded,budget_alert") - the frontend's filter chips group
    several related NotificationType values under one user-facing
    category (e.g. "Budgets"), so the API needs to match any one of
    them rather than only ever a single exact type. Single-value
    callers see no behavior change.
    """

    notification_type = django_filters.CharFilter(method="filter_notification_type")

    class Meta:
        model = Notification
        fields = ["notification_type", "is_read", "priority"]

    def filter_notification_type(self, queryset, name, value):
        values = [v.strip() for v in value.split(",") if v.strip()]
        if not values:
            return queryset
        return queryset.filter(notification_type__in=values)
