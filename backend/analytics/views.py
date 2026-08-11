from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.contrib.auth.models import User
from django.db.models import Count, Sum
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from budgets.models import (
    Budget,
    SavingsGoal,
    SavingsTransaction,
)
from expenses.models import Expense
from incomes.models import Income
from notifications.models import Notification
from users.models import Profile
from users.permissions import IsAdmin

from .serializers import (
    DashboardSummaryQuerySerializer,
    RecentActivitySerializer,
)


TWO_PLACES = Decimal("0.01")


def _money(value):
    """
    Convert Decimal values into consistently formatted money strings.
    """
    return str(
        (value or Decimal("0")).quantize(
            TWO_PLACES,
            rounding=ROUND_HALF_UP,
        )
    )


class DashboardSummaryView(APIView):
    """
    GET /api/v1/dashboard/summary/?month=&year=

    Returns dashboard analytics for the selected month/year.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = DashboardSummaryQuerySerializer(
            data=request.query_params
        )
        query.is_valid(raise_exception=True)

        today = date.today()

        month = query.validated_data.get(
            "month",
            today.month,
        )

        year = query.validated_data.get(
            "year",
            today.year,
        )

        # =====================================================
        # Monthly Income / Expenses
        # =====================================================

        expense_qs = Expense.objects.filter(
            user=request.user,
            date__year=year,
            date__month=month,
        )

        income_qs = Income.objects.filter(
            user=request.user,
            date__year=year,
            date__month=month,
        )

        budget_qs = Budget.objects.filter(
            user=request.user,
            month=month,
            year=year,
        )

        total_budget = (
            budget_qs.aggregate(
                total=Sum("monthly_limit")
            )["total"]
            or Decimal("0.00")
        )

        total_expenses = (
            expense_qs.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        total_income = (
            income_qs.aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        remaining_budget = (
            total_budget - total_expenses
        )

        net_savings = (
            total_income - total_expenses
        )

        if total_income > 0:
            savings_rate = round(
                float((net_savings / total_income) * 100),
                1,
            )
        else:
            savings_rate = 0.0

        current_balance = (
            total_income - total_expenses
        )

        # =====================================================
        # Lifetime totals (Part 2: "Overall Financial Position")
        # =====================================================
        # Everything above this block (total_income, total_expenses,
        # current_balance, net_savings, savings_rate) is filtered to
        # the selected month/year - correct for a "Monthly Summary",
        # but current_balance was being computed with the exact same
        # month-scoped formula as net_savings (they were duplicates of
        # each other), which is why picking an empty month made the
        # user's balance appear to be literally zero. A real finance
        # app's "Current Balance" is a running lifetime total that
        # doesn't reset each month.
        #
        # This block deliberately does NOT touch total_income,
        # total_expenses, current_balance, or savings_rate above -
        # Expenses.jsx's checkResultingBalance() genuinely needs the
        # month-scoped current_balance (it warns "this expense makes
        # this month go negative", not "you're broke for life"), and
        # the Reports page's SummaryCards/PDF export are correctly
        # scoped to whatever date range the user picked there. Adding
        # a separate "lifetime" object keeps both meanings intact
        # rather than overloading one field with two different
        # meanings depending on which page reads it.
        lifetime_total_income = (
            Income.objects.filter(
                user=request.user
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        lifetime_total_expenses = (
            Expense.objects.filter(
                user=request.user
            ).aggregate(
                total=Sum("amount")
            )["total"]
            or Decimal("0.00")
        )

        lifetime_current_balance = (
            lifetime_total_income - lifetime_total_expenses
        )

        if lifetime_total_income > 0:
            lifetime_savings_rate = round(
                float(
                    (
                        (lifetime_total_income - lifetime_total_expenses)
                        / lifetime_total_income
                    )
                    * 100
                ),
                1,
            )
        else:
            lifetime_savings_rate = 0.0

        # =====================================================
        # Savings Goals
        # =====================================================

        goals = SavingsGoal.objects.filter(
            user=request.user
        )

        total_savings = (
            goals.filter(
                is_archived=False
            )
            .aggregate(
                total=Sum("current_amount")
            )["total"]
            or Decimal("0.00")
        )

        remaining_cash = (
            total_income
            - total_expenses
            - total_savings
        )

        active_goals = goals.filter(
            is_archived=False,
            is_completed=False,
        ).count()

        completed_goals = goals.filter(
            is_completed=True,
            is_archived=False,
        ).count()

        achievements = goals.filter(
            is_archived=True
        ).count()

        latest_achievement = (
            goals.filter(
                is_archived=True,
            )
            .order_by(
                "-purchase_date",
                "-updated_at",
            )
            .first()
        )
        
        # Bug fix: this counted ALL budgets the user has ever created,
        # ignoring month/year entirely - the only field in this whole
        # view that didn't respect the selected period, even though
        # the dashboard is already month/year filtered everywhere
        # else. Filtering by month/year here matches how every other
        # figure in this response (income, expenses, etc.) is scoped.
        budgets_created = Budget.objects.filter(
            user=request.user,
            month=month,
            year=year,
        ).count()

        # =====================================================
        # Expense by Category
        # =====================================================

        spend_by_category = {
            row["category"]: row["total"]
            for row in expense_qs.values(
                "category"
            ).annotate(
                total=Sum("amount")
            )
        }

        expense_by_category = [
            {
                "category": category,
                "total": _money(total),
            }
            for category, total in sorted(
                spend_by_category.items(),
                key=lambda item: item[1],
                reverse=True,
            )
        ]

        # =====================================================
        # Budget Utilization
        # =====================================================

        overspent_categories = 0
        warning_categories = 0

        # Was hardcoded to 90 - now reads the user's own Settings >
        # Financial Preferences > "Budget warning threshold" value,
        # falling back to the model's own default (90) if for any
        # reason the profile lookup comes back empty.
        warning_threshold = getattr(
            request.user.profile, "budget_warning_threshold", 90
        )

        budget_utilization = []

        for budget in budget_qs:

            spent = spend_by_category.get(
                budget.category,
                Decimal("0.00"),
            )

            limit = budget.monthly_limit

            percent_used = (
                float((spent / limit) * 100)
                if limit
                else 0.0
            )

            if percent_used >= 100:
                overspent_categories += 1
            elif percent_used >= warning_threshold:
                warning_categories += 1

            budget_utilization.append(
                {
                    "category": budget.category,
                    "limit": _money(limit),
                    "spent": _money(spent),
                    "percent_used": round(
                        percent_used,
                        1,
                    ),
                }
            )

        # =====================================================
        # Response
        # =====================================================

        return Response(
            {
                "period": {
                    "month": month,
                    "year": year,
                },

                "total_income": _money(
                    total_income
                ),

                "total_expenses": _money(
                    total_expenses
                ),

                "net_savings": _money(
                    net_savings
                ),

                "current_balance": _money(current_balance),

                "remaining_cash": _money(remaining_cash),

                "savings_rate": savings_rate,

                # "Overall Financial Position" (Part 2/3) - unlike
                # everything else in this payload, these never reset
                # when the selected month/year changes.
                "lifetime": {
                    "current_balance": _money(lifetime_current_balance),
                    "total_income": _money(lifetime_total_income),
                    "total_expenses": _money(lifetime_total_expenses),
                    "total_savings": _money(total_savings),
                    "savings_rate": lifetime_savings_rate,
                },

                "total_budget": _money(total_budget),

                "remaining_budget": _money(remaining_budget),

                "budget_status": {
                    "overspent_categories": overspent_categories,
                    "warning_categories": warning_categories,
                },

                "total_savings": _money(total_savings),

                "active_goals": active_goals,

                "completed_goals": completed_goals,

                "achievements": achievements,

                "latest_achievement": (
                    {
                        "id": latest_achievement.id,
                        "goal_name": latest_achievement.goal_name,
                        "target_amount": _money(
                            latest_achievement.target_amount
                        ),
                        "purchase_date": latest_achievement.purchase_date,
                        "purchase_note": (
                            latest_achievement.purchase_note or None
                        ),
                        "is_purchased": latest_achievement.is_purchased,
                        "is_completed": latest_achievement.is_completed,
                    }
                    if latest_achievement
                    else None
                ),

                "budgets_created": budgets_created,

                "expense_by_category": expense_by_category,

                "budget_utilization": budget_utilization,
            }
        )
    

class RecentActivityView(APIView):
    """
    GET /api/v1/dashboard/recent-activity/

    Returns the user's latest activity across the application.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        activities = []

        # ==========================================
        # Income Activities
        # ==========================================

        incomes = (
            Income.objects.filter(
                user=request.user
            )
            .order_by("-created_at")[:10]
        )

        for income in incomes:
            activities.append(
                {
                    "id": income.id,
                    "type": "income",
                    "action": "Added Income",
                    "title": income.source,
                    "description": income.description,
                    "amount": income.amount,
                    "created_at": income.created_at,
                }
            )

        # ==========================================
        # Expense Activities
        # ==========================================

        expenses = (
            Expense.objects.filter(
                user=request.user
            )
            .order_by("-created_at")[:10]
        )

        for expense in expenses:
            activities.append(
                {
                    "id": expense.id,
                    "type": "expense",
                    "action": "Added Expense",
                    "title": expense.category,
                    "description": expense.description,
                    "amount": expense.amount,
                    "created_at": expense.created_at,
                }
            )

        # ==========================================
        # Budget Activities
        # ==========================================

        budgets = (
            Budget.objects.filter(
                user=request.user
            )
            .order_by("-created_at")[:10]
        )

        for budget in budgets:
            activities.append(
                {
                    "id": budget.id,
                    "type": "budget",
                    "action": "Created Budget",
                    "title": budget.category,
                    "description": (
                        f"Budget for {budget.month:02d}/{budget.year}"
                    ),
                    "amount": budget.monthly_limit,
                    "created_at": budget.created_at,
                }
            )

        # ==========================================
        # Savings Goal Activities
        # ==========================================

        goals = (
            SavingsGoal.objects.filter(
                user=request.user
            )
            .order_by("-created_at")[:10]
        )

        for goal in goals:
            activities.append(
                {
                    "id": goal.id,
                    "type": "goal",
                    "action": "Created Savings Goal",
                    "title": goal.goal_name,
                    "description": goal.description,
                    "amount": goal.target_amount,
                    "created_at": goal.created_at,
                }
            )


        # ==========================================
        # Savings Transaction Activities
        # ==========================================

        transactions = (
            SavingsTransaction.objects.filter(
                goal__user=request.user
            )
            .select_related("goal")
            .order_by("-created_at")[:10]
        )

        for transaction in transactions:

            activities.append(
                {
                    "id": transaction.id,
                    "type": (
                        "deposit"
                        if transaction.transaction_type
                        == SavingsTransaction.DEPOSIT
                        else "withdrawal"
                    ),
                    "action": (
                        "Added Money"
                        if transaction.transaction_type
                        == SavingsTransaction.DEPOSIT
                        else "Withdrew Money"
                    ),
                    "title": transaction.goal.goal_name,
                    "description": transaction.note,
                    "amount": transaction.transaction_amount,
                    "created_at": transaction.created_at,
                }
            )

        
        # ==========================================
        # Achievement Activities
        # ==========================================

        achievements = (
            SavingsGoal.objects.filter(
                user=request.user,
                is_archived=True,
            )
            .order_by("-purchase_date")[:10]
        )

        for goal in achievements:

            activities.append(
                {
                    "id": goal.id,
                    "type": "achievement",
                    "action": "Goal Purchased",
                    "title": goal.goal_name,
                    "description": goal.purchase_note,
                    "amount": goal.target_amount,
                    "created_at": goal.updated_at,
                }
            )


        # ==========================================
        # Sort newest first
        # ==========================================

        activities.sort(
            key=lambda x: x["created_at"],
            reverse=True,
        )

        serializer = RecentActivitySerializer(
            activities[:10],
            many=True,
        )

        return Response(serializer.data)


