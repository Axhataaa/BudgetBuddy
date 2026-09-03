from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification

# Changing the email address also unconditionally triggers the existing,
# preference-independent "verify your new email" transactional flow
# (users/email_verification_service.py). That is a separate, pre-existing
# mandatory email and must not be conflated with the new preference-gated
# "Email Address Changed" Important Notification email under test here, so
# it is mocked out in the tests that assert on mail.outbox counts/content.
_PATCH_TOKEN = patch(
    "users.serializers.generate_verification_token", return_value="raw-verify-token"
)
_PATCH_SEND = patch("users.serializers.send_verification_email")


class EmailChangedNotificationTests(APITestCase):
    """
    Covers the new "Email Address Changed" Important Notification: created
    on a successful email address change via ProfileView (PATCH /users/me/),
    following the exact same pattern as the existing "Password Changed"
    Important Notification.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="emailchange_tester",
            email="old_address@example.com",
            password="Str0ngPassw0rd!",
        )
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])
        self.url = "/api/v1/users/me/"
        self.client.force_authenticate(user=self.user)

    def _change_email(self, new_email):
        return self.client.patch(self.url, {"email": new_email}, format="json")

    # ---------------------------------------------------------------
    # 1: successful email change creates the notification correctly
    # ---------------------------------------------------------------

    def test_successful_email_change_creates_one_admin_notification(self):
        resp = self._change_email("new_address@example.com")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "new_address@example.com")

        notifications = Notification.objects.filter(
            user=self.user, notification_type=Notification.NotificationType.ADMIN
        )
        self.assertEqual(notifications.count(), 1)

        notification = notifications.first()
        self.assertEqual(notification.title, "Email Address Changed")
        self.assertEqual(
            notification.message,
            "Your BudgetBuddy email address was changed successfully.",
        )
        self.assertEqual(notification.priority, Notification.Priority.HIGH)
        self.assertEqual(
            notification.notification_type, Notification.NotificationType.ADMIN
        )
        self.assertEqual(notification.action_url, "/settings")
        self.assertIsNone(notification.dedup_key)

        # Never expose the old address in the stored notification content.
        self.assertNotIn("old_address@example.com", notification.message)
        self.assertNotIn("old_address@example.com", notification.title)

    # ---------------------------------------------------------------
    # 2-4: email gating
    # ---------------------------------------------------------------

    @_PATCH_SEND
    @_PATCH_TOKEN
    def test_email_sent_when_important_notifications_enabled(
        self, mock_token, mock_send
    ):
        outbox_before = len(mail.outbox)
        resp = self._change_email("new_address@example.com")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(len(mail.outbox) - outbox_before, 1)

    @_PATCH_SEND
    @_PATCH_TOKEN
    def test_no_email_when_important_notifications_disabled(
        self, mock_token, mock_send
    ):
        self.user.profile.email_important_notifications = False
        self.user.profile.save(update_fields=["email_important_notifications"])

        outbox_before = len(mail.outbox)
        resp = self._change_email("new_address@example.com")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(len(mail.outbox) - outbox_before, 0)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists(),
            "the in-app notification must still be created even without email",
        )

    @_PATCH_SEND
    @_PATCH_TOKEN
    def test_no_email_when_master_switch_disabled(self, mock_token, mock_send):
        self.user.profile.email_notifications = False
        self.user.profile.save(update_fields=["email_notifications"])

        outbox_before = len(mail.outbox)
        resp = self._change_email("new_address@example.com")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(len(mail.outbox) - outbox_before, 0)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists()
        )

    @_PATCH_SEND
    @_PATCH_TOKEN
    def test_email_uses_admin_template_with_dynamic_title_and_message(
        self, mock_token, mock_send
    ):
        resp = self._change_email("new_address@example.com")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertIn("Email Address Changed", sent.subject)

        html_body = next(
            content for content, mimetype in sent.alternatives if mimetype == "text/html"
        )
        self.assertIn("Email Address Changed", html_body)
        self.assertIn(
            "Your BudgetBuddy email address was changed successfully.", html_body
        )
        # admin.html's generic eyebrow label, confirming the existing
        # template (not a new one) rendered this email.
        self.assertIn("Important Notification", html_body)
        # The old address must never appear in the sent email content.
        self.assertNotIn("old_address@example.com", html_body)

    # ---------------------------------------------------------------
    # 5-6: failed/no-op changes must not create a notification or email
    # ---------------------------------------------------------------

    def test_invalid_email_change_creates_no_notification(self):
        other = User.objects.create_user(
            username="other_user",
            email="taken@example.com",
            password="Str0ngPassw0rd!",
        )
        outbox_before = len(mail.outbox)

        resp = self._change_email("taken@example.com")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST, resp.data)

        self.assertFalse(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists()
        )
        self.assertEqual(len(mail.outbox) - outbox_before, 0)

    def test_no_change_when_email_is_unchanged_creates_no_notification(self):
        outbox_before = len(mail.outbox)
        resp = self._change_email("old_address@example.com")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertFalse(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists()
        )
        self.assertEqual(len(mail.outbox) - outbox_before, 0)

    def test_updating_other_profile_fields_does_not_create_notification(self):
        outbox_before = len(mail.outbox)
        resp = self.client.patch(self.url, {"bio": "Hello world"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertFalse(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists()
        )
        self.assertEqual(len(mail.outbox) - outbox_before, 0)

    # ---------------------------------------------------------------
    # 7: two separate successful changes each get their own notification
    # ---------------------------------------------------------------

    @_PATCH_SEND
    @_PATCH_TOKEN
    def test_two_separate_successful_email_changes_each_get_their_own_notification(
        self, mock_token, mock_send
    ):
        resp1 = self._change_email("second_address@example.com")
        self.assertEqual(resp1.status_code, status.HTTP_200_OK, resp1.data)

        # Re-verify so the second change also starts from a verified state,
        # matching the real flow where a user verifies before changing again.
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])

        resp2 = self._change_email("third_address@example.com")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK, resp2.data)

        notifications = Notification.objects.filter(
            user=self.user, notification_type=Notification.NotificationType.ADMIN
        ).order_by("created_at")
        self.assertEqual(notifications.count(), 2)
        self.assertEqual(len(mail.outbox), 2)

    # ---------------------------------------------------------------
    # 8: existing Password Changed behavior is fully preserved
    # ---------------------------------------------------------------

    def test_password_changed_notification_still_works_independently(self):
        resp = self.client.post(
            "/api/v1/users/change-password/",
            {
                "old_password": "Str0ngPassw0rd!",
                "new_password": "NewStr0ngPassw0rd!",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        notifications = Notification.objects.filter(
            user=self.user, notification_type=Notification.NotificationType.ADMIN
        )
        self.assertEqual(notifications.count(), 1)
        self.assertEqual(notifications.first().title, "Password Changed")
