import django_filters

from config.filters import DateRangeFilterMixin

from .models import Expense


class ExpenseFilter(DateRangeFilterMixin):
    """
    Query params:
      ?category=Food
      ?payment_method=UPI
      ?date_from=2026-07-01&date_to=2026-07-31   (via DateRangeFilterMixin)

    Search (title/description) and ordering are handled separately by
    SearchFilter/OrderingFilter on the ViewSet, per §14/§15 - a FilterSet
    only owns exact-match/range filters, not free-text search.
    """

    date_field_name = "date"

    class Meta:
        model = Expense
        fields = ["category", "payment_method"]
