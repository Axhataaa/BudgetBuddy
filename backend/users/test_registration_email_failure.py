"""
Registration must create the User/Profile successfully and must NOT trigger
any verification email as a side effect. Verification is now user-initiated
from Settings/Profile via POST /api/users/resend-verification/
(ResendVerificationEmailView), tested separately in
test_resend_verification_email.py.

Place at users/tests/test_registration_email_failure.py in the real project.
"""
from unittest.mock import patch

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import Profile


class RegistrationDoesNotSendVerificationEmailTests(APITestCase):
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

    @patch("users.serializers.send_verification_email")
    @patch("users.serializers.generate_verification_token")
    def test_registration_does_not_send_verification_email(
        self, mock_generate_token, mock_send_email
    ):
        url = reverse("register")
        response = self.client.post(url, self._payload(), format="json")

        self.assertIn(
            response.status_code,
            (status.HTTP_200_OK, status.HTTP_201_CREATED),
            msg=f"Registration returned {response.status_code}: {response.data}",
        )

        user = User.objects.get(username="newuser1")
        self.assertEqual(user.email, "newuser1@example.com")

        profile = Profile.objects.get(user=user)
        self.assertEqual(profile.role, "student")
        self.assertFalse(
            profile.email_verified,
            "New accounts start unverified; verification is user-initiated.",
        )

        mock_generate_token.assert_not_called()
        mock_send_email.assert_not_called()

    def test_registration_succeeds_with_no_email_side_effects_at_all(self):
        """
        Belt-and-suspenders: registration must succeed even without mocking
        the email layer, proving nothing in the create() path depends on
        email sending anymore (no network access needed for this test).
        """
        url = reverse("register")
        response = self.client.post(
            url,
            self._payload(username="newuser2", email="newuser2@example.com"),
            format="json",
        )

        self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))
        user = User.objects.get(username="newuser2")
        profile = Profile.objects.get(user=user)
        self.assertFalse(profile.email_verified)
