from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase
from rest_framework.test import APIClient

from budgets.models import Budget
from expenses.models import Expense

from .models import Notification


class BudgetAlertReconciliationOnExpenseDeleteTests(TestCase):
    """
    Covers reconciling stale in-app 80/90/100 budget threshold
    notifications after an expense is deleted, per the standardized
    80/90/100 alert model (budgets/notifications.py). Expense create/
    update/delete all go through the real API (ExpenseViewSet), matching
    how check_and_notify_budget_alerts is already exercised elsewhere.

    Already-sent emails are historical and are never touched here - only
    the corresponding in-app Notification rows are removed when they are
    no longer applicable to the budget's current usage.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="reconcile_tester",
            password="pw12345",
            email="reconcile_tester@example.com",
        )
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.budget = Budget.objects.create(
            user=self.user,
            category="Food",
            monthly_limit=Decimal("10000.00"),
            month=8,
            year=2026,
        )

    def _alert_key(self, threshold):
        return f"budget_alert:{self.budget.id}:{threshold}"

    def _add_expense(self, amount):
        resp = self.client.post(
            "/api/v1/expenses/",
            {
                "title": "test expense",
                "amount": amount,
                "category": "Food",
                "payment_method": "Cash",
                "date": "2026-08-10",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        return resp.data["id"]

    def _delete_expense(self, expense_id):
        resp = self.client.delete(f"/api/v1/expenses/{expense_id}/")
        self.assertIn(resp.status_code, (200, 204))

    # ---------------------------------------------------------------
    # 1: 90% -> 70% (matches the spec's own worked example)
    # ---------------------------------------------------------------

    def test_90_percent_warning_removed_after_deletion_drops_below_80(self):
        e1 = self._add_expense("7000.00")
        e2 = self._add_expense("2000.00")  # total 9000 = 90%
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(90)).exists()
        )

        self._delete_expense(e2)  # total back to 7000 = 70%

        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(90)).exists(),
            "the stale 90% warning must be removed once usage drops below 80%",
        )
        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(80)).exists()
        )
        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(100)).exists()
        )

    # ---------------------------------------------------------------
    # 2: 100% -> 30% (well below 80%)
    # ---------------------------------------------------------------

    def test_100_percent_exceeded_removed_after_deletion_drops_below_80(self):
        e1 = self._add_expense("3000.00")
        e2 = self._add_expense("7500.00")  # total 10500 = 105%
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(100)).exists()
        )

        self._delete_expense(e2)  # back to 3000 = 30%

        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(100)).exists(),
            "the stale 100% exceeded alert must be removed once usage drops below 80%",
        )

    # ---------------------------------------------------------------
    # 3: 100% -> 90%: exceeded alert removed, existing high-warning kept
    # ---------------------------------------------------------------

    def test_100_to_90_removes_exceeded_but_preserves_existing_high_warning(self):
        self._add_expense("9000.00")  # total 9000 = 90% -> High Warning created
        high_warning = Notification.objects.get(dedup_key=self._alert_key(90))

        e2 = self._add_expense("1000.00")  # total 10000 = 100% -> Exceeded created
        e3 = self._add_expense("500.00")  # total 10500 = 105%, still Exceeded (deduped)
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(100)).exists()
        )

        outbox_before = len(mail.outbox)
        self._delete_expense(e2)  # total 9000 + 500 = 9500 = 95%
        self.assertEqual(
            len(mail.outbox), outbox_before, "deleting an expense must never send a new email"
        )

        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(100)).exists(),
            "the now-stale 100% exceeded alert must be removed",
        )
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(90)).exists(),
            "the still-applicable 90% high warning must be preserved, not recreated",
        )
        # It's the exact same historical notification row - untouched.
        preserved = Notification.objects.get(dedup_key=self._alert_key(90))
        self.assertEqual(preserved.id, high_warning.id)

    # ---------------------------------------------------------------
    # 4: deletion that keeps usage within the same tier must not remove
    #    the still-applicable notification
    # ---------------------------------------------------------------

    def test_deletion_within_same_tier_does_not_remove_applicable_notification(self):
        self._add_expense("8500.00")  # 85% -> Warning
        e2 = self._add_expense("200.00")  # 87% - still Warning tier, deduped
        warning = Notification.objects.get(dedup_key=self._alert_key(80))

        self._delete_expense(e2)  # back to 8500 = 85% - still Warning tier

        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(80)).exists(),
            "an applicable notification must survive a deletion that keeps the same tier",
        )
        still_there = Notification.objects.get(dedup_key=self._alert_key(80))
        self.assertEqual(still_there.id, warning.id)

    # ---------------------------------------------------------------
    # 5: no duplicate threshold notifications are ever created by
    #    reconciliation (it only ever deletes, never creates)
    # ---------------------------------------------------------------

    def test_reconciliation_never_creates_duplicate_notifications(self):
        self._add_expense("8000.00")  # 80% -> Warning
        e2 = self._add_expense("100.00")  # 81% - still Warning tier, deduped

        self._delete_expense(e2)  # back to 8000 = 80% - still Warning tier

        self.assertEqual(
            Notification.objects.filter(dedup_key=self._alert_key(80)).count(),
            1,
            "reconciliation must never create a duplicate of an existing, still-applicable alert",
        )

    # ---------------------------------------------------------------
    # 6: deleting an expense never sends a new email, in any scenario
    # ---------------------------------------------------------------

    def test_deleting_expense_sends_no_new_email(self):
        e1 = self._add_expense("7000.00")
        e2 = self._add_expense("2000.00")  # 90% -> High Warning + 1 email

        outbox_before = len(mail.outbox)
        self._delete_expense(e2)  # drop to 70%, reconciliation removes the alert

        self.assertEqual(
            len(mail.outbox),
            outbox_before,
            "expense deletion must never send a new (or resend an old) email",
        )

    # ---------------------------------------------------------------
    # 7: below 80% after deletion leaves no threshold notification at all
    # ---------------------------------------------------------------

    def test_all_threshold_notifications_removed_when_dropping_below_80(self):
        e1 = self._add_expense("9000.00")  # 90% -> High Warning
        e2 = self._add_expense("1500.00")  # 105% -> Exceeded (High Warning kept)
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(90)).exists()
        )
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(100)).exists()
        )

        self._delete_expense(e2)  # 90% remains - nothing stale yet
        self._delete_expense(e1)  # 0% - everything is now stale

        for threshold in (80, 90, 100):
            self.assertFalse(
                Notification.objects.filter(dedup_key=self._alert_key(threshold)).exists(),
                f"the {threshold}% alert must not remain once usage drops below 80%",
            )
