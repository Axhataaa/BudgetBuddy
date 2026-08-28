import datetime
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from budgets.models import Budget, SavingsGoal
from expenses.models import Expense
from incomes.models import Income

from .context import build_finora_context
from .exceptions import FinoraProviderUnavailable
from .providers.gemini import GeminiProvider


class FinoraChatEndpointTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="finora_tester", password="pw12345")
        self.user.profile.currency = "USD"
        self.user.profile.save(update_fields=["currency"])

        self.other_user = User.objects.create_user(username="finora_other", password="pw12345")
        self.other_user.profile.currency = "INR"
        self.other_user.profile.save(update_fields=["currency"])

        self.client = APIClient()

        self.today = datetime.date(2026, 8, 15)
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
        # context or response.
        Income.objects.create(
            user=self.other_user, source="Freelance", amount="999999.00", date=self.today
        )
        Expense.objects.create(
            user=self.other_user, title="Other user's secret expense", amount="777.00",
            category="Shopping", date=self.today,
        )

    def _post(self, message="How am I doing this month?", history=None, **extra):
        payload = {"message": message}
        if history is not None:
            payload["history"] = history
        payload.update(extra)
        return self.client.post("/api/v1/finora/chat/", payload, format="json")

    # ---- authenticated access ----
    @patch("finora.views.generate_finora_reply")
    def test_authenticated_user_gets_reply(self, mock_generate):
        mock_generate.return_value = ("You're on track this month.", None)
        self.client.force_authenticate(user=self.user)

        resp = self._post(date_from=self.date_from, date_to=self.date_to)

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["status"], "ok")
        self.assertEqual(resp.data["reply"], "You're on track this month.")
        self.assertEqual(resp.data["currency"], "USD")
        self.assertIsNone(resp.data["scenario"])

    # ---- unauthenticated access ----
    def test_unauthenticated_user_is_rejected(self):
        resp = self._post()
        self.assertEqual(resp.status_code, 401)

    # ---- user-data isolation ----
    def test_context_only_contains_authenticated_users_data(self):
        context, has_activity = build_finora_context(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )

        self.assertTrue(has_activity)
        context_text = str(context)

        self.assertNotIn("999999", context_text)
        self.assertNotIn("Other user's secret expense", context_text)
        self.assertNotIn("777", context_text)
        self.assertNotIn("Freelance", context_text)

    @patch("finora.views.generate_finora_reply")
    def test_cross_user_isolation_end_to_end(self, mock_generate):
        captured = []

        def fake_generate(*, context, message, history):
            captured.append(context)
            return "ok", None

        mock_generate.side_effect = fake_generate
        self.client.force_authenticate(user=self.user)

        self._post(date_from=self.date_from, date_to=self.date_to)

        self.assertEqual(len(captured), 1)
        context_text = str(captured[0])
        self.assertNotIn("999999", context_text)
        self.assertNotIn("Freelance", context_text)

    def test_other_users_data_never_appears_in_users_own_context(self):
        # Sanity check the reverse direction too: other_user's context
        # must not contain self.user's data either.
        context, _ = build_finora_context(
            user=self.other_user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )
        context_text = str(context)
        self.assertNotIn("50000", context_text)
        self.assertNotIn("Groceries", context_text)

    # ---- financial context generation / reuse of existing calculations ----
    def test_context_structure(self):
        context, has_activity = build_finora_context(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )

        self.assertTrue(has_activity)
        for key in ("currency", "period", "period_summary", "savings_goals", "lifetime"):
            self.assertIn(key, context)

        for key in (
            "income", "expenses", "net_savings", "savings_rate_percent",
            "trend_granularity", "trend", "budgets", "insights",
            "transaction_count_in_period", "data_confidence",
        ):
            self.assertIn(key, context["period_summary"])

        for key in (
            "total_income", "total_expenses", "total_savings", "current_balance",
            "active_goals", "completed_goals", "achievements", "budgets_created",
        ):
            self.assertIn(key, context["lifetime"])

    def test_context_reuses_report_totals_for_the_period(self):
        from reports.services import get_report_data

        report = get_report_data(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )
        context, _ = build_finora_context(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )

        # The period income/expense totals in Finora's context must match
        # the Reports source of truth exactly (via ai_analysis's currency
        # conversion, which uses USD rate 0.0120 for this fixture user).
        from common.formatting import convert_from_inr

        expected_income = float(convert_from_inr(report["summary"]["total_income"], "USD"))
        expected_expenses = float(convert_from_inr(report["summary"]["total_expenses"], "USD"))

        self.assertEqual(context["period_summary"]["income"]["total"], expected_income)
        self.assertEqual(context["period_summary"]["expenses"]["total"], expected_expenses)

    def test_context_reuses_dashboard_lifetime_totals(self):
        from analytics.services import get_dashboard_summary
        from common.formatting import convert_from_inr

        lifetime = get_dashboard_summary(self.user)
        context, _ = build_finora_context(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )

        self.assertEqual(
            context["lifetime"]["total_income"],
            float(convert_from_inr(lifetime["total_income"], "USD")),
        )
        self.assertEqual(context["lifetime"]["active_goals"], lifetime["active_goals"])
        self.assertEqual(context["lifetime"]["budgets_created"], lifetime["budgets_created"])

    def test_budgets_and_goals_included_when_present(self):
        Budget.objects.create(
            user=self.user, category="Food", monthly_limit="10000.00", month=8, year=2026
        )
        SavingsGoal.objects.create(
            user=self.user, goal_name="New Laptop", target_amount="1000.00",
            current_amount="200.00", target_date=datetime.date(2027, 1, 1),
        )

        context, _ = build_finora_context(
            user=self.user, date_from=self.date_from_obj, date_to=self.date_to_obj
        )

        self.assertEqual(len(context["period_summary"]["budgets"]), 1)
        self.assertEqual(context["period_summary"]["budgets"][0]["category"], "Food")
        self.assertEqual(len(context["savings_goals"]["active"]), 1)
        self.assertEqual(context["savings_goals"]["active"][0]["name"], "New Laptop")

    # ---- default context window ----
    @patch("finora.views.generate_finora_reply")
    def test_defaults_to_trailing_30_day_window_when_no_dates_given(self, mock_generate):
        mock_generate.return_value = ("ok", None)
        self.client.force_authenticate(user=self.user)

        resp = self._post()

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIn("from", resp.data["period"])
        self.assertIn("to", resp.data["period"])

    # ---- malformed / invalid requests ----
    def test_missing_message_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.post("/api/v1/finora/chat/", {}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_blank_message_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        resp = self._post(message="   ")
        self.assertEqual(resp.status_code, 400)

    def test_invalid_date_range_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        resp = self._post(date_from="2026-08-31", date_to="2026-08-01")
        self.assertEqual(resp.status_code, 400)

    def test_one_sided_date_range_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        resp = self._post(date_from="2026-08-01")
        self.assertEqual(resp.status_code, 400)

    def test_invalid_history_role_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        resp = self._post(history=[{"role": "system", "content": "hi"}])
        self.assertEqual(resp.status_code, 400)

    def test_history_missing_content_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        resp = self._post(history=[{"role": "user"}])
        self.assertEqual(resp.status_code, 400)

    def test_too_many_history_turns_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        history = [{"role": "user", "content": "hi"} for _ in range(21)]
        resp = self._post(history=history)
        self.assertEqual(resp.status_code, 400)

    def test_oversized_message_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        resp = self._post(message="x" * 2001)
        self.assertEqual(resp.status_code, 400)

    # ---- AI provider error handling ----
    @patch("finora.views.generate_finora_reply")
    def test_provider_failure_returns_safe_generic_message(self, mock_generate):
        mock_generate.side_effect = FinoraProviderUnavailable("network_error")
        self.client.force_authenticate(user=self.user)

        resp = self._post(date_from=self.date_from, date_to=self.date_to)

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["status"], "unavailable")
        self.assertNotIn("network_error", str(resp.data))
        self.assertNotIn("Traceback", str(resp.data))

    def test_history_is_passed_through_but_never_persisted(self):
        # No conversation model exists in this app - if history were
        # being persisted, this import would fail, which is itself part
        # of the assertion.
        from django.apps import apps

        model_names = {m.__name__ for m in apps.get_app_config("finora").get_models()}
        self.assertEqual(model_names, set())


