from decimal import Decimal

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase
from rest_framework.test import APIClient

from budgets.models import Budget
from budgets.notifications import check_and_notify_budget_alerts
from expenses.models import Expense

from .models import Notification


class BudgetAlertReconciliationOnBudgetAmountEditTests(TestCase):
    """
    Covers the follow-up to BudgetAlertReconciliationOnExpenseDeleteTests
    (notifications/test_budget_alert_reconciliation.py): editing the
    budget AMOUNT itself must participate in the same 80/90/100 threshold
    notification architecture (budgets/notifications.py) that expense
    add/update/delete already goes through.

    Budget edits go through the real API (BudgetViewSet), and expenses are
    seeded directly since only the budget's monthly_limit is being edited
    here - not the expenses themselves.

    Already-sent emails are historical and are never touched by a budget
    edit: a downward tier transition only ever reconciles (removes) stale
    in-app Notification rows, and an upward transition sends at most one
    new email through the existing create_notification/
    dispatch_notification_email pipeline, deduped exactly like an expense
    threshold crossing.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="budget_edit_tester",
            password="pw12345",
            email="budget_edit_tester@example.com",
        )
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _make_budget(self, monthly_limit):
        return Budget.objects.create(
            user=self.user,
            category="Food",
            monthly_limit=Decimal(monthly_limit),
            month=8,
            year=2026,
        )

    def _add_expense(self, amount):
        # Mirrors what ExpenseViewSet.perform_create actually does when an
        # expense is added through the API: save the row, then run the
        # same threshold check an expense-add already triggers. Only the
        # budget-edit reconciliation under test here is exercised through
        # the real API below; expenses are seeded this way purely to set
        # up realistic "already sent" alert state beforehand.
        Expense.objects.create(
            user=self.user,
            title="test expense",
            amount=Decimal(amount),
            category="Food",
            payment_method="Cash",
            date="2026-08-10",
        )
        check_and_notify_budget_alerts(self.user, "Food", 8, 2026)

    def _alert_key(self, budget, threshold):
        return f"budget_alert:{budget.id}:{threshold}"

    def _patch_budget(self, budget, monthly_limit):
        resp = self.client.patch(
            f"/api/v1/budgets/{budget.id}/",
            {"monthly_limit": monthly_limit},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        return resp

    # ---------------------------------------------------------------
    # A. Budget increase / threshold decreases
    # ---------------------------------------------------------------

    def test_90_to_below_80_removes_stale_90_notification(self):
        budget = self._make_budget("10000.00")
        self._add_expense("9000.00")  # 90%
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists()
        )

        outbox_before = len(mail.outbox)
        resp = self._patch_budget(budget, "15000.00")  # 9000/15000 = 60%

        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists(),
            "the stale 90% notification must be removed once usage drops below 80%",
        )
        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 80)).exists()
        )
        self.assertEqual(len(mail.outbox), outbox_before, "no email on a downward transition")
        self.assertFalse(resp.data.get("threshold_crossed_up"))

    def test_100_to_below_80_removes_stale_100_notification(self):
        budget = self._make_budget("10000.00")
        self._add_expense("10500.00")  # 105%
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 100)).exists()
        )

        self._patch_budget(budget, "20000.00")  # 10500/20000 = 52.5%

        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 100)).exists(),
            "the stale 100% notification must be removed once usage drops below 80%",
        )

    def test_100_to_90_removes_exceeded_but_preserves_existing_high_warning(self):
        budget = self._make_budget("10000.00")
        self._add_expense("9000.00")  # 90% -> High Warning
        high_warning = Notification.objects.get(dedup_key=self._alert_key(budget, 90))

        self._add_expense("1500.00")  # total 10500 = 105% -> Exceeded

        outbox_before = len(mail.outbox)
        self._patch_budget(budget, "11000.00")  # 10500/11000 = 95.45% -> tier 90

        self.assertEqual(len(mail.outbox), outbox_before, "no email on a downward transition")
        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 100)).exists(),
            "the now-stale 100% exceeded alert must be removed",
        )
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists(),
            "the still-applicable 90% high warning must be preserved, not recreated",
        )
        preserved = Notification.objects.get(dedup_key=self._alert_key(budget, 90))
        self.assertEqual(preserved.id, high_warning.id)

    def test_100_to_90_with_no_existing_90_notification_does_not_invent_one(self):
        # Budget jumped straight from below 80% to 100%+ (e.g. one large
        # expense), so no 90% notification was ever created.
        budget = self._make_budget("10000.00")
        self._add_expense("10500.00")  # 105% -> Exceeded only
        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists()
        )

        outbox_before = len(mail.outbox)
        self._patch_budget(budget, "11000.00")  # 10500/11000 = 95.45% -> tier 90

        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 100)).exists(),
            "the stale 100% notification must be removed",
        )
        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists(),
            "a 90% notification must never be invented retroactively",
        )
        self.assertEqual(len(mail.outbox), outbox_before)

    # ---------------------------------------------------------------
    # B. Budget decrease / threshold increases
    # ---------------------------------------------------------------

    def test_below_80_to_80_creates_inapp_and_email(self):
        budget = self._make_budget("20000.00")
        self._add_expense("8500.00")  # 42.5% of 20000, well below 80%

        outbox_before = len(mail.outbox)
        resp = self._patch_budget(budget, "10000.00")  # 8500/10000 = 85%

        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 80)).exists()
        )
        self.assertEqual(len(mail.outbox), outbox_before + 1)
        self.assertTrue(resp.data.get("threshold_crossed_up"))
        self.assertEqual(resp.data.get("tier_after"), 80)

    def test_below_80_to_90_creates_inapp_and_email(self):
        budget = self._make_budget("20000.00")
        self._add_expense("9500.00")  # 47.5% of 20000

        outbox_before = len(mail.outbox)
        resp = self._patch_budget(budget, "10000.00")  # 9500/10000 = 95%

        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists()
        )
        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 80)).exists(),
            "only the highest applicable tier is created, matching an expense crossing",
        )
        self.assertEqual(len(mail.outbox), outbox_before + 1)
        self.assertTrue(resp.data.get("threshold_crossed_up"))

    def test_below_80_to_100_creates_inapp_and_email(self):
        budget = self._make_budget("20000.00")
        self._add_expense("10500.00")  # 52.5% of 20000

        outbox_before = len(mail.outbox)
        resp = self._patch_budget(budget, "10000.00")  # 10500/10000 = 105%

        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 100)).exists()
        )
        self.assertEqual(len(mail.outbox), outbox_before + 1)
        self.assertTrue(resp.data.get("threshold_crossed_up"))
        self.assertEqual(resp.data.get("tier_after"), 100)

    def test_80_tier_to_90_tier_creates_high_warning(self):
        budget = self._make_budget("10000.00")
        self._add_expense("8500.00")  # 85% -> Warning
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 80)).exists()
        )

        outbox_before = len(mail.outbox)
        resp = self._patch_budget(budget, "9000.00")  # 8500/9000 = 94.4%

        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists()
        )
        self.assertEqual(len(mail.outbox), outbox_before + 1)
        self.assertTrue(resp.data.get("threshold_crossed_up"))

    def test_90_tier_to_100_tier_creates_exceeded(self):
        budget = self._make_budget("10000.00")
        self._add_expense("9000.00")  # 90% -> High Warning
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists()
        )

        outbox_before = len(mail.outbox)
        resp = self._patch_budget(budget, "8500.00")  # 9000/8500 = 105.9%

        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 100)).exists()
        )
        self.assertEqual(len(mail.outbox), outbox_before + 1)
        self.assertTrue(resp.data.get("threshold_crossed_up"))

    def test_upward_transition_does_not_create_duplicate_notification(self):
        budget = self._make_budget("20000.00")
        self._add_expense("9500.00")

        self._patch_budget(budget, "10000.00")  # crosses to 90% tier
        self.assertEqual(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).count(), 1
        )

        # Editing again but staying in the same 90% tier must not duplicate.
        self._patch_budget(budget, "10200.00")  # 9500/10200 = 93.1% - still tier 90
        self.assertEqual(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).count(), 1
        )

    # ---------------------------------------------------------------
    # C. Same tier -> same tier
    # ---------------------------------------------------------------

    def test_80_to_85_percent_does_not_duplicate(self):
        budget = self._make_budget("10000.00")
        self._add_expense("8000.00")  # 80%
        warning = Notification.objects.get(dedup_key=self._alert_key(budget, 80))

        outbox_before = len(mail.outbox)
        self._patch_budget(budget, "9400.00")  # 8000/9400 = 85.1% - still tier 80

        self.assertEqual(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 80)).count(), 1
        )
        self.assertEqual(
            Notification.objects.get(dedup_key=self._alert_key(budget, 80)).id, warning.id
        )
        self.assertEqual(len(mail.outbox), outbox_before)

    def test_90_to_95_percent_does_not_duplicate(self):
        budget = self._make_budget("10000.00")
        self._add_expense("9000.00")  # 90%
        high_warning = Notification.objects.get(dedup_key=self._alert_key(budget, 90))

        outbox_before = len(mail.outbox)
        self._patch_budget(budget, "9473.68")  # 9000/9473.68 = ~95%, still tier 90

        self.assertEqual(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).count(), 1
        )
        self.assertEqual(
            Notification.objects.get(dedup_key=self._alert_key(budget, 90)).id, high_warning.id
        )
        self.assertEqual(len(mail.outbox), outbox_before)

    def test_100_to_120_percent_does_not_duplicate(self):
        budget = self._make_budget("10000.00")
        self._add_expense("12000.00")  # 120% already
        exceeded = Notification.objects.get(dedup_key=self._alert_key(budget, 100))

        outbox_before = len(mail.outbox)
        self._patch_budget(budget, "11500.00")  # 12000/11500 = 104.3%, still tier 100

        self.assertEqual(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 100)).count(), 1
        )
        self.assertEqual(
            Notification.objects.get(dedup_key=self._alert_key(budget, 100)).id, exceeded.id
        )
        self.assertEqual(len(mail.outbox), outbox_before)

    # ---------------------------------------------------------------
    # Edge cases
    # ---------------------------------------------------------------

    def test_no_expenses_exist_edit_never_creates_alert(self):
        budget = self._make_budget("10000.00")

        outbox_before = len(mail.outbox)
        resp = self._patch_budget(budget, "500.00")  # 0/500 = 0%, still below 80%

        for threshold in (80, 90, 100):
            self.assertFalse(
                Notification.objects.filter(dedup_key=self._alert_key(budget, threshold)).exists()
            )
        self.assertEqual(len(mail.outbox), outbox_before)
        self.assertFalse(resp.data.get("threshold_crossed_up"))

    def test_invalid_monthly_limit_is_rejected_and_does_not_touch_alerts(self):
        budget = self._make_budget("10000.00")
        self._add_expense("9000.00")  # 90%
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists()
        )

        resp = self.client.patch(
            f"/api/v1/budgets/{budget.id}/",
            {"monthly_limit": "0"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists(),
            "a rejected edit must not affect existing alerts",
        )

    def test_editing_unrelated_field_alone_does_not_trigger_threshold_alerts(self):
        budget = self._make_budget("10000.00")
        self._add_expense("9000.00")  # 90%
        high_warning = Notification.objects.get(dedup_key=self._alert_key(budget, 90))

        outbox_before = len(mail.outbox)
        # Move the budget to a different month without changing the amount.
        resp = self.client.patch(
            f"/api/v1/budgets/{budget.id}/",
            {"month": 9},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)

        self.assertEqual(len(mail.outbox), outbox_before)
        # The original alert (tied to the budget's id, not its
        # category/month/year) is left exactly as it was.
        high_warning.refresh_from_db()
        self.assertFalse(resp.data.get("threshold_crossed_up"))

    def test_creating_a_new_budget_is_not_treated_as_an_update(self):
        outbox_before = len(mail.outbox)
        resp = self.client.post(
            "/api/v1/budgets/",
            {"category": "Travel", "monthly_limit": "1000.00", "month": 8, "year": 2026},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertNotIn("threshold_crossed_up", resp.data)
        self.assertEqual(len(mail.outbox), outbox_before)

    def test_toast_fields_absent_when_amount_unchanged(self):
        budget = self._make_budget("10000.00")
        self._add_expense("9000.00")

        resp = self._patch_budget(budget, "10000.00")  # unchanged amount
        self.assertNotIn("threshold_crossed_up", resp.data)

    # ---------------------------------------------------------------
    # Existing regression coverage (expense deletion / budget CRUD)
    # ---------------------------------------------------------------

    def test_expense_deletion_reconciliation_still_works_alongside_budget_edits(self):
        budget = self._make_budget("10000.00")
        expense = Expense.objects.create(
            user=self.user,
            title="big one",
            amount=Decimal("9500.00"),
            category="Food",
            payment_method="Cash",
            date="2026-08-10",
        )
        check_and_notify_budget_alerts(self.user, "Food", 8, 2026)
        self.assertTrue(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists()
        )

        resp = self.client.delete(f"/api/v1/expenses/{expense.id}/")
        self.assertIn(resp.status_code, (200, 204))

        self.assertFalse(
            Notification.objects.filter(dedup_key=self._alert_key(budget, 90)).exists(),
            "expense-delete reconciliation must continue working after this change",
        )
