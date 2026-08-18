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

        self.get_queryset().delete()
        return Response({"message": "All notifications cleared."})
