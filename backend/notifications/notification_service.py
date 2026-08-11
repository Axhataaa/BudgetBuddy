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
    """
    Create a notification.

    If dedup_key is supplied, only one notification with that key
    can exist per user.

    Returns:
        Notification instance

    Batch C addition: after the in-app Notification row exists, this
    also asks email_service.dispatch_notification_email() whether an
    email should go out - but only when a NEW row was actually
    created. With a dedup_key, get_or_create() may return an existing
    row instead of creating one (that's the whole point of dedup_key);
    without this `created` check, re-running something like the
    send_savings_reminders management command against an
    already-notified goal would silently re-send the email every time
    even though the in-app notification correctly stayed deduplicated.
    Wrapped in try/except as defense in depth on top of
    dispatch_notification_email()'s own internal handling - nothing in
    the email pipeline may ever cause notification creation itself to
    fail for any of this function's 12+ call sites across the app.
    """

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
