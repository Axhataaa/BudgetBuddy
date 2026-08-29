from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from budgets.models import Budget, SavingsGoal, SavingsTransaction
from budgets.notifications import check_and_notify_budget_alerts
from expenses.models import Expense
from incomes.models import Income

from .models import Notification


class EntityNotificationSyncTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="tester", password="pw12345", email="tester@example.com"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    # ---------------------------------------------------------------
    # Expense
    # ---------------------------------------------------------------

    def test_expense_create_generates_one_synced_notification(self):
        resp = self.client.post(
            "/api/v1/expenses/",
            {
                "title": "Movie",
                "amount": "500.00",
                "category": "Entertainment",
                "payment_method": "UPI",
                "date": "2026-08-01",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        expense_id = resp.data["id"]

        notif = Notification.objects.get(dedup_key=f"expense:{expense_id}:added")
        self.assertEqual(notif.expense_id, expense_id)
        self.assertIn("Entertainment", notif.message)

    def test_expense_update_syncs_same_notification_no_duplicate(self):
        resp = self.client.post(
            "/api/v1/expenses/",
            {
                "title": "Movie",
                "amount": "500.00",
                "category": "Entertainment",
                "payment_method": "UPI",
                "date": "2026-08-01",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        expense_id = resp.data["id"]

        self.assertEqual(
            Notification.objects.filter(dedup_key=f"expense:{expense_id}:added").count(),
            1,
        )
        notif_before = Notification.objects.get(dedup_key=f"expense:{expense_id}:added")
        self.assertIn("Entertainment", notif_before.message)

        # Edit multiple times.
        for new_amount in ("1200.00", "1500.00"):
            resp = self.client.patch(
                f"/api/v1/expenses/{expense_id}/",
                {"amount": new_amount},
                format="json",
            )
            self.assertEqual(resp.status_code, 200, resp.data)

        self.assertEqual(
            Notification.objects.filter(dedup_key=f"expense:{expense_id}:added").count(),
            1,
            "editing an expense repeatedly must not create duplicate notifications",
        )
        notif_after = Notification.objects.get(dedup_key=f"expense:{expense_id}:added")
        self.assertEqual(notif_after.id, notif_before.id)
        self.assertIn("Entertainment", notif_after.message)
        # Entity-state messages no longer embed a monetary amount, so
        # editing the amount must not introduce a hardcoded currency
        # symbol into the message.
        self.assertNotIn("₹", notif_after.message)

    def test_expense_delete_removes_notification_but_not_reverse(self):
        resp = self.client.post(
            "/api/v1/expenses/",
            {
                "title": "Movie",
                "amount": "500.00",
                "category": "Entertainment",
                "payment_method": "UPI",
                "date": "2026-08-01",
            },
            format="json",
        )
        expense_id = resp.data["id"]
        notif = Notification.objects.get(dedup_key=f"expense:{expense_id}:added")

        # Deleting the notification must never delete the expense.
        del_resp = self.client.delete(f"/api/v1/notifications/{notif.id}/")
        self.assertIn(del_resp.status_code, (200, 204))
        self.assertTrue(Expense.objects.filter(id=expense_id).exists())

        # Deleting the expense (create a second one to test entity-delete
        # direction independently) must remove its own notification.
        resp2 = self.client.post(
            "/api/v1/expenses/",
            {
                "title": "Snacks",
                "amount": "100.00",
                "category": "Food",
                "payment_method": "Cash",
                "date": "2026-08-02",
            },
            format="json",
        )
        expense2_id = resp2.data["id"]
        self.assertTrue(
            Notification.objects.filter(dedup_key=f"expense:{expense2_id}:added").exists()
        )
        del_resp2 = self.client.delete(f"/api/v1/expenses/{expense2_id}/")
        self.assertIn(del_resp2.status_code, (200, 204))
        self.assertFalse(
            Notification.objects.filter(dedup_key=f"expense:{expense2_id}:added").exists(),
            "deleting the expense must cascade-delete its linked notification",
        )

    # ---------------------------------------------------------------
    # Income
    # ---------------------------------------------------------------

    def test_income_create_update_delete_sync(self):
        resp = self.client.post(
            "/api/v1/incomes/",
            {
                "source": "Freelance",
                "amount": "2000.00",
                "date": "2026-08-01",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        income_id = resp.data["id"]

        notif = Notification.objects.get(dedup_key=f"income:{income_id}:added")
        self.assertEqual(notif.income_id, income_id)
        self.assertIn("Freelance", notif.message)

        resp = self.client.patch(
            f"/api/v1/incomes/{income_id}/", {"amount": "3000.00"}, format="json"
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(
            Notification.objects.filter(dedup_key=f"income:{income_id}:added").count(), 1
        )
        notif.refresh_from_db()
        self.assertIn("Freelance", notif.message)
        self.assertNotIn("₹", notif.message)

        del_resp = self.client.delete(f"/api/v1/incomes/{income_id}/")
        self.assertIn(del_resp.status_code, (200, 204))
        self.assertFalse(
            Notification.objects.filter(dedup_key=f"income:{income_id}:added").exists()
        )
        # Deleting the notification (before entity delete) must never
        # delete the income - tested separately for clarity.
        resp2 = self.client.post(
            "/api/v1/incomes/",
            {"source": "Salary", "amount": "5000.00", "date": "2026-08-03"},
            format="json",
        )
        income2_id = resp2.data["id"]
        notif2 = Notification.objects.get(dedup_key=f"income:{income2_id}:added")
        self.client.delete(f"/api/v1/notifications/{notif2.id}/")
        self.assertTrue(Income.objects.filter(id=income2_id).exists())

    # ---------------------------------------------------------------
    # Budget
    # ---------------------------------------------------------------

    def test_budget_created_and_updated_stay_separate_and_deduped(self):
        resp = self.client.post(
            "/api/v1/budgets/",
            {
                "category": "Food",
                "monthly_limit": "5000.00",
                "month": 8,
                "year": 2026,
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        budget_id = resp.data["id"]

        created_notif = Notification.objects.get(dedup_key=f"budget:{budget_id}:created")
        self.assertEqual(created_notif.budget_id, budget_id)
        self.assertFalse(
            Notification.objects.filter(dedup_key=f"budget:{budget_id}:updated").exists()
        )

        # Repeated edits.
        for new_limit in ("6000.00", "7000.00", "8000.00"):
            resp = self.client.patch(
                f"/api/v1/budgets/{budget_id}/",
                {"monthly_limit": new_limit},
                format="json",
            )
            self.assertEqual(resp.status_code, 200, resp.data)

        updated_qs = Notification.objects.filter(dedup_key=f"budget:{budget_id}:updated")
        self.assertEqual(
            updated_qs.count(), 1, "repeated budget edits must not duplicate Budget Updated"
        )
        updated_notif = updated_qs.get()
        self.assertIn("Food", updated_notif.message)
        self.assertIn("updated", updated_notif.message.lower())
        self.assertEqual(updated_notif.budget_id, budget_id)

        # The original "Budget Created" notification must be untouched.
        created_notif.refresh_from_db()
        self.assertEqual(created_notif.title, "Budget Created")
        self.assertIn("Food", created_notif.message)
        self.assertNotEqual(created_notif.id, updated_notif.id)

    def test_budget_delete_removes_entity_state_but_not_threshold_alerts(self):
        resp = self.client.post(
            "/api/v1/budgets/",
            {"category": "Food", "monthly_limit": "1000.00", "month": 8, "year": 2026},
            format="json",
        )
        budget_id = resp.data["id"]

        # Trigger a historical threshold alert (80%+, but under 90%) via
        # an expense.
        Expense.objects.create(
            user=self.user,
            title="Groceries",
            amount=Decimal("850.00"),
            category="Food",
            date=date(2026, 8, 5),
        )
        check_and_notify_budget_alerts(self.user, "Food", 8, 2026)

        alert = Notification.objects.get(dedup_key=f"budget_alert:{budget_id}:80")
        self.assertIsNone(alert.budget_id, "historical alerts must not be entity-linked")

        del_resp = self.client.delete(f"/api/v1/budgets/{budget_id}/")
        self.assertIn(del_resp.status_code, (200, 204))

        self.assertFalse(
            Notification.objects.filter(dedup_key=f"budget:{budget_id}:created").exists()
        )
        # Historical alert must survive the budget's deletion.
        self.assertTrue(
            Notification.objects.filter(dedup_key=f"budget_alert:{budget_id}:80").exists(),
            "historical budget alerts must not be deleted when the budget is deleted",
        )

    def test_budget_threshold_alerts_unaffected_by_this_change(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit=Decimal("1000.00"), month=8, year=2026
        )
        Expense.objects.create(
            user=self.user,
            title="Groceries",
            amount=Decimal("1100.00"),
            category="Food",
            date=date(2026, 8, 5),
        )
        check_and_notify_budget_alerts(self.user, "Food", 8, 2026)

        exceeded = Notification.objects.filter(notification_type="budget_exceeded")
        self.assertEqual(exceeded.count(), 1)
        self.assertIsNone(exceeded.first().budget)

        # Calling it again (e.g. another expense in the same category)
        # must not duplicate the exceeded alert - unchanged dedup
        # behavior from before this feature.
        check_and_notify_budget_alerts(self.user, "Food", 8, 2026)
        self.assertEqual(
            Notification.objects.filter(notification_type="budget_exceeded").count(), 1
        )

    # ---------------------------------------------------------------
    # Savings Goal
    # ---------------------------------------------------------------

    def test_savings_goal_create_update_delete_sync(self):
        resp = self.client.post(
            "/api/v1/budgets/savings-goals/",
            {
                "goal_name": "Laptop",
                "target_amount": "50000.00",
                "target_date": "2027-01-01",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        goal_id = resp.data["id"]

        created = Notification.objects.get(dedup_key=f"savings_goal:{goal_id}:created")
        self.assertEqual(created.savings_goal_id, goal_id)

        resp = self.client.patch(
            f"/api/v1/budgets/savings-goals/{goal_id}/",
            {"goal_name": "Gaming Laptop"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        resp = self.client.patch(
            f"/api/v1/budgets/savings-goals/{goal_id}/",
            {"goal_name": "Gaming Laptop Pro"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)

        updated_qs = Notification.objects.filter(dedup_key=f"savings_goal:{goal_id}:updated")
        self.assertEqual(updated_qs.count(), 1)
        self.assertIn("Gaming Laptop Pro", updated_qs.get().message)

        # Created notification must remain distinct/untouched.
        created.refresh_from_db()
        self.assertEqual(created.title, "Goal Created")

        del_resp = self.client.delete(f"/api/v1/budgets/savings-goals/{goal_id}/")
        self.assertIn(del_resp.status_code, (200, 204))
        self.assertFalse(
            Notification.objects.filter(dedup_key=f"savings_goal:{goal_id}:created").exists()
        )
        self.assertFalse(
            Notification.objects.filter(dedup_key=f"savings_goal:{goal_id}:updated").exists()
        )

    def test_savings_deposit_withdrawal_completion_remain_historical(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Bike",
            target_amount=Decimal("1000.00"),
            current_amount=Decimal("0.00"),
            target_date=date(2027, 1, 1),
        )

        resp = self.client.post(
            "/api/v1/budgets/savings-transactions/",
            {"goal": goal.id, "transaction_amount": "1000.00", "transaction_type": "deposit"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)

        deposit_notif = Notification.objects.get(
            dedup_key__startswith=f"savings_goal:{goal.id}:deposit:"
        )
        completed_notif = Notification.objects.get(dedup_key=f"savings_goal:{goal.id}:completed")
        self.assertIsNone(deposit_notif.savings_goal)
        self.assertIsNone(completed_notif.savings_goal)

        # Editing the goal afterward must not alter these historical
        # notifications.
        self.client.patch(
            f"/api/v1/budgets/savings-goals/{goal.id}/", {"goal_name": "New Bike"}, format="json"
        )
        deposit_notif.refresh_from_db()
        completed_notif.refresh_from_db()
        self.assertIn("Bike", deposit_notif.message)
        self.assertNotIn("New Bike", deposit_notif.message)
        self.assertNotIn("New Bike", completed_notif.message)

        # Deleting the goal must not remove these historical rows
        # (they were never entity-linked).
        self.client.delete(f"/api/v1/budgets/savings-goals/{goal.id}/")
        self.assertTrue(Notification.objects.filter(id=deposit_notif.id).exists())
        self.assertTrue(Notification.objects.filter(id=completed_notif.id).exists())

    # ---------------------------------------------------------------
    # Notification deletion never touches entities (general guard)
    # ---------------------------------------------------------------

    def test_clear_all_notifications_never_deletes_entities(self):
        self.client.post(
            "/api/v1/expenses/",
            {
                "title": "Movie",
                "amount": "500.00",
                "category": "Entertainment",
                "payment_method": "UPI",
                "date": "2026-08-01",
            },
            format="json",
        )
        self.client.post(
            "/api/v1/incomes/", {"source": "Salary", "amount": "1000.00", "date": "2026-08-01"},
            format="json",
        )
        self.assertTrue(Notification.objects.filter(user=self.user).exists())

        resp = self.client.delete("/api/v1/notifications/clear-all/")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(Notification.objects.filter(user=self.user).exists())

        self.assertTrue(Expense.objects.filter(user=self.user).exists())
        self.assertTrue(Income.objects.filter(user=self.user).exists())


class EntitySyncEmailBehaviorTests(TestCase):
    """Confirms editing an entity never sends a new email just because
    its in-app notification was updated, and that email eligibility
    rules are otherwise completely unchanged by this feature."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="email_tester", password="pw12345", email="emailtester@example.com"
        )
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_expense_edit_sends_no_email(self):
        from django.core import mail

        resp = self.client.post(
            "/api/v1/expenses/",
            {
                "title": "Movie",
                "amount": "500.00",
                "category": "Entertainment",
                "payment_method": "UPI",
                "date": "2026-08-01",
            },
            format="json",
        )
        expense_id = resp.data["id"]
        outbox_after_create = len(mail.outbox)

        self.client.patch(
            f"/api/v1/expenses/{expense_id}/", {"amount": "999.00"}, format="json"
        )
        self.assertEqual(
            len(mail.outbox), outbox_after_create,
            "editing an expense must never send a new email",
        )

    def test_budget_edit_sends_no_email(self):
        from django.core import mail

        resp = self.client.post(
            "/api/v1/budgets/",
            {"category": "Food", "monthly_limit": "1000.00", "month": 8, "year": 2026},
            format="json",
        )
        budget_id = resp.data["id"]
        outbox_after_create = len(mail.outbox)

        for new_limit in ("2000.00", "3000.00"):
            self.client.patch(
                f"/api/v1/budgets/{budget_id}/", {"monthly_limit": new_limit}, format="json"
            )
        self.assertEqual(
            len(mail.outbox), outbox_after_create,
            "repeated budget edits must never send new emails",
        )


class BudgetAlertThresholdBoundaryTests(TestCase):
    """
    Standardized product-wide budget alert model:

        80%  -> Budget Warning      (in-app + email)
        90%  -> Budget High Warning (in-app + email)
        100% -> Budget Exceeded     (in-app + email)

    Exercises every boundary of check_and_notify_budget_alerts explicitly,
    on both the notification layer (title/type/priority/dedup_key) and the
    email layer (an email is sent for every tier at/above 80%, and never
    below 80%).
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="threshold_tester",
            password="pw12345",
            email="threshold_tester@example.com",
        )
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])

    def _budget(self, limit="1000.00"):
        return Budget.objects.create(
            user=self.user,
            category="Food",
            monthly_limit=Decimal(limit),
            month=8,
            year=2026,
        )

    def _spend(self, amount):
        Expense.objects.create(
            user=self.user,
            title="test expense",
            amount=Decimal(amount),
            category="Food",
            date=date(2026, 8, 10),
        )

    def _check(self, budget):
        from django.core import mail

        outbox_before = len(mail.outbox)
        check_and_notify_budget_alerts(self.user, "Food", 8, 2026)
        emails_sent = len(mail.outbox) - outbox_before
        notification = (
            Notification.objects.filter(user=self.user)
            .order_by("-created_at")
            .first()
        )
        return notification, emails_sent, budget

    def test_below_80_percent_no_alert(self):
        budget = self._budget()
        self._spend("799.00")
        notification, emails_sent, _ = self._check(budget)

        self.assertIsNone(notification)
        self.assertEqual(emails_sent, 0)

    def test_exactly_80_percent_is_warning_with_email(self):
        budget = self._budget()
        self._spend("800.00")
        notification, emails_sent, budget = self._check(budget)

        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, "Budget Warning")
        self.assertEqual(notification.notification_type, Notification.NotificationType.BUDGET_WARNING)
        self.assertEqual(notification.priority, Notification.Priority.MEDIUM)
        self.assertEqual(notification.dedup_key, f"budget_alert:{budget.id}:80")
        self.assertEqual(emails_sent, 1, "80% tier must send exactly one email")

    def test_between_80_and_90_percent_is_warning_with_email(self):
        budget = self._budget()
        self._spend("850.00")
        notification, emails_sent, budget = self._check(budget)

        self.assertEqual(notification.title, "Budget Warning")
        self.assertEqual(notification.dedup_key, f"budget_alert:{budget.id}:80")
        self.assertEqual(emails_sent, 1)

    def test_exactly_90_percent_is_high_warning_with_email(self):
        budget = self._budget()
        self._spend("900.00")
        notification, emails_sent, budget = self._check(budget)

        self.assertEqual(notification.title, "Budget High Warning")
        self.assertEqual(notification.notification_type, Notification.NotificationType.BUDGET_WARNING)
        self.assertEqual(notification.priority, Notification.Priority.HIGH)
        self.assertEqual(notification.dedup_key, f"budget_alert:{budget.id}:90")
        self.assertEqual(emails_sent, 1, "90% tier must send exactly one email")

    def test_between_90_and_100_percent_is_high_warning_with_email(self):
        budget = self._budget()
        self._spend("950.00")
        notification, emails_sent, budget = self._check(budget)

        self.assertEqual(notification.title, "Budget High Warning")
        self.assertEqual(notification.dedup_key, f"budget_alert:{budget.id}:90")
        self.assertEqual(emails_sent, 1)

    def test_exactly_100_percent_is_exceeded_with_email(self):
        budget = self._budget()
        self._spend("1000.00")
        notification, emails_sent, budget = self._check(budget)

        self.assertEqual(notification.title, "Budget Exceeded")
        self.assertEqual(notification.notification_type, Notification.NotificationType.BUDGET_EXCEEDED)
        self.assertEqual(notification.priority, Notification.Priority.HIGH)
        self.assertEqual(notification.dedup_key, f"budget_alert:{budget.id}:100")
        self.assertEqual(emails_sent, 1, "100% tier must send exactly one email")

    def test_above_100_percent_is_still_exceeded_with_email(self):
        budget = self._budget()
        self._spend("1500.00")
        notification, emails_sent, budget = self._check(budget)

        self.assertEqual(notification.title, "Budget Exceeded")
        self.assertEqual(notification.dedup_key, f"budget_alert:{budget.id}:100")
        self.assertEqual(emails_sent, 1)
