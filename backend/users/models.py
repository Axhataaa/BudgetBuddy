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
    # --- Batch B: granular email preferences (notification-system doc,
    # Section 10 - "Inside Settings, add an Email Notification
    # Preferences section... Users should be able to enable or disable
    # each email category independently"). email_notifications above
    # remains the master switch; budget_alert_notifications above is
    # kept as-is (not renamed - renaming would change the existing
    # /users/me/ API contract) and continues to mean "email me about
    # budget alerts". These four are new, one per remaining doc
    # category. Matches the doc's own example checkbox defaults
    # exactly: Savings Goal Updates/Monthly Reports/Important
    # Notifications default checked (True); Achievements defaults
    # unchecked (False) - routine positive news the user opts into
    # rather than one more inbox notification by default.
    email_savings_goal_notifications = models.BooleanField(default=True)
    email_monthly_report_notifications = models.BooleanField(default=True)
    email_important_notifications = models.BooleanField(default=True)
    email_achievement_notifications = models.BooleanField(default=False)

    # --- Email verification -----------------------------------------
    # False by default for every new account (post_save signal below
    # never sets this, so it takes the field default) and reset to
    # False by ProfileSerializer.update() whenever `email` changes -
    # see that method's own comment for why. Read via
    # notifications/email_service.py's dispatch_notification_email()
    # as a hard gate before any notification email is ever sent,
    # regardless of the email preference toggles above.
    email_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.full_name or self.user.username


class EmailVerificationToken(models.Model):
    """
    One row per outstanding (or historical) email-verification attempt.
    Created by users/email_verification_service.py on registration,
    resend, and email change; consumed by VerifyEmailView.

    Only the SHA-256 hash of the token is ever stored - the raw token
    exists only in memory for the few seconds between generation and
    being emailed to the user, then in the URL of the email itself.
    This mirrors how Django's own PasswordResetTokenGenerator and most
    API-key systems handle secrets: a stolen database dump reveals
    nothing usable, since the hash alone can't be turned back into a
    working token.

    `email` captures which address this token verifies AT THE TIME IT
    WAS ISSUED. Verification checks this against the user's CURRENT
    email (not just "does the hash match") specifically so that an
    old token emailed to a since-changed address can never verify the
    new one - the two are unrelated to each other, and the token was
    only ever regeneratable in the direction, once created, of proving
    ownership of the ONE address it was originally sent to.
    """

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