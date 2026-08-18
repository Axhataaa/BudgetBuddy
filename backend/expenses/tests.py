import datetime

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient


class ExpenseSameDateOrderingTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="expense_order_tester", password="pw12345"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        from .models import Expense

        same_date = datetime.date(2026, 8, 15)
        
        self.ice_cream = Expense.objects.create(
            user=self.user, title="ice cream", amount="80.00",
            category="Food", date=same_date, payment_method="UPI",
        )
        self.meds = Expense.objects.create(
            user=self.user, title="meds", amount="500.00",
            category="Healthcare", date=same_date, payment_method="UPI",
        )
        self.recharge = Expense.objects.create(
            user=self.user, title="recharge", amount="899.00",
            category="Bills", date=same_date, payment_method="UPI",
        )

    def test_latest_first_breaks_same_date_ties_by_newest_created(self):
        resp = self.client.get("/api/v1/expenses/", {"ordering": "-date"})
        self.assertEqual(resp.status_code, 200, resp.data)
        titles = [row["title"] for row in resp.data["results"]]
        self.assertEqual(titles, ["recharge", "meds", "ice cream"])

    def test_oldest_first_breaks_same_date_ties_by_oldest_created(self):
        resp = self.client.get("/api/v1/expenses/", {"ordering": "date"})
        self.assertEqual(resp.status_code, 200, resp.data)
        titles = [row["title"] for row in resp.data["results"]]
        self.assertEqual(titles, ["ice cream", "meds", "recharge"])

    def test_no_ordering_param_still_uses_default_tiebreak(self):
        resp = self.client.get("/api/v1/expenses/")
        self.assertEqual(resp.status_code, 200, resp.data)
        titles = [row["title"] for row in resp.data["results"]]
        self.assertEqual(titles, ["recharge", "meds", "ice cream"])

    def test_amount_ordering_is_unaffected(self):
        resp = self.client.get("/api/v1/expenses/", {"ordering": "-amount"})
        self.assertEqual(resp.status_code, 200, resp.data)
        titles = [row["title"] for row in resp.data["results"]]
        self.assertEqual(titles, ["recharge", "meds", "ice cream"])

    def test_existing_filters_and_search_still_work_with_date_ordering(self):
        resp = self.client.get(
            "/api/v1/expenses/", {"ordering": "-date", "category": "Food"}
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual([r["title"] for r in resp.data["results"]], ["ice cream"])

        resp = self.client.get(
            "/api/v1/expenses/", {"ordering": "-date", "search": "meds"}
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual([r["title"] for r in resp.data["results"]], ["meds"])

