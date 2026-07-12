import django_filters


class DateRangeFilterMixin(django_filters.FilterSet):
    """
    Adds `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` to any FilterSet.

    Per the approved Backend API Design Document §16, date-range params
    are named identically across every module - subclasses only need to
    set `date_field_name` to point at whichever field on their model
    represents "the date" (e.g. "date" on Expense/Income, "generated_at"
    on Report).
    """

    date_field_name = "date"

    date_from = django_filters.DateFilter(method="filter_date_from")
    date_to = django_filters.DateFilter(method="filter_date_to")

    def filter_date_from(self, queryset, name, value):
        return queryset.filter(**{f"{self.date_field_name}__gte": value})

    def filter_date_to(self, queryset, name, value):
        return queryset.filter(**{f"{self.date_field_name}__lte": value})
