import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from budgets.models import Budget
from expenses.models import Expense
from incomes.models import Income


class ReportSummaryAuthenticationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/reports/summary/"

    def test_requires_authentication(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class ReportSummaryValidationTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="report_val_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/reports/summary/"

    def test_missing_date_params_rejected(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        details = resp.data["error"]["details"]
        self.assertIn("date_from", details)
        self.assertIn("date_to", details)

    def test_date_from_after_date_to_rejected(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-31", "date_to": "2026-08-01"}
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date_to", resp.data["error"]["details"])

    def test_malformed_date_rejected(self):
        resp = self.client.get(
            self.url, {"date_from": "not-a-date", "date_to": "2026-08-31"}
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_equal_date_from_and_date_to_is_valid(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-15", "date_to": "2026-08-15"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class ReportSummaryEmptyDataTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="report_empty_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/reports/summary/"

    def test_empty_data_returns_zeroed_summary_not_error(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["summary"]["total_income"], Decimal("0.00"))
        self.assertEqual(resp.data["summary"]["total_expenses"], Decimal("0.00"))
        self.assertEqual(resp.data["summary"]["net_savings"], Decimal("0.00"))
        self.assertEqual(resp.data["summary"]["savings_rate"], 0.0)
        self.assertEqual(resp.data["trend"], [])
        self.assertEqual(resp.data["transactions"], [])
        self.assertIsNone(resp.data["insights"]["highest_spending_category"])
        self.assertIsNone(resp.data["insights"]["largest_expense"])


class ReportSummaryAggregationTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="report_agg_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/reports/summary/"

        Income.objects.create(
            user=self.user, source="Salary", amount=Decimal("10000.00"),
            date=datetime.date(2026, 8, 5),
        )
        Income.objects.create(
            user=self.user, source="Freelance", amount=Decimal("2000.00"),
            date=datetime.date(2026, 8, 15),
        )
        Expense.objects.create(
            user=self.user, title="Groceries", amount=Decimal("3000.00"),
            category="Food", date=datetime.date(2026, 8, 10),
        )
        Expense.objects.create(
            user=self.user, title="Movie", amount=Decimal("500.00"),
            category="Entertainment", date=datetime.date(2026, 8, 20),
        )

    def test_summary_totals_are_correct(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["summary"]["total_income"], Decimal("12000.00"))
        self.assertEqual(resp.data["summary"]["total_expenses"], Decimal("3500.00"))
        self.assertEqual(resp.data["summary"]["net_savings"], Decimal("8500.00"))

    def test_expense_category_breakdown(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        categories = {
            row["category"]: row["total"] for row in resp.data["expense_by_category"]
        }
        self.assertEqual(categories["Food"], Decimal("3000.00"))
        self.assertEqual(categories["Entertainment"], Decimal("500.00"))

    def test_income_source_breakdown(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        sources = {
            row["source"]: row["total"] for row in resp.data["income_by_source"]
        }
        self.assertEqual(sources["Salary"], Decimal("10000.00"))
        self.assertEqual(sources["Freelance"], Decimal("2000.00"))

    def test_highest_spending_category_insight(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(
            resp.data["insights"]["highest_spending_category"]["category"], "Food"
        )

    def test_largest_expense_insight(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(
            resp.data["insights"]["largest_expense"]["title"], "Groceries"
        )
        self.assertEqual(
            resp.data["insights"]["largest_expense"]["amount"], Decimal("3000.00")
        )

    def test_data_outside_date_range_excluded(self):
        Income.objects.create(
            user=self.user, source="Business", amount=Decimal("99999.00"),
            date=datetime.date(2026, 1, 1),
        )
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(resp.data["summary"]["total_income"], Decimal("12000.00"))

    def test_daily_trend_granularity_for_short_range(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(resp.data["trend_granularity"], "day")

    def test_monthly_trend_granularity_for_long_range(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-01-01", "date_to": "2026-12-31"}
        )
        self.assertEqual(resp.data["trend_granularity"], "month")

    def test_budget_performance_included_for_relevant_month(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="4000", month=8, year=2026
        )
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        performance = resp.data["budget_performance"]
        self.assertEqual(len(performance), 1)
        self.assertEqual(performance[0]["category"], "Food")
        self.assertEqual(performance[0]["spent"], Decimal("3000.00"))

    def test_budget_performance_excludes_budgets_outside_range(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="4000", month=1, year=2026
        )
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(resp.data["budget_performance"], [])

    def test_transactions_list_combines_income_and_expenses(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        types = {t["type"] for t in resp.data["transactions"]}
        self.assertEqual(types, {"Income", "Expense"})
        self.assertEqual(len(resp.data["transactions"]), 4)


class ReportSummaryUserIsolationTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="report_iso_user", password="pw12345678"
        )
        self.other_user = User.objects.create_user(
            username="report_iso_other", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/reports/summary/"

        Income.objects.create(
            user=self.other_user, source="Salary", amount=Decimal("99999.00"),
            date=datetime.date(2026, 8, 5),
        )
        Expense.objects.create(
            user=self.other_user, title="Other's expense", amount=Decimal("99999.00"),
            category="Food", date=datetime.date(2026, 8, 5),
        )

    def test_report_excludes_other_users_data(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["summary"]["total_income"], Decimal("0.00"))
        self.assertEqual(resp.data["summary"]["total_expenses"], Decimal("0.00"))
        self.assertEqual(resp.data["transactions"], [])
