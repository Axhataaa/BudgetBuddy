from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        # --- Original 3 types (kept for backward compatibility with
        # existing rows and dedup_keys) ---------------------------------
        # No longer used by new create_notification() calls as of
        # Batch B - budget threshold alerts now use BUDGET_WARNING/
        # BUDGET_EXCEEDED below, which is more specific. Kept in the
        # enum (not removed) so any pre-existing row with this value
        # still validates and displays correctly.
        BUDGET_ALERT = "budget_alert", "Budget Alert"
        SAVINGS_GOAL = "savings_goal", "Savings Goal"
        GENERAL = "general", "General"

        # --- Batch B: granular categories, replacing GENERAL/
        # BUDGET_ALERT for new notifications going forward -------------
        EXPENSE = "expense", "Expense"
        INCOME = "income", "Income"
        # Budget lifecycle events (created/updated) - distinct from the
        # WARNING/EXCEEDED threshold alerts below, mirroring how
        # SAVINGS_GOAL already covers a goal's own lifecycle (created,
        # deposit, withdrawal, completed) separately from ACHIEVEMENT
        # (the goal's terminal "purchased" event).
        BUDGET = "budget", "Budget"
        BUDGET_WARNING = "budget_warning", "Budget Warning"
        BUDGET_EXCEEDED = "budget_exceeded", "Budget Exceeded"
        # A savings goal reaching its target and being marked purchased
        # (budgets/views.py's "Purchase Completed", action_url=
        # "/achievements") - the one savings-goal event that graduates
        # out of the SavingsGoal itself onto the Achievements page.
        ACHIEVEMENT = "achievement", "Achievement"
        MONTHLY_REPORT = "monthly_report", "Monthly Report"
        # Proactive nudges the user didn't directly cause (e.g. "Savings
        # Reminder" for an idle goal) - distinct from SAVINGS_GOAL,
        # which covers events the user's own actions caused.
        REMINDER = "reminder", "Reminder"
        # Not produced by any call site yet - reserved for future
        # admin/system-originated notifications, added now so the
        # choice already exists when that need arises.
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
    # Short heading shown above the message (e.g. "Income Added",
    # "Budget Exceeded") - optional/blank rather than required so
    # existing rows created before this field existed continue to
    # render fine (the frontend falls back to showing just the
    # message when title is blank, exactly as it did before).
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
    # How urgent this notification is (e.g. a budget being exceeded is
    # HIGH priority; a routine "Income Added" is LOW). Purely a display/
    # sort hint for the frontend - doesn't affect notification_type's
    # existing role of categorizing WHAT happened, this is about HOW
    # urgent it is. Defaults to MEDIUM so every pre-existing row (all
    # created before this field existed) backfills to a sensible,
    # neutral value automatically.
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    # Frontend route to navigate to when this notification is clicked
    # (e.g. "/income", "/budgets", "/savings-goals", "/achievements").
    # Set explicitly by each create_notification() call site, which
    # already knows exactly where the underlying event happened -
    # deliberately not inferred from notification_type/message on the
    # frontend, since notification_type alone can't distinguish e.g.
    # "Income Added" from "Budget Created" (both "general"), or
    # "Purchase Completed" from other savings_goal events. Blank means
    # "not clickable" (existing rows created before this field existed
    # simply aren't actionable, which is correct - there's nothing to
    # navigate to for them).
    action_url = models.CharField(
        max_length=200,
        blank=True,
        default="",
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
        # Explicit rather than relying on Django's default
        # (app_label + model name, which would compute to this same
        # string anyway) - this model's table was renamed from
        # reports_notification via notifications/migrations/0002, and
        # keeping db_table explicit here keeps that migration's
        # explicit rename target and this model's current state in
        # exact agreement, so `makemigrations --check` doesn't flag a
        # spurious "table needs renaming to (default)" migration.
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
