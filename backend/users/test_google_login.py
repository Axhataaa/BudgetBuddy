from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


@override_settings(GOOGLE_CLIENT_ID="test-google-client-id")
class GoogleLoginViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("users.views.authenticate_google_credential")
    def test_google_login_creates_user_and_returns_jwt(self, mock_auth):
        mock_auth.return_value = ("newgoogle@example.com", "Google", "User")

        response = self.client.post(
            "/api/v1/users/google-login/",
            {"credential": "fake-token", "mode": "register"},
            format="json"
        )

        print("GOOGLE LOGIN RESPONSE:", response.status_code, response.data)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_new_user"])
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        user = User.objects.get(email="newgoogle@example.com")
        self.assertEqual(user.first_name, "Google")
        self.assertTrue(user.profile.email_verified)
        self.assertFalse(user.has_usable_password())

    @patch("users.views.authenticate_google_credential")
    def test_google_login_reuses_existing_user(self, mock_auth):
        user = User.objects.create_user(username="existing", email="existing@example.com", password="Password123!")
        mock_auth.return_value = ("existing@example.com", "Updated", "Name")

        response = self.client.post(
            "/api/v1/users/google-login/",
            {"credential": "fake-token", "mode": "login"},
            format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_new_user"])
        user.refresh_from_db()
        self.assertEqual(user.first_name, "Updated")
        self.assertEqual(User.objects.filter(email="existing@example.com").count(), 1)

    @patch("users.views.authenticate_google_credential")
    def test_google_login_rejects_invalid_google_credential(self, mock_auth):
        from users.google_auth import GoogleAuthenticationError

        mock_auth.side_effect = GoogleAuthenticationError("Invalid Google credential.")
        response = self.client.post("/api/v1/users/google-login/", {"credential": "bad-token"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"]["code"], "google_authentication_failed")
