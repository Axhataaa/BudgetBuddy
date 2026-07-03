from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

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

    def __str__(self):
        return f"{self.report_type} Report"