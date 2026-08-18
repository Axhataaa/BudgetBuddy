from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from .views import home

urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/v1/users/", include("users.urls")),
    path("api/v1/expenses/", include("expenses.urls")),
    path("api/v1/incomes/", include("incomes.urls")),
    path("api/v1/budgets/", include("budgets.urls")),
    path("api/v1/dashboard/", include("analytics.urls")),
    path("api/v1/reports/", include("reports.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/ai-analysis/", include("ai_analysis.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)