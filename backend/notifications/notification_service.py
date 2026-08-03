from .models import Notification


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
    """

    defaults = {
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "priority": priority,
        "action_url": action_url,
    }

    if dedup_key:
        notification, _ = Notification.objects.get_or_create(
            user=user,
            dedup_key=dedup_key,
            defaults=defaults,
        )
        return notification

    return Notification.objects.create(
        user=user,
        **defaults,
    )