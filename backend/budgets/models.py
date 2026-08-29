from django.db import models
from django.contrib.auth.models import User
from common.constants import CATEGORY_CHOICES


class Budget(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="budgets"
    )

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
    )

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

    class GoalType(models.TextChoices):
        PURCHASE = "PURCHASE", "Purchase"
        TRAVEL = "TRAVEL", "Travel & Experience"
        FUND = "FUND", "Fund"
        EDUCATION = "EDUCATION", "Education"
        GENERAL = "GENERAL", "General Savings"
        OTHER = "OTHER", "Other"

    class GoalCategory(models.TextChoices):
        ELECTRONICS = "ELECTRONICS", "Electronics"
        SHOPPING = "SHOPPING", "Shopping"
        SPORTS_FITNESS = "SPORTS_FITNESS", "Sports & Fitness"
        HEALTH_MEDICAL = "HEALTH_MEDICAL", "Health & Medical"
        EMERGENCY_SAFETY = "EMERGENCY_SAFETY", "Emergency & Safety"
        CELEBRATIONS_GIFTS = "CELEBRATIONS_GIFTS", "Celebrations & Gifts"
        HOME_LIFESTYLE = "HOME_LIFESTYLE", "Home & Lifestyle"
        OTHER = "OTHER", "Other"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="savings_goals"
    )

    goal_name = models.CharField(max_length=100)

    description = models.TextField(blank=True)

    goal_type = models.CharField(
        max_length=20,
        choices=GoalType.choices,
        default=GoalType.PURCHASE,
    )

    goal_category = models.CharField(
        max_length=20,
        choices=GoalCategory.choices,
        default=GoalCategory.OTHER,
        blank=True,
    )

    target_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    current_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    target_date = models.DateField()

    is_completed = models.BooleanField(
        default=False,
    )

    is_purchased = models.BooleanField(
        default=False,
    )

    is_archived = models.BooleanField(
        default=False,
    )

    purchase_date = models.DateField(
        null=True,
        blank=True,
    )

    purchase_note = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["target_date", "-created_at"]

    def save(self, *args, **kwargs):
        self.is_completed = self.current_amount >= self.target_amount
        super().save(*args, **kwargs)

    def __str__(self):
        return self.goal_name


class SavingsTransaction(models.Model):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"

    TRANSACTION_TYPES = [
        (DEPOSIT, "Deposit"),
        (WITHDRAWAL, "Withdrawal"),
    ]

    goal = models.ForeignKey(
        SavingsGoal,
        on_delete=models.CASCADE,
        related_name="transactions",
    )

    transaction_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES,
        default=DEPOSIT,
    )

    note = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.transaction_amount <= 0:
            raise ValueError(
                "Transaction amount must be greater than zero."
            )

        super().save(*args, **kwargs)

    def __str__(self):
        sign = "+" if self.transaction_type == self.DEPOSIT else "-"
        return (
            f"{self.goal.goal_name}: "
            f"{sign}₹{self.transaction_amount}"
        )