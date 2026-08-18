from django.urls import path

from .views import AIFinancialAnalysisView

urlpatterns = [
    path("analyze/", AIFinancialAnalysisView.as_view(), name="ai-financial-analysis"),
]
