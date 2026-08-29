import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from expenses.models import Expense
from notifications.models import Notification

from .models import Budget, SavingsGoal, SavingsTransaction


# ==========================================================
# Budget
# ==========================================================

class BudgetAuthenticationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/budgets/"

    def test_list_requires_authentication(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_requires_authentication(self):
        resp = self.client.post(
            self.url,
            {"category": "Food", "monthly_limit": "1000", "month": 8, "year": 2026},
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class BudgetCRUDTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="budget_owner", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/budgets/"

    def test_create_budget(self):
        resp = self.client.post(
            self.url,
            {"category": "Food", "monthly_limit": "5000", "month": 8, "year": 2026},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(Budget.objects.count(), 1)

    def test_create_budget_generates_notification(self):
        self.client.post(
            self.url,
            {"category": "Food", "monthly_limit": "5000", "month": 8, "year": 2026},
        )
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                notification_type=Notification.NotificationType.BUDGET,
            ).exists()
        )

    def test_update_budget(self):
        budget = Budget.objects.create(
            user=self.user, category="Food", monthly_limit="5000", month=8, year=2026
        )
        resp = self.client.patch(
            f"{self.url}{budget.id}/", {"monthly_limit": "6000"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        budget.refresh_from_db()
        self.assertEqual(str(budget.monthly_limit), "6000.00")

    def test_delete_budget(self):
        budget = Budget.objects.create(
            user=self.user, category="Food", monthly_limit="5000", month=8, year=2026
        )
        resp = self.client.delete(f"{self.url}{budget.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Budget.objects.filter(id=budget.id).exists())

    def test_list_only_returns_own_budgets(self):
        other_user = User.objects.create_user(
            username="other_budget_user", password="pw12345678"
        )
        Budget.objects.create(
            user=other_user, category="Travel", monthly_limit="1000", month=8, year=2026
        )
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="5000", month=8, year=2026
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_cannot_update_another_users_budget(self):
        other_user = User.objects.create_user(
            username="other_budget_user2", password="pw12345678"
        )
        other_budget = Budget.objects.create(
            user=other_user, category="Travel", monthly_limit="1000", month=8, year=2026
        )
        resp = self.client.patch(
            f"{self.url}{other_budget.id}/", {"monthly_limit": "1.00"}
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_another_users_budget(self):
        other_user = User.objects.create_user(
            username="other_budget_user3", password="pw12345678"
        )
        other_budget = Budget.objects.create(
            user=other_user, category="Travel", monthly_limit="1000", month=8, year=2026
        )
        resp = self.client.delete(f"{self.url}{other_budget.id}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Budget.objects.filter(id=other_budget.id).exists())


class BudgetValidationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="budget_validation_user", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/budgets/"

    def test_monthly_limit_must_be_positive(self):
        resp = self.client.post(
            self.url,
            {"category": "Food", "monthly_limit": "0", "month": 8, "year": 2026},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("monthly_limit", resp.data["error"]["details"])

    def test_negative_monthly_limit_rejected(self):
        resp = self.client.post(
            self.url,
            {"category": "Food", "monthly_limit": "-100", "month": 8, "year": 2026},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_category_rejected(self):
        resp = self.client.post(
            self.url,
            {"category": "NotACategory", "monthly_limit": "1000", "month": 8, "year": 2026},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_budget_for_same_category_month_year_rejected(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="5000", month=8, year=2026
        )
        resp = self.client.post(
            self.url,
            {"category": "Food", "monthly_limit": "6000", "month": 8, "year": 2026},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category", resp.data["error"]["details"])

    def test_same_category_different_month_is_allowed(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="5000", month=8, year=2026
        )
        resp = self.client.post(
            self.url,
            {"category": "Food", "monthly_limit": "5000", "month": 9, "year": 2026},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_updating_budget_without_changing_category_month_year_is_allowed(self):
        budget = Budget.objects.create(
            user=self.user, category="Food", monthly_limit="5000", month=8, year=2026
        )
        resp = self.client.patch(
            f"{self.url}{budget.id}/", {"monthly_limit": "7000"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_different_users_can_have_budget_for_same_category_month(self):
        other_user = User.objects.create_user(
            username="budget_validation_user2", password="pw12345678"
        )
        Budget.objects.create(
            user=other_user, category="Food", monthly_limit="5000", month=8, year=2026
        )
        resp = self.client.post(
            self.url,
            {"category": "Food", "monthly_limit": "5000", "month": 8, "year": 2026},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


class BudgetSummaryTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="budget_summary_user", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/budgets/summary/"

    def _create_expense(self, amount, category="Food", date=None):
        Expense.objects.create(
            user=self.user,
            title="test expense",
            amount=amount,
            category=category,
            date=date or datetime.date(2026, 8, 10),
        )

    def test_summary_requires_authentication(self):
        anon_client = APIClient()
        resp = anon_client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_summary_under_budget_has_no_alert(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="1000", month=8, year=2026
        )
        self._create_expense("300.00")

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        row = resp.data[0]
        self.assertEqual(row["usage_percentage"], "30.00")
        self.assertFalse(row["is_overspent"])
        self.assertIsNone(row["alert_level"])

    def test_summary_warning_threshold_at_80_percent(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="1000", month=8, year=2026
        )
        self._create_expense("850.00")

        resp = self.client.get(self.url)
        row = resp.data[0]
        self.assertEqual(row["alert_level"], "warning")

    def test_summary_high_warning_threshold_at_90_percent(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="1000", month=8, year=2026
        )
        self._create_expense("950.00")

        resp = self.client.get(self.url)
        row = resp.data[0]
        self.assertEqual(row["alert_level"], "high_warning")

    def test_summary_exceeded_budget(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="1000", month=8, year=2026
        )
        self._create_expense("1200.00")

        resp = self.client.get(self.url)
        row = resp.data[0]
        self.assertTrue(row["is_overspent"])
        self.assertEqual(row["alert_level"], "budget_exceeded")
        self.assertEqual(str(row["overspent_amount"]), "200.00")
        self.assertEqual(str(row["remaining_budget"]), "0.00")

    def test_summary_ignores_expenses_outside_budget_month(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="1000", month=8, year=2026
        )
        self._create_expense("500.00", date=datetime.date(2026, 7, 15))

        resp = self.client.get(self.url)
        row = resp.data[0]
        self.assertEqual(str(row["total_expense"]), "0.00")

    def test_summary_only_includes_own_budgets(self):
        other_user = User.objects.create_user(
            username="budget_summary_user2", password="pw12345678"
        )
        Budget.objects.create(
            user=other_user, category="Travel", monthly_limit="1000", month=8, year=2026
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.data, [])


# ==========================================================
# Savings Goal
# ==========================================================

class SavingsGoalCRUDTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="goal_owner", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/budgets/savings-goals/"
        self.future_date = (
            timezone.localdate() + datetime.timedelta(days=90)
        ).isoformat()

    def test_list_requires_authentication(self):
        anon_client = APIClient()
        resp = anon_client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_goal(self):
        resp = self.client.post(
            self.url,
            {
                "goal_name": "New Laptop",
                "target_amount": "80000",
                "target_date": self.future_date,
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(SavingsGoal.objects.count(), 1)

    def test_create_goal_generates_notification(self):
        self.client.post(
            self.url,
            {
                "goal_name": "New Laptop",
                "target_amount": "80000",
                "target_date": self.future_date,
            },
        )
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                notification_type=Notification.NotificationType.SAVINGS_GOAL,
            ).exists()
        )

    def test_target_amount_must_be_positive(self):
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Bad Goal",
                "target_amount": "0",
                "target_date": self.future_date,
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_target_date_in_past_rejected_on_create(self):
        past_date = (
            timezone.localdate() - datetime.timedelta(days=1)
        ).isoformat()
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Bad Goal",
                "target_amount": "1000",
                "target_date": past_date,
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("target_date", resp.data["error"]["details"])

    def test_current_amount_cannot_exceed_target_amount(self):
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Bad Goal",
                "target_amount": "1000",
                "current_amount": "2000",
                "target_date": self.future_date,
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_excludes_archived_goals(self):
        SavingsGoal.objects.create(
            user=self.user,
            goal_name="Archived Goal",
            target_amount=Decimal("1000"),
            current_amount=Decimal("1000"),
            target_date=timezone.localdate(),
            is_archived=True,
        )
        SavingsGoal.objects.create(
            user=self.user,
            goal_name="Active Goal",
            target_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["goal_name"], "Active Goal")

    def test_goal_marked_completed_when_current_reaches_target(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Almost There",
            target_amount=Decimal("1000"),
            current_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        self.assertTrue(goal.is_completed)

    def test_cannot_access_another_users_goal(self):
        other_user = User.objects.create_user(
            username="other_goal_user", password="pw12345678"
        )
        other_goal = SavingsGoal.objects.create(
            user=other_user,
            goal_name="Not Yours",
            target_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        resp = self.client.get(f"{self.url}{other_goal.id}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class SavingsGoalTypeAndCategoryTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="type_category_user", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/budgets/savings-goals/"
        self.future_date = (
            timezone.localdate() + datetime.timedelta(days=90)
        ).isoformat()

    def test_existing_goal_receives_migration_default_type_and_category(self):
        # Simulates a pre-existing row created without goal_type/goal_category
        # explicitly set, i.e. relying on the model/migration defaults.
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Pre-existing Goal",
            target_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        self.assertEqual(goal.goal_type, SavingsGoal.GoalType.PURCHASE)
        self.assertEqual(goal.goal_category, SavingsGoal.GoalCategory.OTHER)

    def test_create_goal_with_valid_goal_type(self):
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Trip to Goa",
                "target_amount": "50000",
                "target_date": self.future_date,
                "goal_type": "TRAVEL",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(resp.data["goal_type"], "TRAVEL")

    def test_create_goal_with_valid_goal_category(self):
        resp = self.client.post(
            self.url,
            {
                "goal_name": "New Headphones",
                "target_amount": "5000",
                "target_date": self.future_date,
                "goal_category": "ELECTRONICS",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(resp.data["goal_category"], "ELECTRONICS")

    def test_create_goal_without_type_or_category_uses_defaults(self):
        resp = self.client.post(
            self.url,
            {
                "goal_name": "New Laptop",
                "target_amount": "80000",
                "target_date": self.future_date,
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(resp.data["goal_type"], "PURCHASE")
        self.assertEqual(resp.data["goal_category"], "OTHER")

    def test_goal_type_and_category_returned_on_retrieve(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Emergency Fund",
            target_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
            goal_type=SavingsGoal.GoalType.FUND,
            goal_category=SavingsGoal.GoalCategory.EMERGENCY_SAFETY,
        )
        resp = self.client.get(f"{self.url}{goal.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["goal_type"], "FUND")
        self.assertEqual(resp.data["goal_category"], "EMERGENCY_SAFETY")

    def test_update_goal_type_and_category(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Flexible Goal",
            target_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        resp = self.client.patch(
            f"{self.url}{goal.id}/",
            {"goal_type": "EDUCATION", "goal_category": "CELEBRATIONS_GIFTS"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        goal.refresh_from_db()
        self.assertEqual(goal.goal_type, SavingsGoal.GoalType.EDUCATION)
        self.assertEqual(
            goal.goal_category, SavingsGoal.GoalCategory.CELEBRATIONS_GIFTS
        )

    def test_invalid_goal_type_rejected(self):
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Bad Type Goal",
                "target_amount": "1000",
                "target_date": self.future_date,
                "goal_type": "NOT_A_TYPE",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_goal_category_rejected(self):
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Bad Category Goal",
                "target_amount": "1000",
                "target_date": self.future_date,
                "goal_category": "NOT_A_CATEGORY",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_all_final_goal_category_values_accepted(self):
        valid_categories = [
            "ELECTRONICS",
            "SHOPPING",
            "SPORTS_FITNESS",
            "HEALTH_MEDICAL",
            "EMERGENCY_SAFETY",
            "CELEBRATIONS_GIFTS",
            "HOME_LIFESTYLE",
            "OTHER",
        ]
        for category in valid_categories:
            resp = self.client.post(
                self.url,
                {
                    "goal_name": f"Goal for {category}",
                    "target_amount": "1000",
                    "target_date": self.future_date,
                    "goal_category": category,
                },
            )
            self.assertEqual(
                resp.status_code, status.HTTP_201_CREATED, resp.data
            )
            self.assertEqual(resp.data["goal_category"], category)

    def test_removed_travel_category_value_rejected(self):
        # TRAVEL was removed from goal_category (it now lives on goal_type
        # only, to avoid asking the same question twice).
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Old Travel Category Goal",
                "target_amount": "1000",
                "target_date": self.future_date,
                "goal_category": "TRAVEL",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_removed_education_category_value_rejected(self):
        # EDUCATION was removed from goal_category for the same reason.
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Old Education Category Goal",
                "target_amount": "1000",
                "target_date": self.future_date,
                "goal_category": "EDUCATION",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_removed_emergency_category_value_rejected(self):
        # EMERGENCY was replaced by EMERGENCY_SAFETY.
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Old Emergency Category Goal",
                "target_amount": "1000",
                "target_date": self.future_date,
                "goal_category": "EMERGENCY",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_goal_type_travel_and_education_remain_valid(self):
        # goal_type still has TRAVEL and EDUCATION — only goal_category
        # dropped them. Confirms the two fields were not conflated.
        resp = self.client.post(
            self.url,
            {
                "goal_name": "Japan Trip",
                "target_amount": "1000",
                "target_date": self.future_date,
                "goal_type": "TRAVEL",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(resp.data["goal_type"], "TRAVEL")

        resp = self.client.post(
            self.url,
            {
                "goal_name": "Online Course",
                "target_amount": "1000",
                "target_date": self.future_date,
                "goal_type": "EDUCATION",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(resp.data["goal_type"], "EDUCATION")


class SavingsGoalProgressTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="progress_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_progress_percentage_computed_correctly(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Half There",
            target_amount=Decimal("1000"),
            current_amount=Decimal("500"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        resp = self.client.get(f"/api/v1/budgets/savings-goals/{goal.id}/")
        self.assertEqual(resp.data["progress_percentage"], Decimal("50.00"))
        self.assertEqual(resp.data["remaining_amount"], Decimal("500.00"))

    def test_progress_percentage_zero_when_target_is_zero_amount_edge(self):
        # target_amount must be > 0 per validation, but model-level access
        # (e.g. admin-created data) should not raise a ZeroDivisionError.
        goal = SavingsGoal(
            user=self.user,
            goal_name="Edge Case",
            target_amount=Decimal("0"),
            current_amount=Decimal("0"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        goal.save()
        from .serializers import SavingsGoalSerializer

        serializer = SavingsGoalSerializer(goal)
        self.assertEqual(serializer.data["progress_percentage"], 0)


class SavingsGoalCompletePurchaseTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="purchase_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_complete_purchase_requires_completed_goal(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Incomplete Goal",
            target_amount=Decimal("1000"),
            current_amount=Decimal("200"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-purchase/"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_complete_purchase_archives_and_marks_purchased(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Ready Goal",
            target_amount=Decimal("1000"),
            current_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-purchase/",
            {"purchase_note": "Bought it!"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        goal.refresh_from_db()
        self.assertTrue(goal.is_purchased)
        self.assertTrue(goal.is_archived)
        self.assertEqual(goal.purchase_note, "Bought it!")

    def test_complete_purchase_generates_achievement_notification(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Ready Goal",
            target_amount=Decimal("1000"),
            current_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-purchase/"
        )
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                notification_type=Notification.NotificationType.ACHIEVEMENT,
            ).exists()
        )

    def test_cannot_complete_purchase_twice(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Ready Goal",
            target_amount=Decimal("1000"),
            current_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        self.client.post(f"/api/v1/budgets/savings-goals/{goal.id}/complete-purchase/")
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-purchase/"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_achievements_endpoint_lists_archived_goals(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Ready Goal",
            target_amount=Decimal("1000"),
            current_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        self.client.post(f"/api/v1/budgets/savings-goals/{goal.id}/complete-purchase/")

        resp = self.client.get("/api/v1/budgets/savings-goals/achievements/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]["goal_name"], "Ready Goal")

    def test_achievements_endpoint_excludes_other_users_goals(self):
        other_user = User.objects.create_user(
            username="purchase_user2", password="pw12345678"
        )
        SavingsGoal.objects.create(
            user=other_user,
            goal_name="Other Person Goal",
            target_amount=Decimal("1000"),
            current_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
            is_archived=True,
        )
        resp = self.client.get("/api/v1/budgets/savings-goals/achievements/")
        self.assertEqual(resp.data, [])


class SavingsGoalCompleteGoalTests(TestCase):
    """
    `complete-goal` is the generic (non-purchase) counterpart to
    `complete-purchase`, for goal_type in {TRAVEL, FUND, EDUCATION,
    GENERAL, OTHER}.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="complete_goal_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _ready_goal(self, goal_type):
        return SavingsGoal.objects.create(
            user=self.user,
            goal_name=f"{goal_type} Goal",
            goal_type=goal_type,
            target_amount=Decimal("1000"),
            current_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )

    def test_fund_goal_complete_goal_succeeds(self):
        goal = self._ready_goal(SavingsGoal.GoalType.FUND)
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        goal.refresh_from_db()
        self.assertTrue(goal.is_completed)
        self.assertTrue(goal.is_archived)
        self.assertFalse(goal.is_purchased)

    def test_travel_goal_complete_goal_succeeds(self):
        goal = self._ready_goal(SavingsGoal.GoalType.TRAVEL)
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        goal.refresh_from_db()
        self.assertTrue(goal.is_archived)
        self.assertFalse(goal.is_purchased)

    def test_education_goal_complete_goal_succeeds(self):
        goal = self._ready_goal(SavingsGoal.GoalType.EDUCATION)
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        goal.refresh_from_db()
        self.assertTrue(goal.is_archived)
        self.assertFalse(goal.is_purchased)

    def test_general_goal_complete_goal_succeeds(self):
        goal = self._ready_goal(SavingsGoal.GoalType.GENERAL)
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        goal.refresh_from_db()
        self.assertTrue(goal.is_archived)
        self.assertFalse(goal.is_purchased)

    def test_other_goal_complete_goal_succeeds(self):
        goal = self._ready_goal(SavingsGoal.GoalType.OTHER)
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        goal.refresh_from_db()
        self.assertTrue(goal.is_archived)
        self.assertFalse(goal.is_purchased)

    def test_complete_goal_stores_completion_date_and_note(self):
        goal = self._ready_goal(SavingsGoal.GoalType.FUND)
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/",
            {"completion_note": "Emergency fund fully stocked."},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        goal.refresh_from_db()
        self.assertIsNotNone(goal.purchase_date)
        self.assertEqual(goal.purchase_note, "Emergency fund fully stocked.")

    def test_incomplete_non_purchase_goal_rejected(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Not There Yet",
            goal_type=SavingsGoal.GoalType.FUND,
            target_amount=Decimal("1000"),
            current_amount=Decimal("200"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        goal.refresh_from_db()
        self.assertFalse(goal.is_archived)

    def test_purchase_goal_rejected_by_complete_goal(self):
        goal = self._ready_goal(SavingsGoal.GoalType.PURCHASE)
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        goal.refresh_from_db()
        self.assertFalse(goal.is_archived)
        self.assertFalse(goal.is_purchased)

    def test_already_archived_goal_rejected_by_complete_goal(self):
        goal = self._ready_goal(SavingsGoal.GoalType.FUND)
        self.client.post(f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/")
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_already_purchased_goal_rejected_by_complete_goal(self):
        # Simulate a Purchase-flow-completed goal that later had its
        # goal_type changed, or any state where is_purchased is already
        # True - complete-goal must never touch it.
        goal = self._ready_goal(SavingsGoal.GoalType.FUND)
        goal.is_purchased = True
        goal.save(update_fields=["is_purchased"])
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        goal.refresh_from_db()
        self.assertFalse(goal.is_archived)

    def test_complete_goal_does_not_send_purchase_completed_notification(self):
        goal = self._ready_goal(SavingsGoal.GoalType.FUND)
        self.client.post(f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/")
        self.assertFalse(
            Notification.objects.filter(
                user=self.user, title="Purchase Completed"
            ).exists()
        )
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, title="Savings Goal Completed"
            ).exists()
        )

    def test_complete_purchase_still_sends_purchase_completed_notification(self):
        goal = self._ready_goal(SavingsGoal.GoalType.PURCHASE)
        self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-purchase/"
        )
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, title="Purchase Completed"
            ).exists()
        )

    def test_non_purchase_completed_goal_appears_in_achievements(self):
        goal = self._ready_goal(SavingsGoal.GoalType.TRAVEL)
        self.client.post(f"/api/v1/budgets/savings-goals/{goal.id}/complete-goal/")

        resp = self.client.get("/api/v1/budgets/savings-goals/achievements/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in resp.data]
        self.assertIn(goal.id, ids)

    def test_automatic_completion_notification_uses_generic_wording(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Auto Complete Goal",
            goal_type=SavingsGoal.GoalType.FUND,
            target_amount=Decimal("1000"),
            current_amount=Decimal("0"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        self.client.post(
            "/api/v1/budgets/savings-transactions/",
            {
                "goal": goal.id,
                "transaction_amount": "1000",
                "transaction_type": "deposit",
            },
        )
        notification = Notification.objects.get(
            user=self.user, title="Goal Completed"
        )
        self.assertNotIn("purchased", notification.message.lower())

    def test_purchase_flow_still_functions_end_to_end(self):
        goal = self._ready_goal(SavingsGoal.GoalType.PURCHASE)
        resp = self.client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-purchase/",
            {"purchase_note": "Bought the laptop."},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        goal.refresh_from_db()
        self.assertTrue(goal.is_purchased)
        self.assertTrue(goal.is_archived)


# ==========================================================
# Savings Transaction (Deposits / Withdrawals)
# ==========================================================

class SavingsTransactionTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="txn_user", password="pw12345678"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/budgets/savings-transactions/"
        self.goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Vacation",
            target_amount=Decimal("10000"),
            target_date=timezone.localdate() + datetime.timedelta(days=60),
        )

    def test_deposit_increases_current_amount(self):
        resp = self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "2000",
                "transaction_type": "deposit",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.goal.refresh_from_db()
        self.assertEqual(str(self.goal.current_amount), "2000.00")

    def test_deposit_generates_notification(self):
        self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "2000",
                "transaction_type": "deposit",
            },
        )
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, title="Deposit Added"
            ).exists()
        )

    def test_withdrawal_decreases_current_amount(self):
        SavingsTransaction.objects.create(
            goal=self.goal, transaction_amount=Decimal("5000"), transaction_type="deposit"
        )
        self.goal.current_amount = 5000
        self.goal.save()

        resp = self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "1000",
                "transaction_type": "withdrawal",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.goal.refresh_from_db()
        self.assertEqual(str(self.goal.current_amount), "4000.00")

    def test_withdrawal_cannot_exceed_current_amount(self):
        resp = self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "500",
                "transaction_type": "withdrawal",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.goal.refresh_from_db()
        self.assertEqual(str(self.goal.current_amount), "0.00")

    def test_transaction_amount_must_be_positive(self):
        resp = self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "0",
                "transaction_type": "deposit",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_add_transaction_to_another_users_goal(self):
        other_user = User.objects.create_user(
            username="txn_user2", password="pw12345678"
        )
        other_goal = SavingsGoal.objects.create(
            user=other_user,
            goal_name="Not Yours",
            target_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        resp = self.client.post(
            self.url,
            {
                "goal": other_goal.id,
                "transaction_amount": "100",
                "transaction_type": "deposit",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_deposit_below_remaining_is_accepted(self):
        SavingsTransaction.objects.create(
            goal=self.goal, transaction_amount=Decimal("4500"), transaction_type="deposit"
        )
        self.goal.current_amount = Decimal("4500")
        self.goal.save()

        resp = self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "500",
                "transaction_type": "deposit",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.goal.refresh_from_db()
        self.assertEqual(str(self.goal.current_amount), "5000.00")

    def test_deposit_exactly_equal_to_remaining_is_accepted(self):
        SavingsTransaction.objects.create(
            goal=self.goal, transaction_amount=Decimal("4500"), transaction_type="deposit"
        )
        self.goal.current_amount = Decimal("4500")
        self.goal.save()

        resp = self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "5500",
                "transaction_type": "deposit",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.goal.refresh_from_db()
        self.assertEqual(str(self.goal.current_amount), "10000.00")
        self.assertTrue(self.goal.is_completed)

    def test_deposit_slightly_above_remaining_is_rejected(self):
        SavingsTransaction.objects.create(
            goal=self.goal, transaction_amount=Decimal("4500"), transaction_type="deposit"
        )
        self.goal.current_amount = Decimal("4500")
        self.goal.save()

        resp = self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "5500.01",
                "transaction_type": "deposit",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST, resp.data)
        self.goal.refresh_from_db()
        self.assertEqual(str(self.goal.current_amount), "4500.00")

    def test_deposit_substantially_above_remaining_is_rejected(self):
        SavingsTransaction.objects.create(
            goal=self.goal, transaction_amount=Decimal("4500"), transaction_type="deposit"
        )
        self.goal.current_amount = Decimal("4500")
        self.goal.save()

        resp = self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "20000",
                "transaction_type": "deposit",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST, resp.data)
        self.goal.refresh_from_db()
        self.assertEqual(str(self.goal.current_amount), "4500.00")

    def test_deposit_reaching_target_marks_goal_completed_and_notifies(self):
        resp = self.client.post(
            self.url,
            {
                "goal": self.goal.id,
                "transaction_amount": "10000",
                "transaction_type": "deposit",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.goal.refresh_from_db()
        self.assertTrue(self.goal.is_completed)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, title="Goal Completed"
            ).exists()
        )

    def test_list_only_shows_own_goal_transactions(self):
        other_user = User.objects.create_user(
            username="txn_user3", password="pw12345678"
        )
        other_goal = SavingsGoal.objects.create(
            user=other_user,
            goal_name="Not Yours",
            target_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )
        SavingsTransaction.objects.create(
            goal=other_goal, transaction_amount=Decimal("100"), transaction_type="deposit"
        )
        SavingsTransaction.objects.create(
            goal=self.goal, transaction_amount=Decimal("200"), transaction_type="deposit"
        )

        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)


class SavingsTransactionModelLevelTests(TestCase):
    """Model-level guard on SavingsTransaction.save() (used outside the API too)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="model_txn_user", password="pw12345678"
        )
        self.goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Model Level Goal",
            target_amount=Decimal("1000"),
            target_date=timezone.localdate() + datetime.timedelta(days=30),
        )

    def test_zero_amount_raises_value_error(self):
        txn = SavingsTransaction(
            goal=self.goal, transaction_amount=Decimal("0"), transaction_type="deposit"
        )
        with self.assertRaises(ValueError):
            txn.save()

    def test_negative_amount_raises_value_error(self):
        txn = SavingsTransaction(
            goal=self.goal, transaction_amount=Decimal("-50"), transaction_type="deposit"
        )
        with self.assertRaises(ValueError):
            txn.save()