class GeminiProviderTests(TestCase):
    """
    Focused tests for the Gemini provider implementation itself,
    independent of the view layer.
    """

    def test_missing_api_key_raises_provider_unavailable(self):
        with self.settings(GEMINI_API_KEY=""):
            provider = GeminiProvider()
            with self.assertRaises(FinoraProviderUnavailable):
                provider.generate_reply(context={"currency": "USD"}, message="hi", history=[])

    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_network_error_raises_provider_unavailable(self, mock_urlopen):
        import urllib.error

        mock_urlopen.side_effect = urllib.error.URLError("boom")
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            with self.assertRaises(FinoraProviderUnavailable):
                provider.generate_reply(context={"currency": "USD"}, message="hi", history=[])

    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_malformed_response_raises_provider_unavailable(self, mock_urlopen):
        import io

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return b'{"unexpected": "shape"}'

        mock_urlopen.return_value = FakeResponse()
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            with self.assertRaises(FinoraProviderUnavailable):
                provider.generate_reply(context={"currency": "USD"}, message="hi", history=[])

    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_successful_response_returns_text(self, mock_urlopen):
        import json

        body = json.dumps(
            {"candidates": [{"content": {"parts": [{"text": "Here's how you're doing."}]}}]}
        ).encode("utf-8")

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return body

        mock_urlopen.return_value = FakeResponse()
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            reply = provider.generate_reply(
                context={"currency": "USD"},
                message="hi",
                history=[{"role": "assistant", "content": "Hello!"}],
            )
        self.assertEqual(reply, "Here's how you're doing.")

    # ---- multilingual: system prompt + message payload integrity ----
    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_hindi_message_forwarded_verbatim_and_prompt_requests_mirroring(
        self, mock_urlopen
    ):
        import json as json_module

        captured_requests = []

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json_module.dumps(
                    {"candidates": [{"content": {"parts": [{"text": "ठीक है।"}]}}]}
                ).encode("utf-8")

        def fake_urlopen(request, timeout=None):
            captured_requests.append(request)
            return FakeResponse()

        mock_urlopen.side_effect = fake_urlopen

        hindi_message = "मेरा खर्च ज्यादा क्यों है?"
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            reply = provider.generate_reply(
                context={"currency": "INR"}, message=hindi_message, history=[]
            )

        self.assertEqual(reply, "ठीक है।")
        sent_payload = json_module.loads(captured_requests[0].data.decode("utf-8"))
        # The user's message must reach Gemini exactly as typed - Finora
        # itself never translates or rewrites it.
        self.assertEqual(sent_payload["contents"][-1]["parts"][0]["text"], hindi_message)
        # The system prompt must instruct Gemini to mirror the user's
        # language/style rather than always answering in English.
        system_text = sent_payload["system_instruction"]["parts"][0]["text"]
        self.assertIn("Hindi", system_text)
        self.assertIn("Hinglish", system_text)

    # ---- classification / extraction (finora.providers.gemini) ----
    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_classify_scenario_detects_normal_question(self, mock_urlopen):
        import json as json_module

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json_module.dumps(
                    {
                        "candidates": [
                            {"content": {"parts": [{"text": '{"is_what_if": false}'}]}}
                        ]
                    }
                ).encode("utf-8")

        mock_urlopen.return_value = FakeResponse()
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            result = provider.classify_scenario(message="How am I doing?", history=[])

        self.assertEqual(result, {"is_what_if": False})

    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_classify_scenario_extracts_supported_structure(self, mock_urlopen):
        import json as json_module

        raw = (
            '{"is_what_if": true, "scenario_type": "reduce_category_spending", '
            '"params": {"category": "Food", "percent": 20, "amount": null}}'
        )

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json_module.dumps(
                    {"candidates": [{"content": {"parts": [{"text": raw}]}}]}
                ).encode("utf-8")

        mock_urlopen.return_value = FakeResponse()
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            result = provider.classify_scenario(
                message="What if I reduce food by 20%?", history=[]
            )

        self.assertTrue(result["is_what_if"])
        self.assertEqual(result["scenario_type"], "reduce_category_spending")
        self.assertEqual(result["params"]["category"], "Food")
        self.assertEqual(result["params"]["percent"], 20)

    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_classify_scenario_strips_markdown_fences(self, mock_urlopen):
        import json as json_module

        raw = '```json\n{"is_what_if": false}\n```'

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json_module.dumps(
                    {"candidates": [{"content": {"parts": [{"text": raw}]}}]}
                ).encode("utf-8")

        mock_urlopen.return_value = FakeResponse()
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            result = provider.classify_scenario(message="hi", history=[])

        self.assertEqual(result, {"is_what_if": False})

    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_classify_scenario_unrecognised_type_falls_back_to_unsupported(
        self, mock_urlopen
    ):
        import json as json_module

        raw = '{"is_what_if": true, "scenario_type": "buy_a_yacht", "params": {}}'

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json_module.dumps(
                    {"candidates": [{"content": {"parts": [{"text": raw}]}}]}
                ).encode("utf-8")

        mock_urlopen.return_value = FakeResponse()
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            result = provider.classify_scenario(message="what if I buy a yacht", history=[])

        self.assertEqual(result["scenario_type"], "unsupported")

    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_classify_scenario_non_json_raises_provider_unavailable(self, mock_urlopen):
        import json as json_module

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json_module.dumps(
                    {"candidates": [{"content": {"parts": [{"text": "not json at all"}]}}]}
                ).encode("utf-8")

        mock_urlopen.return_value = FakeResponse()
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            with self.assertRaises(FinoraProviderUnavailable):
                provider.classify_scenario(message="what if", history=[])

    @patch("finora.providers.gemini.urllib.request.urlopen")
    def test_classify_scenario_missing_key_raises_provider_unavailable(self, mock_urlopen):
        import json as json_module

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

            def read(self):
                return json_module.dumps(
                    {"candidates": [{"content": {"parts": [{"text": '{"foo": "bar"}'}]}}]}
                ).encode("utf-8")

        mock_urlopen.return_value = FakeResponse()
        with self.settings(GEMINI_API_KEY="fake-key"):
            provider = GeminiProvider()
            with self.assertRaises(FinoraProviderUnavailable):
                provider.classify_scenario(message="what if", history=[])


