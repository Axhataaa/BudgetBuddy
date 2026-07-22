from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        WORKING_PROFESSIONAL = "working_professional", "Working Professional"
        FREELANCER = "freelancer", "Freelancer"
        BUSINESS_OWNER = "business_owner", "Business Owner"
        OTHER = "other", "Other"
        ADMIN = "admin", "Admin"

    class Theme(models.TextChoices):
        LIGHT = "light", "Light"
        DARK = "dark", "Dark"
        SYSTEM = "system", "System"

    class Currency(models.TextChoices):
        INR = "INR", "Indian Rupee (₹)"
        USD = "USD", "US Dollar ($)"
        EUR = "EUR", "Euro (€)"
        GBP = "GBP", "British Pound (£)"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    role = models.CharField(
        max_length=25,
        choices=Role.choices,
        default=Role.STUDENT,
    )
    full_name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # --- Settings (App §Settings) -----------------------------------
    # Added for the Settings page. Kept on Profile rather than a
    # separate Preferences model since it's a strict 1:1 with the user
    # and is already read/written through the same /users/me/ endpoint
    # as everything else here - a second model would mean a second
    # round trip for no benefit.
    theme = models.CharField(
        max_length=10,
        choices=Theme.choices,
        default=Theme.SYSTEM,
    )
    currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        default=Currency.INR,
    )
    monthly_saving_target = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    # Percentage of a budget's limit at which it's flagged as
    # "nearing limit" rather than "over budget". Replaces the value
    # that used to be hardcoded to 90 in analytics/views.py.
    budget_warning_threshold = models.PositiveSmallIntegerField(default=90)
    email_notifications = models.BooleanField(default=True)
    budget_alert_notifications = models.BooleanField(default=True)

    def __str__(self):
        return self.full_name or self.user.username