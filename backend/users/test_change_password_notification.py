from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification


class ChangePasswordNotificationTests(APITestCase):
    """
    Covers the new "Password Changed" Important Notification: created on a
    successful, already-authenticated password change via ChangePasswordView.
    Distinct from (and must not affect) the mandatory transactional password
    reset / email verification flows.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="pwchange_tester",
            email="pwchange_tester@example.com",
            password="OldStr0ngPassw0rd!",
        )
        self.user.profile.email_verified = True
        self.user.profile.save(update_fields=["email_verified"])
        self.url = reverse("change-password")
        self.client.force_authenticate(user=self.user)

    def _change_password(self, old_password, new_password):
        return self.client.post(
            self.url,
            {"old_password": old_password, "new_password": new_password},
            format="json",
        )

    # ---------------------------------------------------------------
    # 1: successful password change creates the notification correctly
    # ---------------------------------------------------------------

    def test_successful_password_change_creates_one_admin_notification(self):
        resp = self._change_password("OldStr0ngPassw0rd!", "NewStr0ngPassw0rd!")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        # Password actually changed.
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStr0ngPassw0rd!"))
        self.assertFalse(self.user.check_password("OldStr0ngPassw0rd!"))

        notifications = Notification.objects.filter(
            user=self.user, notification_type=Notification.NotificationType.ADMIN
        )
        self.assertEqual(notifications.count(), 1)

        notification = notifications.first()
        self.assertEqual(notification.title, "Password Changed")
        self.assertEqual(
            notification.message,
            "Your BudgetBuddy password was changed successfully.",
        )
        self.assertEqual(notification.priority, Notification.Priority.HIGH)
        self.assertEqual(
            notification.notification_type, Notification.NotificationType.ADMIN
        )
        # No entity FK applies to an account-level event; the schema doesn't
        # require one (all entity FKs on Notification are nullable).
        self.assertIsNone(notification.expense)
        self.assertIsNone(notification.income)
        self.assertIsNone(notification.budget)
        self.assertIsNone(notification.savings_goal)

    # ---------------------------------------------------------------
    # 2-5: email gating
    # ---------------------------------------------------------------

    def test_email_sent_when_important_notifications_enabled(self):
        outbox_before = len(mail.outbox)
        resp = self._change_password("OldStr0ngPassw0rd!", "NewStr0ngPassw0rd!")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(len(mail.outbox) - outbox_before, 1)

    def test_no_email_when_important_notifications_disabled(self):
        self.user.profile.email_important_notifications = False
        self.user.profile.save(update_fields=["email_important_notifications"])

        outbox_before = len(mail.outbox)
        resp = self._change_password("OldStr0ngPassw0rd!", "NewStr0ngPassw0rd!")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(len(mail.outbox) - outbox_before, 0)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists(),
            "the in-app notification must still be created even without email",
        )

    def test_no_email_when_master_switch_disabled(self):
        self.user.profile.email_notifications = False
        self.user.profile.save(update_fields=["email_notifications"])

        outbox_before = len(mail.outbox)
        resp = self._change_password("OldStr0ngPassw0rd!", "NewStr0ngPassw0rd!")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(len(mail.outbox) - outbox_before, 0)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists()
        )

    def test_no_email_when_email_unverified(self):
        self.user.profile.email_verified = False
        self.user.profile.save(update_fields=["email_verified"])

        outbox_before = len(mail.outbox)
        resp = self._change_password("OldStr0ngPassw0rd!", "NewStr0ngPassw0rd!")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(len(mail.outbox) - outbox_before, 0)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists()
        )

    # ---------------------------------------------------------------
    # 6: correct preference field, correct template, correct content
    # ---------------------------------------------------------------

    def test_email_is_gated_by_important_notifications_field_specifically(self):
        profile = self.user.profile
        profile.budget_alert_notifications = False
        profile.email_savings_goal_notifications = False
        profile.email_monthly_report_notifications = False
        profile.email_achievement_notifications = False
        profile.save(
            update_fields=[
                "budget_alert_notifications",
                "email_savings_goal_notifications",
                "email_monthly_report_notifications",
                "email_achievement_notifications",
            ]
        )

        outbox_before = len(mail.outbox)
        resp = self._change_password("OldStr0ngPassw0rd!", "NewStr0ngPassw0rd!")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(
            len(mail.outbox) - outbox_before,
            1,
            "Password Changed email must be gated on email_important_notifications "
            "alone, independent of the other category preferences",
        )

    def test_email_uses_admin_template_with_dynamic_title_and_message(self):
        resp = self._change_password("OldStr0ngPassw0rd!", "NewStr0ngPassw0rd!")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertIn("Password Changed", sent.subject)

        html_body = next(
            content for content, mimetype in sent.alternatives if mimetype == "text/html"
        )
        self.assertIn("Password Changed", html_body)
        self.assertIn(
            "Your BudgetBuddy password was changed successfully.", html_body
        )
        # admin.html's generic eyebrow label, confirming the existing
        # template (not a new one) rendered this email.
        self.assertIn("Important Notification", html_body)

    # ---------------------------------------------------------------
    # 7-8: mandatory transactional flows are untouched
    # ---------------------------------------------------------------

    @patch("users.views.send_password_reset_email")
    @patch("users.views.generate_password_reset_token", return_value="raw-reset-token")
    def test_password_reset_request_still_sends_unconditionally(
        self, mock_generate_token, mock_send_email
    ):
        # Disable every preference, including Important Notifications, and
        # leave the account unverified - the reset flow must not care.
        profile = self.user.profile
        profile.email_notifications = False
        profile.email_important_notifications = False
        profile.email_verified = False
        profile.save(
            update_fields=[
                "email_notifications",
                "email_important_notifications",
                "email_verified",
            ]
        )

        self.client.force_authenticate(user=None)
        resp = self.client.post(
            reverse("password-reset"), {"email": self.user.email}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        mock_generate_token.assert_called_once_with(self.user)
        mock_send_email.assert_called_once_with(self.user, "raw-reset-token")

        # This flow never touches the Notification model at all.
        self.assertFalse(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists()
        )

    @patch("users.views.send_verification_email")
    @patch("users.views.generate_verification_token", return_value="raw-verify-token")
    def test_email_verification_still_sends_unconditionally(
        self, mock_generate_token, mock_send_email
    ):
        profile = self.user.profile
        profile.email_notifications = False
        profile.email_important_notifications = False
        profile.email_verified = False
        profile.save(
            update_fields=[
                "email_notifications",
                "email_important_notifications",
                "email_verified",
            ]
        )

        resp = self.client.post(reverse("resend-verification"))
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        mock_generate_token.assert_called_once_with(self.user)
        mock_send_email.assert_called_once_with(self.user, "raw-verify-token")

        self.assertFalse(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).exists()
        )

    # ---------------------------------------------------------------
    # 9: no dedup_key is used, so each successful request stands on its
    # own - one request in, exactly one notification/email out, and a
    # later legitimate request is never suppressed by the earlier one.
    # ---------------------------------------------------------------

    def test_single_successful_request_creates_exactly_one_notification_and_email(self):
        outbox_before = len(mail.outbox)
        resp = self._change_password("OldStr0ngPassw0rd!", "NewStr0ngPassw0rd!")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)

        self.assertEqual(
            Notification.objects.filter(
                user=self.user, notification_type=Notification.NotificationType.ADMIN
            ).count(),
            1,
        )
        self.assertEqual(len(mail.outbox) - outbox_before, 1)
        # No dedup key is set for this event at all - each request is
        # independent by construction, not by a key that happens to differ.
        notification = Notification.objects.get(
            user=self.user, notification_type=Notification.NotificationType.ADMIN
        )
        self.assertIsNone(notification.dedup_key)

    def test_two_separate_successful_password_changes_each_get_their_own_notification_and_email(self):
        resp1 = self._change_password("OldStr0ngPassw0rd!", "SecondStr0ngPassw0rd!")
        self.assertEqual(resp1.status_code, status.HTTP_200_OK, resp1.data)

        resp2 = self._change_password("SecondStr0ngPassw0rd!", "ThirdStr0ngPassw0rd!")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK, resp2.data)

        notifications = Notification.objects.filter(
            user=self.user, notification_type=Notification.NotificationType.ADMIN
        ).order_by("created_at")
        self.assertEqual(
            notifications.count(),
            2,
            "each legitimate password change must produce its own notification, "
            "even if they happen close together in time",
        )
        self.assertEqual(len(mail.outbox), 2)
