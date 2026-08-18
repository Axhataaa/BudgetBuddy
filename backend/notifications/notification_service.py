import logging

from .models import Notification
from .email_service import dispatch_notification_email

logger = logging.getLogger(__name__)


def create_notification(
    *,
    user,
    title,
    message,
    notification_type,
    priority=Notification.Priority.MEDIUM,
    action_url="",
    dedup_key=None,
):

    defaults = {
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "priority": priority,
        "action_url": action_url,
    }

    if dedup_key:
        notification, created = Notification.objects.get_or_create(
            user=user,
            dedup_key=dedup_key,
            defaults=defaults,
        )
    else:
        notification = Notification.objects.create(user=user, **defaults)
        created = True

    if created:
        try:
            dispatch_notification_email(notification.id)
        except Exception:
            logger.exception(
                "Unexpected error dispatching notification email for notification_id=%s",
                notification.id,
            )

    return notification


def sync_entity_notification(
    *,
    user,
    title,
    message,
    notification_type,
    dedup_key,
    priority=Notification.Priority.MEDIUM,
    action_url="",
    expense=None,
    income=None,
    budget=None,
    savings_goal=None,
):

    defaults = {
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "priority": priority,
        "action_url": action_url,
        "expense": expense,
        "income": income,
        "budget": budget,
        "savings_goal": savings_goal,
    }

    notification, created = Notification.objects.update_or_create(
        user=user,
        dedup_key=dedup_key,
        defaults=defaults,
    )

    if created:
        try:
            dispatch_notification_email(notification.id)
        except Exception:
            logger.exception(
                "Unexpected error dispatching notification email for notification_id=%s",
                notification.id,
            )

    return notification
