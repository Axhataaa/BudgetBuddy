import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from budgets.models import SavingsGoal


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
