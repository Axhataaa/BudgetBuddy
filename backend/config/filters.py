import django_filters


class DateRangeFilterMixin(django_filters.FilterSet):

    date_field_name = "date"

    date_from = django_filters.DateFilter(method="filter_date_from")
    date_to = django_filters.DateFilter(method="filter_date_to")

    def filter_date_from(self, queryset, name, value):
        return queryset.filter(**{f"{self.date_field_name}__gte": value})

    def filter_date_to(self, queryset, name, value):
        return queryset.filter(**{f"{self.date_field_name}__lte": value})
