from django.db import models
from django.contrib.auth.models import User


class Budget(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="budgets"
    )

    category = models.CharField(max_length=50)

    monthly_limit = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-year", "-month", "category"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "category", "month", "year"],
                name="unique_budget_per_category_per_month",
            )
        ]

    def __str__(self):
        return f"{self.category} Budget"


class SavingsGoal(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="savings_goals"
    )
    goal_name = models.CharField(max_length=100)
    description = models.TextField(blank=True) 
    target_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    target_date = models.DateField()

    class Meta:
        ordering = ["target_date"]

    def __str__(self):
        return self.goal_name