class AdminStatsView(APIView):
    """
    GET /api/v1/dashboard/admin-stats/

    Read-only monitoring/analytics for the BudgetBuddy Admin Dashboard
    (mentor spec: "This dashboard should mainly be monitoring and
    analytics... Do not build unnecessary CRUD"). Deliberately exposes
    no write actions and no per-user financial detail - only aggregate
    counts across the four owning apps (expenses, incomes, budgets,
    savings goals) plus notifications and user/occupation figures,
    reusing each app's existing model rather than introducing a new
    "admin" app or duplicating query logic that already lives in
    DashboardSummaryView/RecentActivityView above.

    IsAdmin (users/permissions.py) is the same permission class that
    already guards UserListView - "Admin" here means Django
    is_superuser/is_staff, never the Profile.role occupation field
    (see RegisterSerializer's and RoleAwareTokenObtainPairSerializer's
    own comments on that distinction).
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total_users = User.objects.count()

        # Occupation distribution (Student / Working Professional /
        # Freelancer / Business Owner / Other) - deliberately excludes
        # the Admin role choice, since that's an authorization label
        # auto-assigned to superusers (users/signals.py), not an
        # occupation a person selected at registration.
        occupation_counts = dict(
            Profile.objects.exclude(role=Profile.Role.ADMIN)
            .values_list("role")
            .annotate(count=Count("id"))
        )
        users_by_occupation = [
            {
                "occupation": label,
                "value": occupation_counts.get(key, 0),
            }
            for key, label in Profile.Role.choices
            if key != Profile.Role.ADMIN
        ]

        # Monthly registrations for the last 6 months (including the
        # current one), oldest first - enough to plot a small trend
        # without pulling every User row into Python.
        today = date.today()
        monthly_registrations = []
        for i in range(5, -1, -1):
            month_index = today.month - 1 - i
            year = today.year + (month_index // 12)
            month = (month_index % 12) + 1
            count = User.objects.filter(
                date_joined__year=year,
                date_joined__month=month,
            ).count()
            monthly_registrations.append(
                {
                    "month": month,
                    "year": year,
                    "count": count,
                }
            )

        role_labels = dict(Profile.Role.choices)
        recent_users = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "occupation": role_labels.get(
                    getattr(user.profile, "role", None), "—"
                ),
                "date_joined": user.date_joined,
            }
            for user in User.objects.select_related("profile").order_by(
                "-date_joined"
            )[:10]
        ]

        return Response(
            {
                "total_users": total_users,
                "users_by_occupation": users_by_occupation,
                "monthly_registrations": monthly_registrations,
                "totals": {
                    "expenses": Expense.objects.count(),
                    "incomes": Income.objects.count(),
                    "budgets": Budget.objects.count(),
                    "savings_goals": SavingsGoal.objects.count(),
                    "notifications": Notification.objects.count(),
                },
                "recent_users": recent_users,
            }
        )