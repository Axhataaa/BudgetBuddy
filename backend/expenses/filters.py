import django_filters

from config.filters import DateRangeFilterMixin

from .models import Expense


class ExpenseFilter(DateRangeFilterMixin):

    date_field_name = "date"

    class Meta:
        model = Expense
        fields = ["category", "payment_method"]
