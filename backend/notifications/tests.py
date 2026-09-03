from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from types import SimpleNamespace

from budgets.models import Budget, SavingsGoal, SavingsTransaction
from budgets.notifications import check_and_notify_budget_alerts
from expenses.models import Expense
from incomes.models import Income
from notifications.management.commands.send_savings_reminders import (
    is_target_date_reminder_eligible,
)

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


class SavingsReminderEmailTests(TestCase):
    """
    Covers the new Savings Reminder -> email behaviour (Savings Goal
    Updates category, reusing the existing `email_savings_goal_notifications`
    preference and the existing savings-goal email template), plus targeted
    regression checks confirming this change did not disturb the Budget
    Alerts (80/90/100), Goal Completed, Purchase Completed, or routine
    (non-emailing) savings-goal event behaviour.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="reminder_tester",
            password="pw12345",
            email="reminder_tester@example.com",
        )
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])

    def _idle_goal(self, days_old=10, current_amount="0.00", target_amount="1000.00"):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Emergency Fund",
            target_amount=Decimal(target_amount),
            current_amount=Decimal(current_amount),
            target_date=date(2027, 1, 1),
        )
        # created_at is auto_now_add, so backdate via a queryset update to
        # simulate a goal that has been idle for `days_old` days.
        SavingsGoal.objects.filter(pk=goal.pk).update(
            created_at=timezone.now() - timedelta(days=days_old)
        )
        goal.refresh_from_db()
        return goal

    # ---------------------------------------------------------------
    # 1-4: core email gating for the new Savings Reminder rule
    # ---------------------------------------------------------------

    def test_new_reminder_sends_one_email_when_savings_goal_updates_enabled(self):
        from django.core import mail

        self._idle_goal()
        outbox_before = len(mail.outbox)
        call_command("send_savings_reminders", "--days=7")

        self.assertEqual(len(mail.outbox) - outbox_before, 1)
        notification = Notification.objects.get(
            user=self.user, notification_type=Notification.NotificationType.REMINDER
        )
        self.assertEqual(notification.title, "Savings Reminder")

    def test_no_email_when_savings_goal_updates_disabled(self):
        from django.core import mail

        self.user.profile.email_savings_goal_notifications = False
        self.user.profile.save(update_fields=["email_savings_goal_notifications"])

        self._idle_goal()
        outbox_before = len(mail.outbox)
        call_command("send_savings_reminders", "--days=7")

        self.assertEqual(len(mail.outbox) - outbox_before, 0)
        # The in-app notification must still be created even without email.
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.REMINDER
            ).exists()
        )

    def test_no_email_when_master_switch_disabled(self):
        from django.core import mail

        self.user.profile.email_notifications = False
        self.user.profile.save(update_fields=["email_notifications"])

        self._idle_goal()
        outbox_before = len(mail.outbox)
        call_command("send_savings_reminders", "--days=7")

        self.assertEqual(len(mail.outbox) - outbox_before, 0)

    def test_no_email_when_email_unverified(self):
        from django.core import mail

        self.user.profile.email_verified = False
        self.user.profile.save(update_fields=["email_verified"])

        self._idle_goal()
        outbox_before = len(mail.outbox)
        call_command("send_savings_reminders", "--days=7")

        self.assertEqual(len(mail.outbox) - outbox_before, 0)

    # ---------------------------------------------------------------
    # 5: dedup must still prevent a second email
    # ---------------------------------------------------------------

    def test_rerunning_command_same_week_sends_no_second_email(self):
        from django.core import mail

        self._idle_goal()
        call_command("send_savings_reminders", "--days=7")
        outbox_after_first = len(mail.outbox)
        self.assertEqual(outbox_after_first, 1)

        call_command("send_savings_reminders", "--days=7")
        self.assertEqual(
            len(mail.outbox),
            outbox_after_first,
            "re-running the reminder command with the same dedup key "
            "must not send a second email",
        )
        self.assertEqual(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.REMINDER
            ).count(),
            1,
            "re-running must not create a duplicate notification row either",
        )

    # ---------------------------------------------------------------
    # 6: correct preference field, template content
    # ---------------------------------------------------------------

    def test_reminder_email_is_gated_by_savings_goal_field_specifically(self):
        from django.core import mail

        profile = self.user.profile
        profile.budget_alert_notifications = False
        profile.email_monthly_report_notifications = False
        profile.email_important_notifications = False
        profile.email_achievement_notifications = False
        profile.save(
            update_fields=[
                "budget_alert_notifications",
                "email_monthly_report_notifications",
                "email_important_notifications",
                "email_achievement_notifications",
            ]
        )

        self._idle_goal()
        outbox_before = len(mail.outbox)
        call_command("send_savings_reminders", "--days=7")

        self.assertEqual(
            len(mail.outbox) - outbox_before,
            1,
            "reminder email must be gated on email_savings_goal_notifications "
            "alone, independent of the other category preferences",
        )

    def test_reminder_email_does_not_say_completed(self):
        from django.core import mail

        self._idle_goal()
        call_command("send_savings_reminders", "--days=7")

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        html_body = next(
            content for content, mimetype in sent.alternatives if mimetype == "text/html"
        )
        self.assertNotIn("Savings Goal Completed", html_body)
        self.assertIn("Savings Goal Update", html_body)
        self.assertIn("Savings Reminder", sent.subject)

    # ---------------------------------------------------------------
    # 7-8: regression - unrelated email-capable categories are untouched
    # ---------------------------------------------------------------

    def test_budget_alerts_80_90_100_email_behavior_unchanged(self):
        from django.core import mail

        budget = Budget.objects.create(
            user=self.user,
            category="Food",
            monthly_limit=Decimal("1000.00"),
            month=8,
            year=2026,
        )
        Expense.objects.create(
            user=self.user,
            title="groceries",
            amount=Decimal("850.00"),
            category="Food",
            date=date(2026, 8, 10),
        )

        outbox_before = len(mail.outbox)
        check_and_notify_budget_alerts(self.user, "Food", 8, 2026)

        self.assertEqual(len(mail.outbox) - outbox_before, 1)
        notification = Notification.objects.filter(
            user=self.user, notification_type=Notification.NotificationType.BUDGET_WARNING
        ).latest("created_at")
        self.assertEqual(notification.title, "Budget Warning")
        self.assertEqual(notification.dedup_key, f"budget_alert:{budget.id}:80")

    def test_goal_completed_and_purchase_completed_emails_unchanged(self):
        from django.core import mail

        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Bike",
            target_amount=Decimal("100.00"),
            current_amount=Decimal("0.00"),
            target_date=date(2027, 1, 1),
        )
        client = APIClient()
        client.force_authenticate(user=self.user)

        outbox_before = len(mail.outbox)
        resp = client.post(
            "/api/v1/budgets/savings-transactions/",
            {"goal": goal.id, "transaction_amount": "100.00", "transaction_type": "deposit"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        # Deposit Added -> no email; Goal Completed (auto) -> one email.
        self.assertEqual(len(mail.outbox) - outbox_before, 1)

        outbox_before = len(mail.outbox)
        purchase_resp = client.post(
            f"/api/v1/budgets/savings-goals/{goal.id}/complete-purchase/", {}, format="json"
        )
        self.assertEqual(purchase_resp.status_code, 200, purchase_resp.data)
        self.assertEqual(
            len(mail.outbox) - outbox_before,
            1,
            "Purchase Completed (Achievement) email must still fire",
        )

    def test_routine_savings_goal_events_remain_email_free(self):
        from django.core import mail

        client = APIClient()
        client.force_authenticate(user=self.user)

        outbox_before = len(mail.outbox)
        resp = client.post(
            "/api/v1/budgets/savings-goals/",
            {
                "goal_name": "Vacation",
                "target_amount": "5000.00",
                "target_date": "2027-06-01",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        goal_id = resp.data["id"]
        self.assertEqual(len(mail.outbox), outbox_before, "Goal Created must not send an email")

        resp = client.patch(
            f"/api/v1/budgets/savings-goals/{goal_id}/",
            {"goal_name": "Vacation 2027"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(len(mail.outbox), outbox_before, "Goal Updated must not send an email")

        resp = client.post(
            "/api/v1/budgets/savings-transactions/",
            {"goal": goal_id, "transaction_amount": "100.00", "transaction_type": "deposit"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(
            len(mail.outbox), outbox_before, "Deposit Added (non-completing) must not send an email"
        )

        resp = client.post(
            "/api/v1/budgets/savings-transactions/",
            {"goal": goal_id, "transaction_amount": "50.00", "transaction_type": "withdrawal"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(len(mail.outbox), outbox_before, "Withdrawal Made must not send an email")


class TargetDateReminderEligibilityTests(TestCase):
    """
    Direct unit tests of the pure `is_target_date_reminder_eligible` helper.
    Using a plain object (rather than a DB-backed SavingsGoal) lets us cover
    the "no target_date" case even though the current SavingsGoal.target_date
    field is non-nullable at the DB level.
    """

    def _goal(self, target_date, is_completed=False, is_archived=False):
        return SimpleNamespace(
            target_date=target_date,
            is_completed=is_completed,
            is_archived=is_archived,
        )

    def test_exactly_7_days_out_is_eligible(self):
        today = date(2026, 8, 1)
        goal = self._goal(target_date=today + timedelta(days=7))
        self.assertTrue(is_target_date_reminder_eligible(goal, today))

    def test_within_window_is_eligible(self):
        today = date(2026, 8, 1)
        for offset in range(0, 8):
            goal = self._goal(target_date=today + timedelta(days=offset))
            self.assertTrue(
                is_target_date_reminder_eligible(goal, today),
                f"offset={offset} should be eligible",
            )

    def test_more_than_7_days_out_is_not_eligible(self):
        today = date(2026, 8, 1)
        goal = self._goal(target_date=today + timedelta(days=8))
        self.assertFalse(is_target_date_reminder_eligible(goal, today))

    def test_past_target_date_is_not_eligible(self):
        today = date(2026, 8, 1)
        goal = self._goal(target_date=today - timedelta(days=1))
        self.assertFalse(is_target_date_reminder_eligible(goal, today))

    def test_completed_goal_is_not_eligible(self):
        today = date(2026, 8, 1)
        goal = self._goal(target_date=today + timedelta(days=3), is_completed=True)
        self.assertFalse(is_target_date_reminder_eligible(goal, today))

    def test_archived_goal_is_not_eligible(self):
        today = date(2026, 8, 1)
        goal = self._goal(target_date=today + timedelta(days=3), is_archived=True)
        self.assertFalse(is_target_date_reminder_eligible(goal, today))

    def test_no_target_date_is_not_eligible(self):
        today = date(2026, 8, 1)
        goal = self._goal(target_date=None)
        self.assertFalse(is_target_date_reminder_eligible(goal, today))


class SavingsGoalTargetDateReminderTests(TestCase):
    """
    Covers the new target-date ("deadline approaching") Savings Goal
    reminder end-to-end via the send_savings_reminders management command:
    in-app notification creation, dedup by (goal, target_date), email
    gating via the existing Savings Goal Updates preference, and exclusion
    of completed/archived/overdue goals. Does not touch or duplicate the
    existing inactivity-reminder tests above.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="target_date_tester",
            password="pw12345",
            email="target_date_tester@example.com",
        )
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])

    def _goal(self, target_date, current_amount="0.00", target_amount="1000.00", **kwargs):
        return SavingsGoal.objects.create(
            user=self.user,
            goal_name="New Phone",
            target_amount=Decimal(target_amount),
            current_amount=Decimal(current_amount),
            target_date=target_date,
            **kwargs,
        )

    # A. Target date exactly 7 days away -> reminder created.
    def test_target_date_exactly_7_days_away_creates_reminder(self):
        goal = self._goal(target_date=timezone.localdate() + timedelta(days=7))
        call_command("send_savings_reminders")

        notification = Notification.objects.get(
            user=self.user,
            dedup_key=f"savings_goal:{goal.id}:target_date_reminder:{goal.target_date.isoformat()}",
        )
        self.assertEqual(notification.title, "Savings Goal Deadline Approaching")
        self.assertIn("due in 7 days", notification.message)
        self.assertNotIn("Don't forget to continue saving", notification.message)

    # B. Reminder only created once for the same goal + same target date.
    def test_reminder_not_duplicated_on_repeated_runs(self):
        goal = self._goal(target_date=timezone.localdate() + timedelta(days=5))
        call_command("send_savings_reminders")
        call_command("send_savings_reminders")
        call_command("send_savings_reminders")

        count = Notification.objects.filter(
            user=self.user,
            dedup_key=f"savings_goal:{goal.id}:target_date_reminder:{goal.target_date.isoformat()}",
        ).count()
        self.assertEqual(count, 1)

    # C. Target date change generates its own new reminder.
    def test_changed_target_date_generates_new_reminder(self):
        goal = self._goal(target_date=timezone.localdate() + timedelta(days=6))
        call_command("send_savings_reminders")
        first_key = f"savings_goal:{goal.id}:target_date_reminder:{goal.target_date.isoformat()}"
        self.assertTrue(Notification.objects.filter(user=self.user, dedup_key=first_key).exists())

        new_target_date = timezone.localdate() + timedelta(days=4)
        goal.target_date = new_target_date
        goal.save(update_fields=["target_date"])

        call_command("send_savings_reminders")
        second_key = f"savings_goal:{goal.id}:target_date_reminder:{new_target_date.isoformat()}"
        self.assertTrue(Notification.objects.filter(user=self.user, dedup_key=second_key).exists())
        # Both notifications now exist - the old one is not overwritten,
        # and a genuinely new reminder was generated for the new date.
        self.assertEqual(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.REMINDER
            ).count(),
            2,
        )

    # D. Completed goal -> no target-date reminder.
    def test_completed_goal_gets_no_target_date_reminder(self):
        goal = self._goal(
            target_date=timezone.localdate() + timedelta(days=3),
            current_amount="1000.00",
            target_amount="1000.00",
        )
        self.assertTrue(goal.is_completed)
        call_command("send_savings_reminders")

        self.assertFalse(
            Notification.objects.filter(
                user=self.user, dedup_key__startswith=f"savings_goal:{goal.id}:target_date_reminder:"
            ).exists()
        )

    # E. Archived goal -> no target-date reminder.
    def test_archived_goal_gets_no_target_date_reminder(self):
        goal = self._goal(target_date=timezone.localdate() + timedelta(days=3))
        SavingsGoal.objects.filter(pk=goal.pk).update(is_archived=True)

        call_command("send_savings_reminders")

        self.assertFalse(
            Notification.objects.filter(
                user=self.user, dedup_key__startswith=f"savings_goal:{goal.id}:target_date_reminder:"
            ).exists()
        )

    # G. Past target date -> no target-date reminder (and no repeated firing).
    def test_overdue_goal_gets_no_target_date_reminder(self):
        goal = self._goal(target_date=timezone.localdate() - timedelta(days=2))
        call_command("send_savings_reminders")
        call_command("send_savings_reminders")

        self.assertFalse(
            Notification.objects.filter(
                user=self.user, dedup_key__startswith=f"savings_goal:{goal.id}:target_date_reminder:"
            ).exists()
        )

    # H. In-app notification is created (also covered by test A; asserted
    # explicitly here against the Notification model fields used by the UI).
    def test_in_app_notification_fields(self):
        goal = self._goal(target_date=timezone.localdate() + timedelta(days=2))
        call_command("send_savings_reminders")

        notification = Notification.objects.get(
            user=self.user,
            dedup_key=f"savings_goal:{goal.id}:target_date_reminder:{goal.target_date.isoformat()}",
        )
        self.assertEqual(notification.notification_type, Notification.NotificationType.REMINDER)
        self.assertEqual(notification.action_url, "/savings-goals")
        self.assertFalse(notification.is_read)

    # I. Email is sent when Savings Goal Updates preference allows it.
    def test_email_sent_when_savings_goal_updates_enabled(self):
        from django.core import mail

        self._goal(target_date=timezone.localdate() + timedelta(days=7))
        outbox_before = len(mail.outbox)
        call_command("send_savings_reminders")

        self.assertEqual(len(mail.outbox) - outbox_before, 1)
        self.assertIn("Deadline Approaching", mail.outbox[-1].subject)

    # J. Email NOT sent when Savings Goal Updates preference disabled.
    # K. In-app notification still exists when email preference is disabled.
    def test_no_email_but_notification_still_created_when_preference_disabled(self):
        from django.core import mail

        self.user.profile.email_savings_goal_notifications = False
        self.user.profile.save(update_fields=["email_savings_goal_notifications"])

        goal = self._goal(target_date=timezone.localdate() + timedelta(days=7))
        outbox_before = len(mail.outbox)
        call_command("send_savings_reminders")

        self.assertEqual(len(mail.outbox) - outbox_before, 0)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user,
                dedup_key=f"savings_goal:{goal.id}:target_date_reminder:{goal.target_date.isoformat()}",
            ).exists()
        )

    # N. A scheduler run that misses the exact 7-day mark still produces
    # exactly one reminder, generated on the first run that falls inside
    # the eligibility window (rather than only on day-7 itself).
    def test_missed_exact_day_still_fires_once_within_window(self):
        # Simulate the scheduler having "missed" days 7 and 6; the first
        # run happens on what is now day 5 of the window.
        goal = self._goal(target_date=timezone.localdate() + timedelta(days=5))
        call_command("send_savings_reminders")

        notification = Notification.objects.get(
            user=self.user,
            dedup_key=f"savings_goal:{goal.id}:target_date_reminder:{goal.target_date.isoformat()}",
        )
        self.assertIn("due in 5 days", notification.message)

        # A later run the same day (or any subsequent day within the
        # window) must not create a second reminder for this target date.
        call_command("send_savings_reminders")
        self.assertEqual(
            Notification.objects.filter(
                user=self.user,
                dedup_key=f"savings_goal:{goal.id}:target_date_reminder:{goal.target_date.isoformat()}",
            ).count(),
            1,
        )

    # L/M regression: confirm the existing inactivity reminder and its
    # dedup_key format are completely unaffected by adding the
    # target-date reminder to the same command run.
    def test_inactivity_reminder_dedup_key_format_unchanged(self):
        goal = self._goal(target_date=timezone.localdate() + timedelta(days=30))
        SavingsGoal.objects.filter(pk=goal.pk).update(
            created_at=timezone.now() - timedelta(days=10)
        )
        goal.refresh_from_db()

        call_command("send_savings_reminders", "--days=7")

        now = timezone.now()
        iso_year, iso_week, _ = now.isocalendar()
        inactivity_key = f"savings_goal:{goal.id}:reminder:{iso_year}-W{iso_week:02d}"
        self.assertTrue(
            Notification.objects.filter(user=self.user, dedup_key=inactivity_key).exists()
        )
        # The target-date reminder (30 days out) must not have fired
        # alongside it.
        self.assertFalse(
            Notification.objects.filter(
                user=self.user, dedup_key__startswith=f"savings_goal:{goal.id}:target_date_reminder:"
            ).exists()
        )
