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
        JPY = "JPY", "Japanese Yen (¥)"
        KRW = "KRW", "South Korean Won (₩)"
        CNY = "CNY", "Chinese Yuan (¥)"

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
    date_of_birth = models.DateField(null=True, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

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

    budget_warning_threshold = models.PositiveSmallIntegerField(default=90)
    email_notifications = models.BooleanField(default=True)
    budget_alert_notifications = models.BooleanField(default=True)

    email_savings_goal_notifications = models.BooleanField(default=True)
    email_monthly_report_notifications = models.BooleanField(default=True)
    email_important_notifications = models.BooleanField(default=True)
    email_achievement_notifications = models.BooleanField(default=True)

    email_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.full_name or self.user.username


class EmailVerificationToken(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
    )
    email = models.EmailField()
    token_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["token_hash"]),
        ]

    def is_valid(self):
        from django.utils import timezone

        return self.used_at is None and self.expires_at > timezone.now()