from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from budgets.models import Budget
from expenses.models import Expense
from incomes.models import Income

from .serializers import DashboardSummaryQuerySerializer

TWO_PLACES = Decimal("0.01")


def _money(value):
    """
    Sum() aggregation doesn't reliably preserve a DecimalField's
    decimal_places across DB backends (verified: SQLite returns
    Decimal('150.5') instead of Decimal('150.50') for a sum that should
    have 2 places) - every amount is explicitly quantized before being
    turned into the string the API contract promises, rather than
    trusting the aggregate's scale.
    """
    return str((value or Decimal("0")).quantize(TWO_PLACES, rounding=ROUND_HALF_UP))


class DashboardSummaryView(APIView):
    """
    GET /api/v1/dashboard/summary/?month=&year=

    Read-only aggregate over the current user's Expense/Income/Budget
    rows for one period (defaults to the current month/year). Recent
    transactions are deliberately NOT included here - per API Design
    Doc §26/§30, that's served by the existing /expenses/ and /incomes/
    list endpoints, not duplicated here.

    budget_utilization now included now that the Budget module exists -
    previously omitted rather than stubbed out ahead of the data
    existing. savings_goals_progress is still omitted for the same
    reason: SavingsGoal isn't built yet.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = DashboardSummaryQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)

        today = date.today()
        month = query.validated_data.get("month", today.month)
        year = query.validated_data.get("year", today.year)

        expense_qs = Expense.objects.filter(user=request.user, date__year=year, date__month=month)
        income_qs = Income.objects.filter(user=request.user, date__year=year, date__month=month)
        budget_qs = Budget.objects.filter(user=request.user, month=month, year=year)

        total_expenses = expense_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        total_income = income_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        net_savings = total_income - total_expenses

        spend_by_category = {
            row["category"]: row["total"]
            for row in expense_qs.values("category").annotate(total=Sum("amount"))
        }

        expense_by_category = [
            {"category": category, "total": _money(total)}
            for category, total in sorted(spend_by_category.items(), key=lambda kv: kv[1], reverse=True)
        ]

        # Utilization is driven by the budgets that exist this period,
        # not by every category that has spend - a category with no
        # budget set has nothing to be "over" or "under", so it isn't
        # part of this list (it still shows up in expense_by_category
        # above).
        budget_utilization = []
        for budget in budget_qs:
            spent = spend_by_category.get(budget.category, Decimal("0.00"))
            limit = budget.monthly_limit
            percent_used = float((spent / limit) * 100) if limit else 0.0
            budget_utilization.append(
                {
                    "category": budget.category,
                    "limit": _money(limit),
                    "spent": _money(spent),
                    "percent_used": round(percent_used, 1),
                }
            )

        return Response(
            {
                "period": {"month": month, "year": year},
                "total_income": _money(total_income),
                "total_expenses": _money(total_expenses),
                "net_savings": _money(net_savings),
                "expense_by_category": expense_by_category,
                "budget_utilization": budget_utilization,
            }
        )
