"""
Tests for users.email_backends.ResendEmailBackend.

All Resend API calls are mocked via unittest.mock.patch on
urllib.request.urlopen -- these tests must never make a real network
call. Drop this file at users/tests/test_email_backends.py (create
users/tests/__init__.py if your test suite doesn't already have one).
"""
import json
from io import BytesIO
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError, URLError

from django.core.mail import EmailMultiAlternatives
from django.test import TestCase, override_settings

from users.email_backends import ResendEmailBackend


def _message(html=True):
    msg = EmailMultiAlternatives(
        subject="Verify your email - BudgetBuddy",
        body="Plain text body",
        from_email="BudgetBuddy <no-reply@budgetbuddy.app>",
        to=["someone@example.com"],
    )
    if html:
        msg.attach_alternative("<p>Plain text body</p>", "text/html")
    return msg


class ResendEmailBackendTests(TestCase):
    @override_settings(RESEND_API_KEY="test-key", EMAIL_TIMEOUT=5)
    @patch("users.email_backends.urllib_request.urlopen")
    def test_send_success_builds_expected_payload(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"id": "abc123"}'
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        backend = ResendEmailBackend()
        sent = backend.send_messages([_message()])

        self.assertEqual(sent, 1)
        request_obj = mock_urlopen.call_args[0][0]
        self.assertEqual(request_obj.full_url, "https://api.resend.com/emails")
        self.assertEqual(
            request_obj.get_header("Authorization"), "Bearer test-key"
        )
        payload = json.loads(request_obj.data.decode("utf-8"))
        self.assertEqual(payload["to"], ["someone@example.com"])
        self.assertEqual(payload["subject"], "Verify your email - BudgetBuddy")
        self.assertIn("html", payload)
        self.assertEqual(mock_urlopen.call_args.kwargs.get("timeout"), 5)

    @override_settings(RESEND_API_KEY="", EMAIL_TIMEOUT=5)
    def test_missing_api_key_raises_when_not_fail_silently(self):
        backend = ResendEmailBackend(fail_silently=False)
        with self.assertRaises(ValueError):
            backend.send_messages([_message()])

    @override_settings(RESEND_API_KEY="", EMAIL_TIMEOUT=5)
    def test_missing_api_key_swallowed_when_fail_silently(self):
        backend = ResendEmailBackend(fail_silently=True)
        sent = backend.send_messages([_message()])
        self.assertEqual(sent, 0)

    @override_settings(RESEND_API_KEY="test-key", EMAIL_TIMEOUT=5)
    @patch("users.email_backends.urllib_request.urlopen")
    def test_http_error_raises_when_not_fail_silently(self, mock_urlopen):
        mock_urlopen.side_effect = HTTPError(
            url="https://api.resend.com/emails",
            code=422,
            msg="Unprocessable",
            hdrs=None,
            fp=BytesIO(b'{"message": "invalid from address"}'),
        )
        backend = ResendEmailBackend(fail_silently=False)
        with self.assertRaises(RuntimeError):
            backend.send_messages([_message()])

    @override_settings(RESEND_API_KEY="test-key", EMAIL_TIMEOUT=5)
    @patch("users.email_backends.urllib_request.urlopen")
    def test_http_error_swallowed_when_fail_silently(self, mock_urlopen):
        mock_urlopen.side_effect = HTTPError(
            url="https://api.resend.com/emails",
            code=500,
            msg="Server Error",
            hdrs=None,
            fp=BytesIO(b"{}"),
        )
        backend = ResendEmailBackend(fail_silently=True)
        sent = backend.send_messages([_message()])
        self.assertEqual(sent, 0)

    @override_settings(RESEND_API_KEY="test-key", EMAIL_TIMEOUT=5)
    @patch("users.email_backends.urllib_request.urlopen")
    def test_network_timeout_raises_runtime_error(self, mock_urlopen):
        mock_urlopen.side_effect = URLError("timed out")
        backend = ResendEmailBackend(fail_silently=False)
        with self.assertRaises(RuntimeError):
            backend.send_messages([_message()])

    def test_send_verification_email_does_not_raise_on_backend_failure(self):
        """
        End-to-end guard for requirement #9: even if the configured
        email backend fails outright, send_verification_email must not
        propagate the exception (registration should not 500).
        """
        from users.email_verification_service import send_verification_email

        class ExplodingUser:
            id = 1
            email = "someone@example.com"

        with override_settings(
            EMAIL_BACKEND="users.email_backends.ResendEmailBackend",
            RESEND_API_KEY="test-key",
            EMAIL_TIMEOUT=5,
        ):
            with patch(
                "users.email_backends.urllib_request.urlopen",
                side_effect=URLError("timed out"),
            ):
                try:
                    send_verification_email(ExplodingUser(), "fake-raw-token")
                except Exception as exc:  # pragma: no cover - failure path
                    self.fail(
                        f"send_verification_email must not raise, got: {exc!r}"
                    )
