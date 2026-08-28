from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from .views import home

# normal API routes
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
    path("api/v1/finora/", include("finora.urls")),
]


# Serve uploaded media in production
urlpatterns += [
    re_path(
        r"^media/(?P<path>.*)$",
        serve,
        {"document_root": settings.MEDIA_ROOT},
    ),
]

# Django development media serving
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)