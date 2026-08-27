from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient


class EmailIdentityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def registration_payload(self, email, username="user1"):
        return {
            "username": username,
            "email": email,
            "password": "StrongPassword123!",
            "confirm_password": "StrongPassword123!",
            "first_name": "Test",
            "last_name": "User",
        }

    def test_registration_rejects_existing_email_case_insensitively(self):
        User.objects.create_user(
            username="existing",
            email="Existing@Example.com",
            password="StrongPassword123!",
        )

        response = self.client.post(
            "/api/v1/users/register/",
            self.registration_payload(" existing@example.com ", "another"),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data["error"]["details"])
        self.assertEqual(User.objects.filter(email__iexact="existing@example.com").count(), 1)

    def test_email_change_rejects_email_owned_by_another_user(self):
        owner = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="StrongPassword123!",
        )
        other = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="StrongPassword123!",
        )
        self.client.force_authenticate(user=owner)

        response = self.client.patch(
            "/api/v1/users/me/",
            {"email": "OTHER@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data["error"]["details"])
        owner.refresh_from_db()
        self.assertEqual(owner.email, "owner@example.com")
        self.assertEqual(other.email, "other@example.com")

    @patch("users.views.authenticate_google_credential")
    def test_google_login_reuses_existing_normal_account(self, mock_auth):
        user = User.objects.create_user(
            username="normaluser",
            email="normal@example.com",
            password="StrongPassword123!",
        )
        mock_auth.return_value = ("NORMAL@example.com", "Google", "Name")

        response = self.client.post(
            "/api/v1/users/google-login/",
            {"credential": "fake-token", "mode": "login"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_new_user"])
        self.assertEqual(User.objects.count(), 1)
        user.refresh_from_db()
        self.assertEqual(user.first_name, "Google")

    @patch("users.views.authenticate_google_credential")
    def test_google_register_rejects_existing_email(self, mock_auth):
        User.objects.create_user(
            username="normaluser",
            email="normal@example.com",
            password="StrongPassword123!",
        )
        mock_auth.return_value = ("NORMAL@example.com", "Google", "Name")

        response = self.client.post(
            "/api/v1/users/google-login/",
            {"credential": "fake-token", "mode": "register"},
            format="json",
        )

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["error"]["code"], "account_exists")
        self.assertEqual(User.objects.count(), 1)

    def test_old_email_is_reusable_after_successful_email_change(self):
        user = User.objects.create_user(
            username="first",
            email="old@example.com",
            password="StrongPassword123!",
        )
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            "/api/v1/users/me/",
            {"email": "new@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.email, "new@example.com")

        second = User.objects.create_user(
            username="second",
            email="old@example.com",
            password="StrongPassword123!",
        )
        self.assertEqual(second.email, "old@example.com")