class WhatIfEngineTests(TestCase):
    """
    Pure unit tests for finora/whatif.py - no mocking, no AI involved.
    These pin down the actual arithmetic so it can never silently drift.
    """

    def setUp(self):
        self.context = {
            "currency": "USD",
            "period_summary": {
                "income": {"total": 2000.0},
                "expenses": {
                    "total": 1500.0,
                    "by_category": [
                        {"category": "Food", "total": 400.0},
                        {"category": "Shopping", "total": 300.0},
                    ],
                },
                "net_savings": 500.0,
                "savings_rate_percent": 25.0,
                "budgets": [
                    {"category": "Food", "limit": 450.0, "spent": 400.0},
                ],
            },
            "savings_goals": {
                "active": [
                    {
                        "name": "New Laptop",
                        "target_amount": 1000.0,
                        "current_amount": 200.0,
                        "target_date": "2027-01-01",
                    },
                    {
                        "name": "Already Done",
                        "target_amount": 100.0,
                        "current_amount": 150.0,
                        "target_date": "2026-01-01",
                    },
                ]
            },
        }

    def test_reduce_category_spending_by_percent(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(
            self.context, "reduce_category_spending", {"category": "Food", "percent": 20}
        )
        self.assertEqual(result["reduction_amount"], 80.0)
        self.assertEqual(result["new_category_spend"], 320.0)
        self.assertEqual(result["new_net_savings"], 580.0)
        self.assertEqual(result["new_expenses_total"], 1420.0)

    def test_reduce_category_spending_by_amount(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(
            self.context, "reduce_category_spending", {"category": "Food", "amount": 100}
        )
        self.assertEqual(result["reduction_amount"], 100.0)
        self.assertEqual(result["new_net_savings"], 600.0)

    def test_reduce_category_spending_unknown_category_raises(self):
        from finora.whatif import WhatIfDataUnavailable, calculate_scenario

        with self.assertRaises(WhatIfDataUnavailable):
            calculate_scenario(
                self.context,
                "reduce_category_spending",
                {"category": "Travel", "percent": 10},
            )

    def test_increase_savings(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(self.context, "increase_savings", {"amount": 300})
        self.assertEqual(result["new_net_savings"], 800.0)
        self.assertEqual(result["projected_extra_after_12_months"], 3600.0)

    def test_income_change_increase(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(self.context, "income_change", {"amount": 500})
        self.assertEqual(result["new_income"], 2500.0)
        self.assertEqual(result["new_net_savings"], 1000.0)

    def test_income_change_decrease(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(self.context, "income_change", {"amount": -500})
        self.assertEqual(result["new_income"], 1500.0)
        self.assertEqual(result["new_net_savings"], 0.0)

    def test_goal_timeline_computes_months(self):
        from finora.whatif import calculate_scenario

        # remaining = 800, monthly pace = 500 (net_savings) -> 2 months
        result = calculate_scenario(
            self.context, "goal_timeline", {"goal_name": "New Laptop"}
        )
        self.assertEqual(result["remaining_amount"], 800.0)
        self.assertEqual(result["months_to_goal"], 2)
        self.assertTrue(result["reachable"])

    def test_goal_timeline_with_extra_contribution_is_faster(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(
            self.context,
            "goal_timeline",
            {"goal_name": "New Laptop", "extra_monthly_amount": 300},
        )
        # monthly pace = 500 + 300 = 800 -> ceil(800/800) = 1 month
        self.assertEqual(result["months_to_goal"], 1)

    def test_goal_timeline_already_reached(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(
            self.context, "goal_timeline", {"goal_name": "Already Done"}
        )
        self.assertTrue(result["already_reached"])

    def test_goal_timeline_unknown_goal_raises(self):
        from finora.whatif import WhatIfDataUnavailable, calculate_scenario

        with self.assertRaises(WhatIfDataUnavailable):
            calculate_scenario(self.context, "goal_timeline", {"goal_name": "Yacht Fund"})

    def test_one_time_expense_within_budget(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(
            self.context, "one_time_expense", {"amount": 30, "category": "Food"}
        )
        self.assertTrue(result["stays_positive"])
        self.assertEqual(result["budget_remaining_before"], 50.0)
        self.assertEqual(result["budget_remaining_after"], 20.0)
        self.assertFalse(result["exceeds_budget"])

    def test_one_time_expense_exceeds_budget(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(
            self.context, "one_time_expense", {"amount": 200, "category": "Food"}
        )
        self.assertTrue(result["exceeds_budget"])

    def test_one_time_expense_without_amount_raises(self):
        from finora.whatif import WhatIfDataUnavailable, calculate_scenario

        with self.assertRaises(WhatIfDataUnavailable):
            calculate_scenario(self.context, "one_time_expense", {"category": "Food"})

    # ---- Task 2.1: validation of impossible/invalid parameters ----

    def test_reduce_category_spending_percent_zero_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context,
                "reduce_category_spending",
                {"category": "Food", "percent": 0},
            )

    def test_reduce_category_spending_percent_negative_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context,
                "reduce_category_spending",
                {"category": "Food", "percent": -10},
            )

    def test_reduce_category_spending_percent_over_100_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context,
                "reduce_category_spending",
                {"category": "Food", "percent": 150},
            )

    def test_reduce_category_spending_percent_exactly_100_allowed(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(
            self.context, "reduce_category_spending", {"category": "Food", "percent": 100}
        )
        self.assertEqual(result["reduction_amount"], 400.0)

    def test_reduce_category_spending_amount_zero_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context, "reduce_category_spending", {"category": "Food", "amount": 0}
            )

    def test_reduce_category_spending_amount_negative_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context, "reduce_category_spending", {"category": "Food", "amount": -50}
            )

    def test_reduce_category_spending_non_numeric_percent_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context,
                "reduce_category_spending",
                {"category": "Food", "percent": "a lot"},
            )

    def test_reduce_category_spending_nan_amount_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context,
                "reduce_category_spending",
                {"category": "Food", "amount": float("nan")},
            )

    def test_reduce_category_spending_infinite_amount_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context,
                "reduce_category_spending",
                {"category": "Food", "amount": float("inf")},
            )

    def test_increase_savings_zero_amount_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(self.context, "increase_savings", {"amount": 0})

    def test_increase_savings_negative_amount_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(self.context, "increase_savings", {"amount": -100})

    def test_one_time_expense_zero_amount_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(self.context, "one_time_expense", {"amount": 0})

    def test_one_time_expense_negative_amount_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(self.context, "one_time_expense", {"amount": -20})

    def test_income_change_that_would_make_income_negative_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        # current income is 2000.0 in the fixture context
        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(self.context, "income_change", {"amount": -3000})

    def test_income_change_that_zeroes_income_exactly_allowed(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(self.context, "income_change", {"amount": -2000})
        self.assertEqual(result["new_income"], 0.0)

    def test_income_change_non_numeric_amount_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(self.context, "income_change", {"amount": "a lot more"})

    def test_income_change_boolean_amount_rejected(self):
        # bool is technically an int subclass in Python; explicitly reject
        # it so a stray `true`/`false` from extraction can't silently be
        # treated as 1/0.
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(self.context, "income_change", {"amount": True})

    def test_goal_timeline_negative_extra_contribution_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context,
                "goal_timeline",
                {"goal_name": "New Laptop", "extra_monthly_amount": -50},
            )

    def test_goal_timeline_extra_contribution_zero_allowed(self):
        from finora.whatif import calculate_scenario

        result = calculate_scenario(
            self.context,
            "goal_timeline",
            {"goal_name": "New Laptop", "extra_monthly_amount": 0},
        )
        self.assertTrue(result["reachable"])

    def test_goal_timeline_non_finite_extra_contribution_rejected(self):
        from finora.whatif import WhatIfInvalidParameters, calculate_scenario

        with self.assertRaises(WhatIfInvalidParameters):
            calculate_scenario(
                self.context,
                "goal_timeline",
                {"goal_name": "New Laptop", "extra_monthly_amount": float("inf")},
            )

    # ---- Task 2.1: period/monthly semantics ----

    def test_default_style_30_day_period_is_flagged_monthly(self):
        from finora.whatif import calculate_scenario

        context = dict(self.context)
        context["period"] = {"from": "2026-08-01", "to": "2026-08-30"}  # 30 days
        result = calculate_scenario(context, "increase_savings", {"amount": 100})
        self.assertTrue(result["period_is_monthly"])
        self.assertEqual(result["period_days"], 30)

    def test_non_monthly_period_is_not_flagged_monthly(self):
        from finora.whatif import calculate_scenario

        context = dict(self.context)
        context["period"] = {"from": "2026-08-01", "to": "2026-08-07"}  # 1 week
        result = calculate_scenario(context, "increase_savings", {"amount": 100})
        self.assertFalse(result["period_is_monthly"])
        self.assertEqual(result["period_days"], 7)

    def test_quarter_long_period_is_not_flagged_monthly(self):
        from finora.whatif import calculate_scenario

        context = dict(self.context)
        context["period"] = {"from": "2026-01-01", "to": "2026-03-31"}  # ~90 days
        result = calculate_scenario(
            context, "goal_timeline", {"goal_name": "New Laptop"}
        )
        self.assertFalse(result["period_is_monthly"])

    def test_missing_period_does_not_crash_and_reports_unknown(self):
        from finora.whatif import calculate_scenario

        context = dict(self.context)
        context.pop("period", None)
        result = calculate_scenario(context, "increase_savings", {"amount": 100})
        self.assertIsNone(result["period_days"])
        self.assertFalse(result["period_is_monthly"])


class WhatIfPeriodHelperTests(TestCase):
    """Direct tests of the period-length helpers themselves."""

    def test_period_length_days_with_string_dates(self):
        from finora.whatif import _period_length_days

        context = {"period": {"from": "2026-08-01", "to": "2026-08-31"}}
        self.assertEqual(_period_length_days(context), 31)

    def test_period_length_days_with_date_objects(self):
        from finora.whatif import _period_length_days

        context = {
            "period": {
                "from": datetime.date(2026, 8, 1),
                "to": datetime.date(2026, 8, 31),
            }
        }
        self.assertEqual(_period_length_days(context), 31)

    def test_period_length_days_missing_returns_none(self):
        from finora.whatif import _period_length_days

        self.assertIsNone(_period_length_days({}))

    def test_period_length_days_unparseable_returns_none(self):
        from finora.whatif import _period_length_days

        context = {"period": {"from": "not-a-date", "to": "2026-08-31"}}
        self.assertIsNone(_period_length_days(context))

    def test_is_monthly_period_boundaries(self):
        from finora.whatif import _is_monthly_period

        self.assertTrue(
            _is_monthly_period({"period": {"from": "2026-08-01", "to": "2026-08-28"}})
        )
        self.assertTrue(
            _is_monthly_period({"period": {"from": "2026-08-01", "to": "2026-08-31"}})
        )
        self.assertFalse(
            _is_monthly_period({"period": {"from": "2026-08-01", "to": "2026-08-27"}})
        )
        self.assertFalse(
            _is_monthly_period({"period": {"from": "2026-08-01", "to": "2026-09-02"}})
        )


class FinoraServiceOrchestrationTests(TestCase):
    """
    Tests finora/services.py's orchestration of classify -> calculate ->
    final reply, mocking only the provider boundary (never the
    deterministic calculator).
    """

    def setUp(self):
        self.user = User.objects.create_user(username="orchestration_user", password="pw12345")
        self.user.profile.currency = "USD"
        self.user.profile.save(update_fields=["currency"])

        self.today = datetime.date(2026, 8, 15)
        Income.objects.create(
            user=self.user, source="Salary", amount="2000.00", date=self.today
        )
        Expense.objects.create(
            user=self.user, title="Groceries", amount="400.00",
            category="Food", date=self.today,
        )
        SavingsGoal.objects.create(
            user=self.user, goal_name="New Laptop", target_amount="1000.00",
            current_amount="200.00", target_date=datetime.date(2027, 1, 1),
        )

        self.context, _ = build_finora_context(
            user=self.user,
            date_from=datetime.date(2026, 8, 1),
            date_to=datetime.date(2026, 8, 31),
        )

    @patch("finora.services.GroqProvider")
    def test_normal_question_produces_no_scenario(self, mock_provider_cls):
        provider = mock_provider_cls.return_value
        provider.classify_scenario.return_value = {"is_what_if": False}
        provider.generate_reply.return_value = "You're doing fine this month."

        from finora.services import generate_finora_reply

        reply, scenario = generate_finora_reply(
            context=self.context, message="How am I doing?", history=[]
        )

        self.assertEqual(reply, "You're doing fine this month.")
        self.assertIsNone(scenario)
        provider.generate_reply.assert_called_once()
        self.assertIsNone(provider.generate_reply.call_args.kwargs["scenario_result"])

    @patch("finora.services.GroqProvider")
    def test_supported_what_if_computes_deterministic_result(self, mock_provider_cls):
        provider = mock_provider_cls.return_value
        provider.classify_scenario.return_value = {
            "is_what_if": True,
            "scenario_type": "reduce_category_spending",
            "params": {"category": "Food", "percent": 20, "amount": None},
        }
        provider.generate_reply.return_value = "If you cut food by 20%, you'd save more."

        from finora.services import generate_finora_reply

        reply, scenario = generate_finora_reply(
            context=self.context, message="What if I reduce food by 20%?", history=[]
        )

        self.assertEqual(scenario["type"], "reduce_category_spending")
        self.assertNotIn("unavailable_reason", scenario)
        # The scenario passed into the final call must be the same
        # deterministic result, not something Gemini computed itself.
        passed_scenario = provider.generate_reply.call_args.kwargs["scenario_result"]
        self.assertEqual(passed_scenario, scenario)

    @patch("finora.services.GroqProvider")
    def test_unsupported_what_if_marks_unavailable_without_guessing(self, mock_provider_cls):
        provider = mock_provider_cls.return_value
        provider.classify_scenario.return_value = {
            "is_what_if": True,
            "scenario_type": "unsupported",
            "params": {},
        }
        provider.generate_reply.return_value = "I can't calculate that one precisely."

        from finora.services import generate_finora_reply

        reply, scenario = generate_finora_reply(
            context=self.context, message="What if I buy a yacht?", history=[]
        )

        self.assertEqual(scenario["type"], "unsupported")
        self.assertIn("unavailable_reason", scenario)

    @patch("finora.services.GroqProvider")
    def test_what_if_with_missing_data_reports_unavailable(self, mock_provider_cls):
        provider = mock_provider_cls.return_value
        provider.classify_scenario.return_value = {
            "is_what_if": True,
            "scenario_type": "goal_timeline",
            "params": {"goal_name": "Nonexistent Goal"},
        }
        provider.generate_reply.return_value = "I couldn't find that goal."

        from finora.services import generate_finora_reply

        reply, scenario = generate_finora_reply(
            context=self.context, message="When will I reach my yacht goal?", history=[]
        )

        self.assertEqual(scenario["type"], "goal_timeline")
        self.assertIn("unavailable_reason", scenario)

    @patch("finora.services.GroqProvider")
    def test_classification_failure_propagates_as_provider_unavailable(
        self, mock_provider_cls
    ):
        provider = mock_provider_cls.return_value
        provider.classify_scenario.side_effect = FinoraProviderUnavailable("network_error")

        from finora.services import generate_finora_reply

        with self.assertRaises(FinoraProviderUnavailable):
            generate_finora_reply(context=self.context, message="What if?", history=[])

        provider.generate_reply.assert_not_called()

    @patch("finora.services.GroqProvider")
    def test_final_reply_failure_propagates_as_provider_unavailable(self, mock_provider_cls):
        provider = mock_provider_cls.return_value
        provider.classify_scenario.return_value = {"is_what_if": False}
        provider.generate_reply.side_effect = FinoraProviderUnavailable("bad_response")

        from finora.services import generate_finora_reply

        with self.assertRaises(FinoraProviderUnavailable):
            generate_finora_reply(context=self.context, message="How am I doing?", history=[])

    @patch("finora.services.GroqProvider")
    def test_follow_up_history_is_forwarded_to_both_provider_calls(self, mock_provider_cls):
        provider = mock_provider_cls.return_value
        provider.classify_scenario.return_value = {"is_what_if": False}
        provider.generate_reply.return_value = "ok"

        history = [
            {"role": "user", "content": "Why is my food spending so high?"},
            {"role": "assistant", "content": "Food is 30% of your spending this month."},
        ]

        from finora.services import generate_finora_reply

        generate_finora_reply(
            context=self.context, message="What if I reduce it by 20%?", history=history
        )

        self.assertEqual(provider.classify_scenario.call_args.kwargs["history"], history)
        self.assertEqual(provider.generate_reply.call_args.kwargs["history"], history)

    @patch("finora.services.GroqProvider")
    def test_what_if_scenario_never_writes_to_the_database(self, mock_provider_cls):
        provider = mock_provider_cls.return_value
        provider.classify_scenario.return_value = {
            "is_what_if": True,
            "scenario_type": "reduce_category_spending",
            "params": {"category": "Food", "percent": 50, "amount": None},
        }
        provider.generate_reply.return_value = "Here's what that would look like."

        expense_count_before = Expense.objects.count()
        income_count_before = Income.objects.count()
        goal = SavingsGoal.objects.get(goal_name="New Laptop")
        goal_amount_before = goal.current_amount
        budget_count_before = Budget.objects.count()

        from finora.services import generate_finora_reply

        generate_finora_reply(
            context=self.context,
            message="What if I cut food spending in half?",
            history=[],
        )

        self.assertEqual(Expense.objects.count(), expense_count_before)
        self.assertEqual(Income.objects.count(), income_count_before)
        self.assertEqual(Budget.objects.count(), budget_count_before)
        goal.refresh_from_db()
        self.assertEqual(goal.current_amount, goal_amount_before)


class FinoraChatWhatIfEndpointTests(TestCase):
    """
    View-level tests confirming the scenario field is surfaced correctly
    and that insufficient-data periods are handled honestly.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="whatif_endpoint_user", password="pw12345")
        self.user.profile.currency = "USD"
        self.user.profile.save(update_fields=["currency"])
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _post(self, message="hi", history=None, **extra):
        payload = {"message": message}
        if history is not None:
            payload["history"] = history
        payload.update(extra)
        return self.client.post("/api/v1/finora/chat/", payload, format="json")

    @patch("finora.views.generate_finora_reply")
    def test_what_if_scenario_result_included_in_response(self, mock_generate):
        scenario = {
            "type": "increase_savings",
            "currency": "USD",
            "extra_monthly_amount": 300.0,
            "new_net_savings": 800.0,
        }
        mock_generate.return_value = ("If you save $300 more, you'd have $800 net.", scenario)

        resp = self._post(message="What if I save 300 more every month?")

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["scenario"], scenario)

    @patch("finora.views.generate_finora_reply")
    def test_normal_message_has_null_scenario_field(self, mock_generate):
        mock_generate.return_value = ("You're spending mostly on food.", None)

        resp = self._post(message="Why is my food spending high?")

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertIsNone(resp.data["scenario"])

    @patch("finora.views.generate_finora_reply")
    def test_insufficient_data_period_still_returns_honest_response(self, mock_generate):
        # No income/expense data exists for this user at all - has_activity
        # should be False, and the endpoint must not error out or fabricate
        # activity.
        mock_generate.return_value = (
            "I don't see any transactions yet for this period.", None
        )

        resp = self._post(
            message="How am I doing?",
            date_from="2020-01-01",
            date_to="2020-01-31",
        )

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertFalse(resp.data["has_activity"])

    @patch("finora.views.generate_finora_reply")
    def test_multilingual_hinglish_message_is_accepted_and_echoed_through(
        self, mock_generate
    ):
        captured = {}

        def fake_generate(*, context, message, history):
            captured["message"] = message
            return "Aapka food spending thoda zyada hai is mahine.", None

        mock_generate.side_effect = fake_generate

        resp = self._post(message="mera food spending kyun zyada hai is mahine?")

        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(captured["message"], "mera food spending kyun zyada hai is mahine?")
        self.assertIn("mahine", resp.data["reply"])
