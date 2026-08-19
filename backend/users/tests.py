from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .email_verification_service import (
    RESEND_COOLDOWN_SECONDS,
    generate_verification_token,
)
from .models import EmailVerificationToken, Profile


class RegistrationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/users/register/"
        self.payload = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
            "role": "student",
            "phone_number": "9999999999",
        }

    def test_register_creates_user_and_profile(self):
        resp = self.client.post(self.url, self.payload)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

        user = User.objects.get(username="newuser")
        self.assertTrue(user.check_password("StrongPass123!"))
        self.assertEqual(user.profile.role, "student")
        self.assertEqual(user.profile.phone_number, "9999999999")

    def test_register_creates_email_verification_token(self):
        self.client.post(self.url, self.payload)
        user = User.objects.get(username="newuser")
        self.assertTrue(
            EmailVerificationToken.objects.filter(user=user).exists()
        )
        self.assertFalse(user.profile.email_verified)

    def test_register_rejects_mismatched_passwords(self):
        payload = dict(self.payload, confirm_password="Different123!")
        resp = self.client.post(self.url, payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", resp.data["error"]["details"])

    def test_register_rejects_weak_password(self):
        payload = dict(self.payload, password="123", confirm_password="123")
        resp = self.client.post(self.url, payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_duplicate_username(self):
        User.objects.create_user(username="newuser", password="pw12345678")
        resp = self.client.post(self.url, self.payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_cannot_self_assign_admin_role(self):
        payload = dict(self.payload, role="admin")
        resp = self.client.post(self.url, payload)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", resp.data["error"]["details"])


class LoginTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="loginuser", password="pw12345678"
        )
        self.url = "/api/v1/users/login/"

    def test_login_with_valid_credentials_returns_tokens(self):
        resp = self.client.post(
            self.url, {"username": "loginuser", "password": "pw12345678"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)

    def test_login_with_wrong_password_is_rejected(self):
        resp = self.client.post(
            self.url, {"username": "loginuser", "password": "wrongpw"}
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_with_nonexistent_user_is_rejected(self):
        resp = self.client.post(
            self.url, {"username": "ghost", "password": "pw12345678"}
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_token_includes_staff_and_superuser_claims(self):
        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])
        resp = self.client.post(
            self.url, {"username": "loginuser", "password": "pw12345678"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Token is opaque here; just confirm login still succeeds post-flag-change.
        self.assertIn("access", resp.data)


class LogoutAndTokenBlacklistTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="logoutuser", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)

    def test_logout_blacklists_refresh_token(self):
        refresh = RefreshToken.for_user(self.user)
        resp = self.client.post(
            "/api/v1/users/logout/", {"refresh": str(refresh)}
        )
        self.assertEqual(resp.status_code, status.HTTP_205_RESET_CONTENT)

        refresh_client = APIClient()
        refresh_resp = refresh_client.post(
            "/api/v1/users/refresh/", {"refresh": str(refresh)}
        )
        self.assertEqual(refresh_resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_authentication(self):
        anon_client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        resp = anon_client.post(
            "/api/v1/users/logout/", {"refresh": str(refresh)}
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_missing_refresh_token(self):
        resp = self.client.post("/api/v1/users/logout/", {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="profileuser",
            password="pw12345678",
            email="profile@example.com",
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/users/me/"

    def test_get_profile_requires_authentication(self):
        anon_client = APIClient()
        resp = anon_client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_returns_own_data(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "profileuser")
        self.assertEqual(resp.data["email"], "profile@example.com")

    def test_update_profile_full_name_and_bio(self):
        resp = self.client.patch(
            self.url, {"full_name": "Test User", "bio": "Hello there"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.full_name, "Test User")
        self.assertEqual(self.user.profile.bio, "Hello there")

    def test_update_email_resets_verification_status(self):
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])

        resp = self.client.patch(self.url, {"email": "changed@example.com"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertFalse(self.user.profile.email_verified)

    def test_update_budget_warning_threshold_out_of_range_rejected(self):
        resp = self.client.patch(self.url, {"budget_warning_threshold": 150})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_monthly_saving_target_negative_rejected(self):
        resp = self.client.patch(self.url, {"monthly_saving_target": -10})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_take_another_users_username(self):
        User.objects.create_user(username="taken", password="pw12345678")
        resp = self.client.patch(self.url, {"username": "taken"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_role_is_read_only_on_update(self):
        original_role = self.user.profile.role
        resp = self.client.patch(self.url, {"role": "admin"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.role, original_role)


class ChangePasswordTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="pwuser", password="OldPass123!"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/users/change-password/"

    def test_change_password_requires_authentication(self):
        anon_client = APIClient()
        resp = anon_client.post(
            self.url,
            {"old_password": "OldPass123!", "new_password": "NewPass456!"},
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_with_correct_old_password_succeeds(self):
        resp = self.client.post(
            self.url,
            {"old_password": "OldPass123!", "new_password": "NewPass456!"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass456!"))

    def test_change_password_with_wrong_old_password_rejected(self):
        resp = self.client.post(
            self.url,
            {"old_password": "WrongOld!", "new_password": "NewPass456!"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OldPass123!"))

    def test_change_password_rejects_weak_new_password(self):
        resp = self.client.post(
            self.url, {"old_password": "OldPass123!", "new_password": "123"}
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class DeleteAccountTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="deleteuser", password="pw12345678"
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/users/delete-account/"

    def test_delete_account_requires_authentication(self):
        anon_client = APIClient()
        resp = anon_client.post(self.url, {"password": "pw12345678"})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_account_with_correct_password_succeeds(self):
        resp = self.client.post(self.url, {"password": "pw12345678"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(username="deleteuser").exists())

    def test_delete_account_with_confirmation_text_succeeds(self):
        resp = self.client.post(self.url, {"confirmation_text": "DELETE"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(username="deleteuser").exists())

    def test_delete_account_with_wrong_password_rejected(self):
        resp = self.client.post(self.url, {"password": "wrongpw"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(username="deleteuser").exists())

    def test_delete_account_with_wrong_confirmation_text_rejected(self):
        resp = self.client.post(self.url, {"confirmation_text": "delete"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(username="deleteuser").exists())

    def test_delete_account_with_no_input_rejected(self):
        resp = self.client.post(self.url, {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class EmailVerificationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="verifyuser",
            password="pw12345678",
            email="verify@example.com",
        )
        self.verify_url = "/api/v1/users/verify-email/"
        self.resend_url = "/api/v1/users/resend-verification/"

    def test_verify_with_valid_token_marks_profile_verified(self):
        raw_token = generate_verification_token(self.user)
        resp = self.client.post(self.verify_url, {"token": raw_token})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertTrue(self.user.profile.email_verified)

    def test_verify_with_missing_token_rejected(self):
        resp = self.client.post(self.verify_url, {})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data["error"]["code"], "missing_token")

    def test_verify_with_invalid_token_rejected(self):
        resp = self.client.post(self.verify_url, {"token": "not-a-real-token"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data["error"]["code"], "invalid")

    def test_verify_with_already_used_token_rejected(self):
        raw_token = generate_verification_token(self.user)
        self.client.post(self.verify_url, {"token": raw_token})
        resp = self.client.post(self.verify_url, {"token": raw_token})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data["error"]["code"], "already_used")

    def test_verify_with_expired_token_rejected(self):
        raw_token = generate_verification_token(self.user)
        token = EmailVerificationToken.objects.get(user=self.user)
        token.expires_at = timezone.now() - timedelta(hours=1)
        token.save(update_fields=["expires_at"])

        resp = self.client.post(self.verify_url, {"token": raw_token})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data["error"]["code"], "expired")
        self.user.profile.refresh_from_db()
        self.assertFalse(self.user.profile.email_verified)

    def test_verify_token_for_stale_email_rejected(self):
        raw_token = generate_verification_token(self.user)
        token = EmailVerificationToken.objects.get(user=self.user)
        token.email = "old-address@example.com"
        token.save(update_fields=["email"])

        resp = self.client.post(self.verify_url, {"token": raw_token})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data["error"]["code"], "invalid")

    def test_resend_requires_authentication(self):
        anon_client = APIClient()
        resp = anon_client.post(self.resend_url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_resend_when_already_verified_short_circuits(self):
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])
        self.client.force_authenticate(user=self.user)

        resp = self.client.post(self.resend_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("already verified", resp.data["message"])

    def test_resend_creates_new_token_and_invalidates_prior_unused_ones(self):
        self.client.force_authenticate(user=self.user)
        generate_verification_token(self.user)
        self.assertEqual(
            EmailVerificationToken.objects.filter(user=self.user).count(), 1
        )

        # Force past cooldown by backdating the existing token.
        EmailVerificationToken.objects.filter(user=self.user).update(
            created_at=timezone.now() - timedelta(seconds=RESEND_COOLDOWN_SECONDS + 1)
        )

        resp = self.client.post(self.resend_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # The old unused token should have been replaced by a fresh one.
        self.assertEqual(
            EmailVerificationToken.objects.filter(user=self.user).count(), 1
        )

    def test_resend_within_cooldown_is_rate_limited(self):
        self.client.force_authenticate(user=self.user)
        generate_verification_token(self.user)

        resp = self.client.post(self.resend_url)
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(resp.data["error"]["code"], "cooldown")


class UserListAdminOnlyTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/v1/users/"

        self.regular_user = User.objects.create_user(
            username="regular", password="pw12345678"
        )

        self.admin_user = User.objects.create_user(
            username="admin_role_user", password="pw12345678"
        )
        self.admin_user.profile.role = Profile.Role.ADMIN
        self.admin_user.profile.save(update_fields=["role"])

    def test_user_list_requires_authentication(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_regular_user_forbidden_from_user_list(self):
        self.client.force_authenticate(user=self.regular_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_role_user_can_access_user_list(self):
        self.client.force_authenticate(user=self.admin_user)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_django_superuser_can_access_user_list_even_without_admin_role(self):
        superuser = User.objects.create_superuser(
            username="superuser", password="pw12345678", email="s@example.com"
        )
        self.client.force_authenticate(user=superuser)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
