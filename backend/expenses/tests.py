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


class ExpenseCRUDTests(TestCase):
    """Covers create/update/delete happy paths, field validation, and
    cross-user ownership isolation — gaps left by the original
    ordering-focused test file."""

    def setUp(self):
        self.user = User.objects.create_user(username="expense_owner", password="pw12345")
        self.other_user = User.objects.create_user(username="expense_other", password="pw12345")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        from .models import Expense

        self.expense = Expense.objects.create(
            user=self.user, title="Groceries", amount="150.00",
            category="Food", date=datetime.date(2026, 1, 10), payment_method="Cash",
        )

    def _payload(self, **overrides):
        payload = {
            "title": "Coffee",
            "amount": "4.50",
            "category": "Food",
            "payment_method": "UPI",
            "date": "2026-01-15",
        }
        payload.update(overrides)
        return payload

    def test_create_expense_succeeds_with_valid_data(self):
        resp = self.client.post("/api/v1/expenses/", self._payload(), format="json")
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data["title"], "Coffee")

    def test_create_expense_rejects_zero_amount(self):
        resp = self.client.post("/api/v1/expenses/", self._payload(amount="0"), format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("amount", resp.data["error"]["details"])

    def test_create_expense_rejects_negative_amount(self):
        resp = self.client.post("/api/v1/expenses/", self._payload(amount="-10.00"), format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("amount", resp.data["error"]["details"])

    def test_create_expense_rejects_blank_title(self):
        resp = self.client.post("/api/v1/expenses/", self._payload(title="   "), format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("title", resp.data["error"]["details"])

    def test_create_expense_trims_title_whitespace(self):
        resp = self.client.post("/api/v1/expenses/", self._payload(title="  Snacks  "), format="json")
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data["title"], "Snacks")

    def test_create_expense_rejects_far_future_date(self):
        far_future = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
        resp = self.client.post("/api/v1/expenses/", self._payload(date=far_future), format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("date", resp.data["error"]["details"])

    def test_create_expense_allows_one_day_grace_window_for_timezone_ahead_users(self):
        tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
        resp = self.client.post("/api/v1/expenses/", self._payload(date=tomorrow), format="json")
        self.assertEqual(resp.status_code, 201, resp.data)

    def test_create_expense_rejects_invalid_category_choice(self):
        resp = self.client.post("/api/v1/expenses/", self._payload(category="NotACategory"), format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("category", resp.data["error"]["details"])

    def test_create_expense_rejects_invalid_payment_method_choice(self):
        resp = self.client.post("/api/v1/expenses/", self._payload(payment_method="Crypto"), format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("payment_method", resp.data["error"]["details"])

    def test_create_expense_requires_authentication(self):
        anon_client = APIClient()
        resp = anon_client.post("/api/v1/expenses/", self._payload(), format="json")
        self.assertEqual(resp.status_code, 401)

    def test_update_expense_succeeds(self):
        resp = self.client.patch(f"/api/v1/expenses/{self.expense.id}/", {"amount": "200.00"}, format="json")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["amount"], "200.00")

    def test_update_expense_rejects_invalid_amount(self):
        resp = self.client.patch(f"/api/v1/expenses/{self.expense.id}/", {"amount": "0"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_delete_expense_succeeds(self):
        resp = self.client.delete(f"/api/v1/expenses/{self.expense.id}/")
        self.assertEqual(resp.status_code, 204)

    def test_retrieve_nonexistent_expense_returns_404(self):
        resp = self.client.get("/api/v1/expenses/999999/")
        self.assertEqual(resp.status_code, 404)

    def test_cannot_retrieve_another_users_expense(self):
        other_client = APIClient()
        other_client.force_authenticate(user=self.other_user)
        resp = other_client.get(f"/api/v1/expenses/{self.expense.id}/")
        self.assertEqual(resp.status_code, 404)

    def test_cannot_update_another_users_expense(self):
        other_client = APIClient()
        other_client.force_authenticate(user=self.other_user)
        resp = other_client.patch(f"/api/v1/expenses/{self.expense.id}/", {"amount": "999.00"}, format="json")
        self.assertEqual(resp.status_code, 404)
        self.expense.refresh_from_db()
        self.assertEqual(str(self.expense.amount), "150.00")

    def test_cannot_delete_another_users_expense(self):
        other_client = APIClient()
        other_client.force_authenticate(user=self.other_user)
        resp = other_client.delete(f"/api/v1/expenses/{self.expense.id}/")
        self.assertEqual(resp.status_code, 404)
        from .models import Expense
        self.assertTrue(Expense.objects.filter(id=self.expense.id).exists())

    def test_list_expenses_only_returns_own_expenses(self):
        from .models import Expense
        Expense.objects.create(
            user=self.other_user, title="Other user's item", amount="10.00",
            category="Food", date=datetime.date(2026, 1, 10), payment_method="Cash",
        )
        resp = self.client.get("/api/v1/expenses/")
        self.assertEqual(resp.status_code, 200)
        titles = [r["title"] for r in resp.data["results"]]
        self.assertNotIn("Other user's item", titles)

