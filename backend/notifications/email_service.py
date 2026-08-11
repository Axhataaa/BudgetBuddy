"""
Email delivery for the notification system - Batch C.

Design summary (see also the Batch C audit in chat for the full
reasoning): NOT every notification sends an email. The doc's own
"Do NOT send an email for every notification" rule is enforced by
_get_email_rule() below, which is an explicit allow-list keyed
entirely on (notification_type, priority) - both real fields on the
Notification model - never on notification.title text. Anything not
in the allow-list (expense, income, budget, savings_goal at LOW
priority, reminder, general, the legacy budget_alert) is in-app only,
by construction, with no further check needed.

For the categories that ARE in the allow-list, two more gates apply
before anything is actually sent:
  1. The user's master switch (Profile.email_notifications) must be on.
  2. The specific category's own preference field
     (e.g. Profile.email_savings_goal_notifications) must be on.

Async-ready structure: dispatch_notification_email(notification_id) is
the one function that touches this whole subsystem from the outside
(notification_service.create_notification() calls only this). It
takes a primitive id, not a live Notification instance, specifically
so it can become a Celery task later with no change to its signature
or its caller - `@shared_task` plus `.delay(notification_id)` instead
of a direct call is the entire migration, whenever a task queue is
introduced. Nothing here imports or assumes Celery today.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import Notification

logger = logging.getLogger(__name__)


# Doc's "EMAIL RULES" section, translated from titles (as originally
# written) into the actual (notification_type, priority) combinations
# Batch B's granular types now make possible:
#
#   - "Budget nearing limit (90%)" -> budget_warning at priority=HIGH
#     specifically. budget_warning also covers the 80% tier at
#     priority=MEDIUM (see budgets/notifications.py) - that tier is
#     deliberately NOT in this allow-list, matching the doc's "90%"
#     wording exactly rather than emailing at every warning tier.
#   - "Budget exceeded" -> budget_exceeded (always HIGH today, but the
#     rule doesn't require it - exceeding is exceeding at any priority).
#   - "Savings Goal Completed" -> savings_goal at priority=MEDIUM. This
#     is the one existing case where two different real events share a
#     type (savings_goal also covers Deposit Added/Withdrawal Made/Goal
#     Created, all priority=LOW) - MEDIUM is what create_notification()
#     already only ever sets for the *completion* event within this
#     type (see budgets/serializers.py), so it's a safe, structural
#     way to isolate that one event without touching title text.
#   - "Monthly Financial Report Ready" -> monthly_report.
#   - "Important System Notifications" / "Security Notifications
#     (future support)" -> admin. No call site produces this type yet
#     (see notifications/models.py's own comment on that choice) - the
#     rule exists now so the moment one does, it's already wired up.
#
# Achievement (Purchase Completed) isn't named in the doc's Section 7
# list, but Section 10's own example preference checklist gives it a
# dedicated toggle (defaulting OFF) - which only makes sense if
# achievement emails are a real, if opt-in-only, category. Included
# here for that reason; because its preference field defaults to
# False, it stays silent for every user until they explicitly opt in.
_EMAIL_RULES = {
    (Notification.NotificationType.BUDGET_WARNING, Notification.Priority.HIGH): {
        "template": "notifications/emails/budget_warning.html",
        "preference_field": "budget_alert_notifications",
        "cta_label": "View Budget",
        "accent_color": "#E8A33D",
    },
    (Notification.NotificationType.BUDGET_EXCEEDED, Notification.Priority.HIGH): {
        "template": "notifications/emails/budget_exceeded.html",
        "preference_field": "budget_alert_notifications",
        "cta_label": "View Budget",
        "accent_color": "#C0392B",
    },
    (Notification.NotificationType.SAVINGS_GOAL, Notification.Priority.MEDIUM): {
        "template": "notifications/emails/savings_goal_completed.html",
        "preference_field": "email_savings_goal_notifications",
        "cta_label": "View Goal",
        "accent_color": "#1F9D6C",
    },
}

# Rules that apply regardless of priority (the type alone is enough to
# decide), kept in a separate mapping so the priority-sensitive rules
# above can stay an exact (type, priority) match without this second
# group needing every possible priority value listed out.
_EMAIL_RULES_ANY_PRIORITY = {
    Notification.NotificationType.ACHIEVEMENT: {
        "template": "notifications/emails/achievement.html",
        "preference_field": "email_achievement_notifications",
        "cta_label": "View Achievement",
        "accent_color": "#1F9D6C",
    },
    Notification.NotificationType.MONTHLY_REPORT: {
        "template": "notifications/emails/monthly_report.html",
        "preference_field": "email_monthly_report_notifications",
        "cta_label": "Download Report",
        "accent_color": "#303B8E",
    },
    Notification.NotificationType.ADMIN: {
        "template": "notifications/emails/admin.html",
        "preference_field": "email_important_notifications",
        "cta_label": "View Details",
        "accent_color": "#303B8E",
    },
}


def _get_email_rule(notification):
    """Returns the email rule dict for this notification, or None if
    this notification's (type, priority) isn't email-eligible at all -
    the single place that answers "should this ever email anyone,
    regardless of preferences"."""
    rule = _EMAIL_RULES.get((notification.notification_type, notification.priority))
    if rule is not None:
        return rule
    return _EMAIL_RULES_ANY_PRIORITY.get(notification.notification_type)


