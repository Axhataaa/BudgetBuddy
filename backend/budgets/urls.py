from rest_framework.routers import DefaultRouter

from .views import (
    BudgetViewSet,
    SavingsGoalViewSet,
    SavingsTransactionViewSet,
)

router = DefaultRouter()

router.register(
    "",
    BudgetViewSet,
    basename="budget",
)

router.register(
    "savings-goals",
    SavingsGoalViewSet,
    basename="savings-goal",
)

router.register(
    "savings-transactions",
    SavingsTransactionViewSet,
    basename="savings-transaction",
)

urlpatterns = router.urls