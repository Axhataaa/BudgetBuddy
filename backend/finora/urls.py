from django.urls import path

from .views import FinoraChatView

urlpatterns = [
    path("chat/", FinoraChatView.as_view(), name="finora-chat"),
]
