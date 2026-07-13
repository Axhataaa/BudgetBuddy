from config.filters import DateRangeFilterMixin

from .models import Income


class IncomeFilter(DateRangeFilterMixin):
    """
    Query params:
      ?source=Scholarship
      ?date_from=2026-07-01&date_to=2026-07-31   (via DateRangeFilterMixin)
    """

    date_field_name = "date"

    class Meta:
        model = Income
        fields = ["source"]
