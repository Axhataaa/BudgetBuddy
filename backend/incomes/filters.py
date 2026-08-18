from config.filters import DateRangeFilterMixin

from .models import Income


class IncomeFilter(DateRangeFilterMixin):
    date_field_name = "date"

    class Meta:
        model = Income
        fields = ["source"]
