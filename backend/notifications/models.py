from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    class NotificationType(models.TextChoices):
      
        BUDGET_ALERT = "budget_alert", "Budget Alert"
        SAVINGS_GOAL = "savings_goal", "Savings Goal"
        GENERAL = "general", "General"

        EXPENSE = "expense", "Expense"
        INCOME = "income", "Income"

        BUDGET = "budget", "Budget"
        BUDGET_WARNING = "budget_warning", "Budget Warning"
        BUDGET_EXCEEDED = "budget_exceeded", "Budget Exceeded"

        ACHIEVEMENT = "achievement", "Achievement"
        MONTHLY_REPORT = "monthly_report", "Monthly Report"

        REMINDER = "reminder", "Reminder"
 
        ADMIN = "admin", "Admin"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    title = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )

    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )

    action_url = models.CharField(
        max_length=200,
        blank=True,
        default="",
    )

    dedup_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    expense = models.ForeignKey(
        "expenses.Expense",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    income = models.ForeignKey(
        "incomes.Income",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    budget = models.ForeignKey(
        "budgets.Budget",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    savings_goal = models.ForeignKey(
        "budgets.SavingsGoal",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    class Meta:

        db_table = "notifications_notification"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "dedup_key"],
                condition=models.Q(dedup_key__isnull=False),
                name="unique_user_dedup_key",
            )
        ]

    def __str__(self):
        return self.title or self.message[:30]
