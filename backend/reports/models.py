from django.db import models
from django.contrib.auth.models import User


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
