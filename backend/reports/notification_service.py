from .models import Notification


def create_notification(user, message, notification_type, dedup_key=None):
    """
    Creates a persistent Notification. If dedup_key is given, uses
    get_or_create() against (user, dedup_key) so the same underlying
    condition (a specific budget crossing a specific threshold, a
    specific goal reaching its target) never produces more than one
    notification - backed by a matching unique constraint on the model
    itself (Notification.Meta.constraints), not just this check.

    Returns True if a new notification was actually created, False if
    one already existed for this dedup_key (useful for callers that
    want to know whether this is a "new" alert).
    """
    if dedup_key:
        _, created = Notification.objects.get_or_create(
            user=user,
            dedup_key=dedup_key,
            defaults={
                "message": message,
                "notification_type": notification_type,
            },
        )
        return created

    Notification.objects.create(
        user=user,
        message=message,
        notification_type=notification_type,
    )
    return True