def _build_absolute_url(action_url):
    """Turns a notification's relative SPA route (e.g. "/budgets")
    into an absolute link an email client can actually follow."""
    base = settings.FRONTEND_URL.rstrip("/")
    if not action_url:
        return base
    return f"{base}/{action_url.lstrip('/')}"


def send_notification_email(notification, rule):
    """
    Renders `rule["template"]` (always extending
    notifications/emails/base.html) and sends it. Never raises - a
    broken email send must never be allowed to look like a failed
    notification to any of the 12+ call sites that create
    notifications, so any exception here is logged and swallowed.
    """
    context = {
        "title": notification.title,
        "message": notification.message,
        "cta_label": rule["cta_label"],
        "cta_url": _build_absolute_url(notification.action_url),
        "accent_color": rule["accent_color"],
    }

    try:
        html_body = render_to_string(rule["template"], context)
        # A plain-text alternative part is standard email deliverability
        # practice (spam filters, text-only clients) - this is not the
        # "plain text email" the doc says not to send; the HTML part
        # above remains the primary, rendered content.
        text_body = strip_tags(html_body)

        message = EmailMultiAlternatives(
            subject=f"{notification.title} - BudgetBuddy",
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[notification.user.email],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)
    except Exception:
        logger.exception(
            "Failed to send notification email (notification_id=%s, user_id=%s)",
            notification.id,
            notification.user_id,
        )


def dispatch_notification_email(notification_id):
    """
    The one function notification_service.create_notification() calls.
    Takes a primitive id (see module docstring) rather than a
    Notification instance so this can move behind a background worker
    later with no change to its signature or its caller.

    Re-fetches the notification (with its user's profile) rather than
    trusting an in-memory object, since this is the boundary meant to
    survive becoming an async task where the caller's Python object
    won't exist in the worker process anyway.
    """
    try:
        notification = (
            Notification.objects
            .select_related("user", "user__profile")
            .get(pk=notification_id)
        )
    except Notification.DoesNotExist:
        return

    rule = _get_email_rule(notification)
    if rule is None:
        return

    profile = getattr(notification.user, "profile", None)
    if profile is None or not profile.email_notifications:
        return

    # Hard gate, independent of every preference toggle above: an
    # unverified email must never receive a notification email, even
    # if the user has every relevant preference switched on. See
    # users/email_verification_service.py for how email_verified
    # actually becomes True.
    if not profile.email_verified:
        return

    if not getattr(profile, rule["preference_field"], False):
        return

    if not notification.user.email:
        logger.info(
            "Skipping notification email for user_id=%s: no email on file",
            notification.user_id,
        )
        return

    send_notification_email(notification, rule)
