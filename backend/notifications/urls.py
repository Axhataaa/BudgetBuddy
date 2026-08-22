from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet, RunScheduledTaskView

router = DefaultRouter()
router.register("", NotificationViewSet, basename="notification")

urlpatterns = [
    path("run-scheduled/", RunScheduledTaskView.as_view(), name="run-scheduled"),
    path("", include(router.urls)),
]
