from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class BudgetWarningThresholdRemovedFromProfileAPITests(TestCase):
    """
    Task 3: budget_warning_threshold must no longer be user-configurable.
    It should not be exposed on GET, and attempts to change it via PATCH
    must be silently ignored (the underlying dormant field is untouched).
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="prefs_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/users/me/"

    def test_get_profile_does_not_expose_budget_warning_threshold(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertNotIn("budget_warning_threshold", resp.data)

    def test_patch_ignores_budget_warning_threshold(self):
        original = self.user.profile.budget_warning_threshold
        resp = self.client.patch(
            self.url,
            {"budget_warning_threshold": 50},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(
            self.user.profile.budget_warning_threshold, original
        )

    def test_monthly_saving_target_still_configurable(self):
        resp = self.client.patch(
            self.url,
            {"monthly_saving_target": "7500"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(
            str(self.user.profile.monthly_saving_target), "7500.00"
        )

    def test_monthly_saving_target_rejects_negative(self):
        resp = self.client.patch(
            self.url,
            {"monthly_saving_target": "-100"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
