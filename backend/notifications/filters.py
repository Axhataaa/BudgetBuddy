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
    """

    class Meta:
        model = Notification
        fields = ["notification_type", "is_read", "priority"]
