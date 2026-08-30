import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from budgets.models import Budget, SavingsGoal
from expenses.models import Expense
from incomes.models import Income


class DashboardSummaryLatestAchievementTests(TestCase):
    """
    Phase 4B: `latest_achievement` must expose `goal_type` so the (future)
    frontend can distinguish Purchase vs Non-Purchase achievements.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="dashboard_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_latest_achievement_includes_goal_type(self):
        SavingsGoal.objects.create(
            user=self.user,
            goal_name="Emergency Fund",
            goal_type=SavingsGoal.GoalType.FUND,
            target_amount=Decimal("1000"),
            current_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
            is_archived=True,
            purchase_date=timezone.localdate(),
        )

        resp = self.client.get("/api/v1/dashboard/summary/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(resp.data["latest_achievement"])
        self.assertEqual(
            resp.data["latest_achievement"]["goal_type"],
            SavingsGoal.GoalType.FUND,
        )


class DashboardMonthlySavingTargetTests(TestCase):
    """
    Task 1: the Dashboard summary must expose the user's
    monthly_saving_target as-is, alongside the already-existing
    net_savings figure, without duplicating any calculation.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="target_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/dashboard/summary/?month=8&year=2026"

    def _set_target(self, value):
        self.user.profile.monthly_saving_target = Decimal(value)
        self.user.profile.save(update_fields=["monthly_saving_target"])

    def _create_income(self, amount, date=datetime.date(2026, 8, 5)):
        Income.objects.create(
            user=self.user, source="Salary", amount=amount, date=date
        )

    def _create_expense(self, amount, date=datetime.date(2026, 8, 10)):
        Expense.objects.create(
            user=self.user,
            title="test expense",
            amount=amount,
            category="Food",
            date=date,
        )

    def test_target_equals_net_savings(self):
        self._set_target("5000")
        self._create_income("50000")
        self._create_expense("45000")

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["net_savings"], "5000.00")
        self.assertEqual(resp.data["monthly_saving_target"], "5000.00")

    def test_target_exceeded(self):
        self._set_target("5000")
        self._create_income("50000")
        self._create_expense("40000")

        resp = self.client.get(self.url)
        self.assertEqual(resp.data["net_savings"], "10000.00")
        self.assertEqual(resp.data["monthly_saving_target"], "5000.00")

    def test_target_partially_achieved(self):
        self._set_target("10000")
        self._create_income("50000")
        self._create_expense("47000")

        resp = self.client.get(self.url)
        self.assertEqual(resp.data["net_savings"], "3000.00")
        self.assertEqual(resp.data["monthly_saving_target"], "10000.00")

    def test_negative_net_savings_with_target_set(self):
        self._set_target("5000")
        self._create_income("10000")
        self._create_expense("15000")

        resp = self.client.get(self.url)
        self.assertEqual(resp.data["net_savings"], "-5000.00")
        self.assertEqual(resp.data["monthly_saving_target"], "5000.00")

    def test_zero_target_returns_zero_not_error(self):
        self._set_target("0")
        self._create_income("50000")
        self._create_expense("45000")

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["monthly_saving_target"], "0.00")

    def test_no_income_or_expense_data(self):
        self._set_target("5000")

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["net_savings"], "0.00")
        self.assertEqual(resp.data["monthly_saving_target"], "5000.00")

    def test_selected_month_year_is_used_for_comparison(self):
        self._set_target("5000")
        # September data should not affect the August summary requested.
        self._create_income("100000", date=datetime.date(2026, 9, 5))
        self._create_expense("1000", date=datetime.date(2026, 9, 6))
        self._create_income("20000", date=datetime.date(2026, 8, 5))
        self._create_expense("18000", date=datetime.date(2026, 8, 6))

        resp = self.client.get(self.url)
        self.assertEqual(resp.data["net_savings"], "2000.00")

    def test_existing_dashboard_metrics_unchanged(self):
        self._set_target("5000")
        self._create_income("50000")
        self._create_expense("45000")
        Budget.objects.create(
            user=self.user,
            category="Food",
            monthly_limit="1000",
            month=8,
            year=2026,
        )

        resp = self.client.get(self.url)
        self.assertIn("total_income", resp.data)
        self.assertIn("total_expenses", resp.data)
        self.assertIn("net_savings", resp.data)
        self.assertIn("current_balance", resp.data)
        self.assertIn("budget_status", resp.data)
        self.assertEqual(resp.data["total_income"], "50000.00")
        self.assertEqual(resp.data["total_expenses"], "45000.00")


class DashboardBudgetNearingLimitFixedThresholdTests(TestCase):
    """
    Task 3: the Dashboard's "nearing limit" bucket must use the fixed
    80% product-wide boundary and no longer read from the user's
    (now-removed) configurable budget_warning_threshold.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="fixed_threshold_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/dashboard/summary/?month=8&year=2026"

    def _create_expense(self, amount):
        Expense.objects.create(
            user=self.user,
            title="test expense",
            amount=amount,
            category="Food",
            date=datetime.date(2026, 8, 10),
        )

    def test_just_below_80_percent_is_not_a_warning(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="1000", month=8, year=2026
        )
        self._create_expense("799.00")

        resp = self.client.get(self.url)
        self.assertEqual(resp.data["budget_status"]["warning_categories"], 0)
        self.assertEqual(resp.data["budget_status"]["overspent_categories"], 0)

    def test_at_80_percent_is_a_warning(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="1000", month=8, year=2026
        )
        self._create_expense("800.00")

        resp = self.client.get(self.url)
        self.assertEqual(resp.data["budget_status"]["warning_categories"], 1)
        self.assertEqual(resp.data["budget_status"]["overspent_categories"], 0)

    def test_at_100_percent_is_overspent_not_warning(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="1000", month=8, year=2026
        )
        self._create_expense("1000.00")

        resp = self.client.get(self.url)
        self.assertEqual(resp.data["budget_status"]["overspent_categories"], 1)
        self.assertEqual(resp.data["budget_status"]["warning_categories"], 0)

    def test_threshold_is_not_affected_by_profile_field(self):
        # Even though the model field still exists dormant on the profile,
        # the Dashboard must ignore it and always apply the fixed 80%
        # boundary.
        self.user.profile.budget_warning_threshold = 95
        self.user.profile.save(update_fields=["budget_warning_threshold"])

        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="1000", month=8, year=2026
        )
        self._create_expense("850.00")

        resp = self.client.get(self.url)
        self.assertEqual(resp.data["budget_status"]["warning_categories"], 1)
