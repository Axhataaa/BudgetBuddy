"""
End-to-end registration test: exercises the real registration endpoint
(RegisterView -> RegisterSerializer.create() -> generate_verification_token
-> send_verification_email -> ResendEmailBackend) with the Resend HTTP call
mocked to fail, and confirms:

  1. The HTTP response is still 2xx (registration is not a 500).
  2. The User and Profile rows are actually persisted in the DB.
  3. No real network call is made (urlopen is patched, never a live request).

Place at users/tests/test_registration_email_failure.py in the real project.
"""
from unittest.mock import patch
from urllib.error import URLError

from django.contrib.auth.models import User
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import Profile


@override_settings(
    EMAIL_BACKEND="users.email_backends.ResendEmailBackend",
    RESEND_API_KEY="test-key",
    EMAIL_TIMEOUT=5,
)
class RegistrationSurvivesEmailBackendFailureTests(APITestCase):
    def _payload(self, **overrides):
        payload = {
            "username": "newuser1",
            "email": "newuser1@example.com",
            "password": "S0meStr0ngPassw0rd!",
            "confirm_password": "S0meStr0ngPassw0rd!",
            "first_name": "New",
            "last_name": "User",
            "role": "student",
            "phone_number": "",
        }
        payload.update(overrides)
        return payload

    @patch("users.email_backends.urllib_request.urlopen")
    def test_registration_returns_2xx_when_resend_is_unreachable(self, mock_urlopen):
        # Simulate Resend being completely unreachable (the failure mode
        # this whole fix targets) -- never a real network call.
        mock_urlopen.side_effect = URLError("Resend unreachable (simulated)")

        url = reverse("register")
        response = self.client.post(url, self._payload(), format="json")

        self.assertIn(
            response.status_code,
            (status.HTTP_200_OK, status.HTTP_201_CREATED),
            msg=f"Registration returned {response.status_code}: {response.data}",
        )

        # The email attempt genuinely happened (proving we exercised the
        # real send path) and it was mocked, not a live call.
        self.assertTrue(mock_urlopen.called)

        user = User.objects.get(username="newuser1")
        self.assertEqual(user.email, "newuser1@example.com")

        profile = Profile.objects.get(user=user)
        self.assertEqual(profile.role, "student")
        self.assertFalse(
            profile.email_verified,
            "Email correctly not verified since the send failed.",
        )

    @patch("users.email_backends.urllib_request.urlopen")
    def test_registration_returns_2xx_when_resend_returns_http_error(self, mock_urlopen):
        from urllib.error import HTTPError
        from io import BytesIO

        mock_urlopen.side_effect = HTTPError(
            url="https://api.resend.com/emails",
            code=422,
            msg="Unprocessable",
            hdrs=None,
            fp=BytesIO(b'{"message": "invalid from address"}'),
        )

        url = reverse("register")
        response = self.client.post(
            url, self._payload(username="newuser2", email="newuser2@example.com"), format="json"
        )

        self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        self.assertTrue(User.objects.filter(username="newuser2").exists())

    @patch("users.email_backends.urllib_request.urlopen")
    def test_registration_succeeds_normally_when_resend_is_up(self, mock_urlopen):
        from unittest.mock import MagicMock

        mock_resp = MagicMock()
        mock_resp.read.return_value = b'{"id": "abc123"}'
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        url = reverse("register")
        response = self.client.post(
            url, self._payload(username="newuser3", email="newuser3@example.com"), format="json"
        )

        self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        self.assertTrue(mock_urlopen.called)
        self.assertTrue(User.objects.filter(username="newuser3").exists())
