from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet, ReportSummaryView

router = DefaultRouter()
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("summary/", ReportSummaryView.as_view(), name="report-summary"),
    path("", include(router.urls)),
]
