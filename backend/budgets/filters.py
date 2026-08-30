import django_filters

from .models import Budget, SavingsGoal


class BudgetFilter(django_filters.FilterSet):
    class Meta:
        model = Budget
        fields = ["category", "month", "year"]


class SavingsGoalFilter(django_filters.FilterSet):
    """
    Supports the Savings Goals filter UI: status (derived from the
    existing is_completed/is_purchased fields), goal type, and goal
    category. Search and ordering are handled separately by the
    viewset's existing search_fields/ordering_fields.
    """

    status = django_filters.ChoiceFilter(
        choices=[
            ("in_progress", "In progress"),
            ("completed", "Completed"),
            ("purchased", "Purchased"),
        ],
        method="filter_status",
        label="Status",
    )

    class Meta:
        model = SavingsGoal
        fields = ["goal_type", "goal_category"]

    def filter_status(self, queryset, name, value):
        if value == "in_progress":
            return queryset.filter(is_completed=False)
        if value == "completed":
            return queryset.filter(is_completed=True, is_purchased=False)
        if value == "purchased":
            return queryset.filter(is_purchased=True)
        return queryset
