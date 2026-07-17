from django.urls import path

from .views import (
    DashboardSummaryView,
    RecentActivityView,
)

urlpatterns = [
    path(
        "summary/",
        DashboardSummaryView.as_view(),
        name="dashboard-summary",
    ),
    path(
        "recent-activity/",
        RecentActivityView.as_view(),
        name="recent-activity",
    ),
]