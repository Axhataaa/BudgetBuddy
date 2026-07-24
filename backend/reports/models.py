from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        BUDGET_ALERT = "budget_alert", "Budget Alert"
        SAVINGS_GOAL = "savings_goal", "Savings Goal"
        GENERAL = "general", "General"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )
    # Set only for system-generated notifications that must never be
    # duplicated for the same underlying condition (a budget crossing
    # a threshold, a goal reaching its target) - e.g.
    # "budget_alert:{budget_id}:80" or "savings_goal:{goal_id}:completed".
    # The unique constraint below is the actual guarantee; application
    # code additionally uses get_or_create() against this field so it
    # never even attempts a duplicate insert in the common case.
    dedup_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "dedup_key"],
                condition=models.Q(dedup_key__isnull=False),
                name="unique_user_dedup_key",
            )
        ]

    def __str__(self):
        return self.message[:30]


class Report(models.Model):
    REPORT_TYPES = [
        ("Monthly", "Monthly"),
        ("Weekly", "Weekly"),
        ("Yearly", "Yearly"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reports"
    )
    report_type = models.CharField(
        max_length=20,
        choices=REPORT_TYPES
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.report_type} Report"