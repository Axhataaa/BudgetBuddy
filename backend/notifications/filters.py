import django_filters

from .models import Notification


class NotificationFilter(django_filters.FilterSet):

    notification_type = django_filters.CharFilter(method="filter_notification_type")

    class Meta:
        model = Notification
        fields = ["notification_type", "is_read", "priority"]

    def filter_notification_type(self, queryset, name, value):
        values = [v.strip() for v in value.split(",") if v.strip()]
        if not values:
            return queryset
        return queryset.filter(notification_type__in=values)
