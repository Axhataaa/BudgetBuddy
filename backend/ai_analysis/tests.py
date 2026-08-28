import datetime
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from budgets.models import Budget, SavingsGoal
from expenses.models import Expense
from incomes.models import Income

from .groq_client import AIAnalysisUnavailable, _validate_analysis
from .services import build_financial_snapshot

VALID_ANALYSIS = {
    "overall": "Your income comfortably covers your expenses this period.",
    "key_observations": ["Food spending is the largest category."],
    "patterns": ["Spending is fairly steady week to week."],
    "risks": [],
    "recommendations": ["Consider trimming discretionary spending slightly."],
    "savings_strategy": "Keep contributing toward your goal at the current pace.",
    "positive_progress": ["You stayed under budget in every category this period."],
}


class AIFinancialAnalysisEndpointTests(TestCase):
    def setUp(self):
        cache.clear()

        self.user = User.objects.create_user(username="ai_tester", password="pw12345")
        self.user.profile.currency = "USD"
        self.user.profile.save(update_fields=["currency"])

        self.other_user = User.objects.create_user(username="ai_other", password="pw12345")
        self.other_user.profile.currency = "INR"
        self.other_user.profile.save(update_fields=["currency"])

        self.client = APIClient()

        self.today = datetime.date(2026, 8, 15)
        # Strings for the HTTP layer (query/body params arrive as strings
        # and are parsed by AIAnalysisRequestSerializer); date objects for
        # calling build_financial_snapshot() directly, matching what the
        # view actually passes it after serializer validation.
        self.date_from = "2026-08-01"
        self.date_to = "2026-08-31"
        self.date_from_obj = datetime.date(2026, 8, 1)
        self.date_to_obj = datetime.date(2026, 8, 31)

        Income.objects.create(
            user=self.user, source="Salary", amount="50000.00", date=self.today
        )
        Expense.objects.create(
            user=self.user, title="Groceries", amount="8000.00",
            category="Food", date=self.today,
        )

        # Belongs to a DIFFERENT user - must never leak into self.user's
        # snapshot or response.
        Income.objects.create(
            user=self.other_user, source="Freelance", amount="999999.00", date=self.today
        )
        Expense.objects.create(
            user=self.other_user, title="Other user's secret expense", amount="777.00",
            category="Shopping", date=self.today,
        )

    def _post(self, refresh=False):
        return self.client.post(
            "/api/v1/ai-analysis/analyze/",
            {"date_from": self.date_from, "date_to": self.date_to, "refresh": refresh},
            format="json",
        )

    # 1. authenticated user can request AI analysis
    @patch("ai_analysis.views.generate_financial_analysis")
    def test_authenticated_user_gets_analysis(self, mock_generate):
        mock_generate.return_value = VALID_ANALYSIS
        self.client.force_authenticate(user=self.user)

        resp = self._post()

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["status"], "ok")
        self.assertEqual(resp.data["currency"], "USD")
        self.assertEqual(resp.data["analysis"], VALID_ANALYSIS)

    # 2. unauthenticated user is rejected
    def test_unauthenticated_user_is_rejected(self):
        resp = self._post()
        self.assertEqual(resp.status_code, 401)

    # 3 & 4. user cannot access another user's data / snapshot is scoped
    def test_snapshot_only_contains_authenticated_users_data(self):
        snapshot, has_activity = build_financial_snapshot(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )

        self.assertTrue(has_activity)
        snapshot_text = str(snapshot)

        self.assertNotIn("999999", snapshot_text)
        self.assertNotIn("Other user's secret expense", snapshot_text)
        self.assertNotIn("777", snapshot_text)
        self.assertNotIn("Freelance", snapshot_text)

    @patch("ai_analysis.views.generate_financial_analysis")
    def test_cross_user_isolation_end_to_end(self, mock_generate):
        captured_snapshots = []

        def fake_generate(snapshot):
            captured_snapshots.append(snapshot)
            return VALID_ANALYSIS

        mock_generate.side_effect = fake_generate
        self.client.force_authenticate(user=self.user)

        self._post()

        self.assertEqual(len(captured_snapshots), 1)
        snapshot_text = str(captured_snapshots[0])
        self.assertNotIn("999999", snapshot_text)
        self.assertNotIn("Freelance", snapshot_text)

    # 5. Gemini/API failure is handled safely
    @patch("ai_analysis.views.generate_financial_analysis")
    def test_gemini_failure_returns_safe_generic_message(self, mock_generate):
        mock_generate.side_effect = AIAnalysisUnavailable("network_error")
        self.client.force_authenticate(user=self.user)

        resp = self._post()

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["status"], "unavailable")
        self.assertNotIn("network_error", str(resp.data))
        self.assertNotIn("Traceback", str(resp.data))

    # 6. insufficient data is handled correctly
    def test_insufficient_data_skips_gemini(self):
        empty_user = User.objects.create_user(username="ai_empty", password="pw12345")
        self.client.force_authenticate(user=empty_user)

        with patch("ai_analysis.views.generate_financial_analysis") as mock_generate:
            resp = self._post()
            mock_generate.assert_not_called()

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["status"], "insufficient_data")

    # 7. currency context is correct
    def test_snapshot_uses_users_own_currency(self):
        snapshot, _ = build_financial_snapshot(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )
        self.assertEqual(snapshot["currency"], "USD")

        other_snapshot, _ = build_financial_snapshot(
            user=self.other_user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )
        self.assertEqual(other_snapshot["currency"], "INR")

    # 8. sensitive personal information is not sent to Gemini
    def test_snapshot_excludes_sensitive_fields(self):
        self.user.email = "secret@example.com"
        self.user.save(update_fields=["email"])

        snapshot, _ = build_financial_snapshot(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )
        snapshot_text = str(snapshot)

        self.assertNotIn("secret@example.com", snapshot_text)
        self.assertNotIn("password", snapshot_text.lower())
        self.assertNotIn("ai_tester", snapshot_text)

    # 9. response validation works
    def test_response_validation_rejects_malformed_payload(self):
        with self.assertRaises(AIAnalysisUnavailable):
            _validate_analysis({"overall": "", "key_observations": [], "patterns": [],
                                  "risks": [], "recommendations": [], "savings_strategy": "",
                                  "positive_progress": []})

    def test_response_validation_accepts_well_formed_payload(self):
        validated = _validate_analysis(VALID_ANALYSIS)
        self.assertEqual(validated["overall"], VALID_ANALYSIS["overall"])
        self.assertEqual(validated["risks"], [])

    def test_response_validation_drops_non_string_junk_and_ignores_wrong_types(self):
        messy = dict(VALID_ANALYSIS)
        messy["key_observations"] = ["Fine.", None, 42, {"nested": "object"}, ""]
        validated = _validate_analysis(messy)
        self.assertIn("Fine.", validated["key_observations"])
        self.assertIn("42", validated["key_observations"])
        self.assertNotIn(None, validated["key_observations"])
        self.assertNotIn("", validated["key_observations"])

    # Budgets / goals should only appear when they actually exist
    def test_no_budgets_means_empty_budgets_list(self):
        snapshot, _ = build_financial_snapshot(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )
        self.assertEqual(snapshot["budgets"], [])

    def test_budgets_and_goals_are_included_when_present(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="10000.00", month=8, year=2026
        )
        SavingsGoal.objects.create(
            user=self.user, goal_name="New Laptop", target_amount="1000.00",
            current_amount="200.00", target_date=datetime.date(2027, 1, 1),
        )

        snapshot, _ = build_financial_snapshot(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )

        self.assertEqual(len(snapshot["budgets"]), 1)
        self.assertEqual(snapshot["budgets"][0]["category"], "Food")
        self.assertEqual(len(snapshot["savings_goals"]["active"]), 1)
        self.assertEqual(snapshot["savings_goals"]["active"][0]["name"], "New Laptop")
        self.assertEqual(snapshot["savings_goals"]["achieved"], [])

    # 10 (existing tests remain passing) is verified by running the full
    # suite - see final verification section of the response.
