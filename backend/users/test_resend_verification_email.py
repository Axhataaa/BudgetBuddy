"""
Tests for the user-initiated verification flow:
  POST /api/users/resend-verification/  (ResendVerificationEmailView)
  POST /api/users/verify-email/         (VerifyEmailView)

These cover:
  - an authenticated user can request a verification email for themselves
  - an unauthenticated request is rejected
  - Resend/email-layer failures don't crash the request (existing
    send_verification_email graceful-degradation behavior is reused)
  - the existing token verification endpoint still works end-to-end

Place at users/tests/test_resend_verification_email.py in the real project.
"""
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from io import BytesIO

from django.contrib.auth.models import User
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from users.email_verification_service import generate_verification_token


class ResendVerificationEmailAuthenticatedTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="verifyme",
            email="verifyme@example.com",
            password="S0meStr0ngPassw0rd!",
        )
        self.url = reverse("resend-verification")

    @patch("users.views.send_verification_email")
    @patch("users.views.generate_verification_token", return_value="raw-token-123")
    def test_authenticated_user_can_request_verification_email(
        self, mock_generate_token, mock_send_email
    ):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url)

        self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        mock_generate_token.assert_called_once_with(self.user)
        mock_send_email.assert_called_once_with(self.user, "raw-token-123")

        # Token must never be exposed back to the client.
        self.assertNotIn("raw-token-123", str(response.data))
        self.assertNotIn("token", response.data)

    @patch("users.views.send_verification_email")
    @patch("users.views.generate_verification_token", return_value="raw-token-456")
    def test_already_verified_user_does_not_trigger_another_send(
        self, mock_generate_token, mock_send_email
    ):
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])

        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_generate_token.assert_not_called()
        mock_send_email.assert_not_called()


class ResendVerificationEmailUnauthenticatedTests(APITestCase):
    def test_unauthenticated_request_is_rejected(self):
        url = reverse("resend-verification")
        response = self.client.post(url)

        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )


@override_settings(
    EMAIL_BACKEND="users.email_backends.ResendEmailBackend",
    RESEND_API_KEY="test-key",
    EMAIL_TIMEOUT=5,
)
class ResendVerificationEmailFailureHandlingTests(APITestCase):
    """
    send_verification_email() already swallows and logs backend exceptions
    (see email_verification_service.send_verification_email). These tests
    confirm the authenticated resend endpoint stays safe through the real
    send path when the Resend HTTP call fails in various ways.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="resenduser",
            email="resenduser@example.com",
            password="S0meStr0ngPassw0rd!",
        )
        self.url = reverse("resend-verification")
        self.client.force_authenticate(user=self.user)

    @patch("users.email_backends.urllib_request.urlopen")
    def test_resend_survives_timeout(self, mock_urlopen):
        mock_urlopen.side_effect = URLError("Resend unreachable (simulated)")
        response = self.client.post(self.url)
        self.assertIn(
            response.status_code,
            (status.HTTP_200_OK, status.HTTP_201_CREATED),
            msg=f"Got {response.status_code}: {response.data}",
        )

    @patch("users.email_backends.urllib_request.urlopen")
    def test_resend_survives_http_422(self, mock_urlopen):
        mock_urlopen.side_effect = HTTPError(
            url="https://api.resend.com/emails",
            code=422,
            msg="Unprocessable",
            hdrs=None,
            fp=BytesIO(b'{"message": "invalid from address"}'),
        )
        response = self.client.post(self.url)
        self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))

    @patch("users.email_backends.urllib_request.urlopen")
    def test_resend_survives_http_500(self, mock_urlopen):
        mock_urlopen.side_effect = HTTPError(
            url="https://api.resend.com/emails",
            code=500,
            msg="Server Error",
            hdrs=None,
            fp=BytesIO(b"{}"),
        )
        response = self.client.post(self.url)
        self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))


class ExistingVerifyEmailTokenFlowStillWorksTests(APITestCase):
    """
    Guards requirement: the existing token verification endpoint/link must
    keep working unchanged after this feature.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="tokenflow",
            email="tokenflow@example.com",
            password="S0meStr0ngPassw0rd!",
        )
        self.url = reverse("verify-email")

    def test_valid_token_verifies_email(self):
        raw_token = generate_verification_token(self.user)

        response = self.client.post(self.url, {"token": raw_token}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.email_verified)

    def test_missing_token_returns_400(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_token_returns_400(self):
        response = self.client.post(self.url, {"token": "not-a-real-token"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
