from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import NotificationFilter
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.DestroyModelMixin,
    viewsets.ReadOnlyModelViewSet,
):
    """
    Read-only CRUD (list/retrieve) plus DestroyModelMixin (delete a
    single notification) and write actions, matching the same
    detail/list @action pattern already used by SavingsGoalViewSet's
    complete-purchase/achievements actions. Notifications are still
    system-generated - create/update aren't exposed, only delete
    (individual, via the mixin) and clear-all (via the extra action
    below), since a user reasonably expects to be able to dismiss
    notifications even though they can't author them.

    filterset_class enables ?notification_type=&is_read= the same way
    every other ViewSet's filterset_class already does (BudgetFilter,
    ExpenseFilter, ...) via the globally-enabled DjangoFilterBackend -
    needed because the list is server-paginated, so a client-side-only
    "Unread" filter would miss unread items on other pages.
    """

    serializer_class = NotificationSerializer
    filterset_class = NotificationFilter
    ordering = ["-created_at"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."})

    @action(detail=False, methods=["delete"], url_path="clear-all")
    def clear_all(self, request):
        # Same get_queryset() scoping (user=request.user) as every
        # other action on this ViewSet - a "clear all" can only ever
        # delete the requesting user's own notifications.
        self.get_queryset().delete()
        return Response({"message": "All notifications cleared."})
