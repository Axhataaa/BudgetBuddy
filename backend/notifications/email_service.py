import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import Notification

logger = logging.getLogger(__name__)

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

    rule = _EMAIL_RULES.get((notification.notification_type, notification.priority))
    if rule is not None:
        return rule
    return _EMAIL_RULES_ANY_PRIORITY.get(notification.notification_type)


def _build_absolute_url(action_url):

    base = settings.FRONTEND_URL.rstrip("/")
    if not action_url:
        return base
    return f"{base}/{action_url.lstrip('/')}"


def send_notification_email(notification, rule):

    context = {
        "title": notification.title,
        "message": notification.message,
        "cta_label": rule["cta_label"],
        "cta_url": _build_absolute_url(notification.action_url),
        "accent_color": rule["accent_color"],
    }

    try:
        html_body = render_to_string(rule["template"], context)

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
