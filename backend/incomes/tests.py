import datetime

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from notifications.models import Notification

from .models import Income


class IncomeAuthenticationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/incomes/"

    def test_list_requires_authentication(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_requires_authentication(self):
        resp = self.client.post(
            self.url,
            {"source": "Salary", "amount": "1000.00", "date": "2026-01-05"},
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class IncomeCRUDTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="income_owner", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/incomes/"

    def test_create_income(self):
        resp = self.client.post(
            self.url,
            {
                "source": "Salary",
                "amount": "50000.00",
                "date": "2026-08-01",
                "description": "Monthly salary",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(Income.objects.count(), 1)
        income = Income.objects.first()
        self.assertEqual(income.user, self.user)

    def test_create_income_generates_notification(self):
        resp = self.client.post(
            self.url,
            {"source": "Freelance", "amount": "2000.00", "date": "2026-08-01"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                notification_type=Notification.NotificationType.INCOME,
            ).exists()
        )

    def test_retrieve_income(self):
        income = Income.objects.create(
            user=self.user,
            source="Salary",
            amount="1000.00",
            date=datetime.date(2026, 8, 1),
        )
        resp = self.client.get(f"{self.url}{income.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["source"], "Salary")

    def test_update_income(self):
        income = Income.objects.create(
            user=self.user,
            source="Salary",
            amount="1000.00",
            date=datetime.date(2026, 8, 1),
        )
        resp = self.client.patch(
            f"{self.url}{income.id}/", {"amount": "1500.00"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        income.refresh_from_db()
        self.assertEqual(str(income.amount), "1500.00")

    def test_delete_income(self):
        income = Income.objects.create(
            user=self.user,
            source="Salary",
            amount="1000.00",
            date=datetime.date(2026, 8, 1),
        )
        resp = self.client.delete(f"{self.url}{income.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Income.objects.filter(id=income.id).exists())

    def test_list_only_returns_own_incomes(self):
        other_user = User.objects.create_user(
            username="other_income_user", password="pw12345678"
        )
        Income.objects.create(
            user=other_user,
            source="Business",
            amount="9999.00",
            date=datetime.date(2026, 8, 1),
        )
        Income.objects.create(
            user=self.user,
            source="Salary",
            amount="1000.00",
            date=datetime.date(2026, 8, 1),
        )

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["source"], "Salary")

    def test_cannot_retrieve_another_users_income(self):
        other_user = User.objects.create_user(
            username="other_income_user2", password="pw12345678"
        )
        other_income = Income.objects.create(
            user=other_user,
            source="Business",
            amount="9999.00",
            date=datetime.date(2026, 8, 1),
        )
        resp = self.client.get(f"{self.url}{other_income.id}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_update_another_users_income(self):
        other_user = User.objects.create_user(
            username="other_income_user3", password="pw12345678"
        )
        other_income = Income.objects.create(
            user=other_user,
            source="Business",
            amount="9999.00",
            date=datetime.date(2026, 8, 1),
        )
        resp = self.client.patch(
            f"{self.url}{other_income.id}/", {"amount": "1.00"}
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        other_income.refresh_from_db()
        self.assertEqual(str(other_income.amount), "9999.00")

    def test_cannot_delete_another_users_income(self):
        other_user = User.objects.create_user(
            username="other_income_user4", password="pw12345678"
        )
        other_income = Income.objects.create(
            user=other_user,
            source="Business",
            amount="9999.00",
            date=datetime.date(2026, 8, 1),
        )
        resp = self.client.delete(f"{self.url}{other_income.id}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Income.objects.filter(id=other_income.id).exists())


class IncomeValidationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="income_validation_user", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/incomes/"

    def test_amount_must_be_positive(self):
        resp = self.client.post(
            self.url,
            {"source": "Salary", "amount": "0", "date": "2026-08-01"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("amount", resp.data["error"]["details"])

    def test_negative_amount_rejected(self):
        resp = self.client.post(
            self.url,
            {"source": "Salary", "amount": "-50", "date": "2026-08-01"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_source_choice_rejected(self):
        resp = self.client.post(
            self.url,
            {"source": "NotARealSource", "amount": "100", "date": "2026-08-01"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("source", resp.data["error"]["details"])

    def test_missing_required_fields_rejected(self):
        resp = self.client.post(self.url, {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        details = resp.data["error"]["details"]
        self.assertIn("source", details)
        self.assertIn("amount", details)
        self.assertIn("date", details)

    def test_far_future_date_rejected(self):
        far_future = (
            datetime.date.today() + datetime.timedelta(days=30)
        ).isoformat()
        resp = self.client.post(
            self.url, {"source": "Salary", "amount": "100", "date": far_future}
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", resp.data["error"]["details"])

    def test_one_day_ahead_date_allowed_for_timezone_grace(self):
        tomorrow = (
            datetime.date.today() + datetime.timedelta(days=1)
        ).isoformat()
        resp = self.client.post(
            self.url, {"source": "Salary", "amount": "100", "date": tomorrow}
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_description_is_optional(self):
        resp = self.client.post(
            self.url, {"source": "Other", "amount": "50", "date": "2026-08-01"}
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class IncomeFilterOrderingTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="income_filter_user", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/incomes/"

        Income.objects.create(
            user=self.user, source="Salary", amount="5000.00",
            date=datetime.date(2026, 8, 1),
        )
        Income.objects.create(
            user=self.user, source="Freelance", amount="1500.00",
            date=datetime.date(2026, 8, 10),
        )
        Income.objects.create(
            user=self.user, source="Salary", amount="200.00",
            date=datetime.date(2026, 7, 1),
        )

    def test_filter_by_source(self):
        resp = self.client.get(self.url, {"source": "Salary"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)

    def test_filter_by_date_range(self):
        resp = self.client.get(
            self.url, {"date_from": "2026-08-01", "date_to": "2026-08-31"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)

    def test_search_by_description(self):
        Income.objects.create(
            user=self.user,
            source="Other",
            amount="300.00",
            date=datetime.date(2026, 8, 5),
            description="Birthday gift",
        )
        resp = self.client.get(self.url, {"search": "Birthday"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_ordering_by_amount_descending(self):
        resp = self.client.get(self.url, {"ordering": "-amount"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        amounts = [row["amount"] for row in resp.data["results"]]
        self.assertEqual(amounts, ["5000.00", "1500.00", "200.00"])

    def test_default_ordering_is_by_date_descending(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        dates = [row["date"] for row in resp.data["results"]]
        self.assertEqual(dates, sorted(dates, reverse=True))
