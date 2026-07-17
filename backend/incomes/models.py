from django.db import models
from django.contrib.auth.models import User


class Income(models.Model):
    SOURCE_CHOICES = [
        ("Salary", "Salary"),
        ("Pocket Money", "Pocket Money"),
        ("Scholarship", "Scholarship"),
        ("Freelance", "Freelance"),
        ("Business", "Business"),
        ("Other", "Other"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="incomes"
    )

    source = models.CharField(max_length=50, choices=SOURCE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()

    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return self.source