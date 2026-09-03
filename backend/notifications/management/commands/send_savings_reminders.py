from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from budgets.models import SavingsGoal, SavingsTransaction
from common.formatting import format_currency_for_user
from notifications.models import Notification
from notifications.notification_service import create_notification

# Number of days before a goal's target_date at which the target-date
# reminder becomes eligible. The reminder is considered eligible for the
# *entire* window from `TARGET_DATE_REMINDER_DAYS_BEFORE` days out through
# the target date itself (inclusive), not just on the single day that is
# exactly this many days before the deadline.
#
# This is deliberate: the scheduler (see .github/workflows/savings-reminders.yml)
# runs once a day, and a single missed/late/failed run must not cause a user
# to permanently miss the reminder just because "today" no longer equals
# "target_date - 7 days" by the time the job runs again. Using a window
# instead of an exact-day match makes the check robust to a skipped run,
# while the dedup_key (below) still guarantees the reminder is only ever
# created once per goal per target_date.
TARGET_DATE_REMINDER_DAYS_BEFORE = 7


def is_target_date_reminder_eligible(goal, today, days_before=TARGET_DATE_REMINDER_DAYS_BEFORE):
    """
    Pure eligibility check for the target-date reminder, kept separate from
    any queryset/DB filtering so it can be unit tested directly (including
    edge cases, such as a missing target_date, that the current DB schema
    does not otherwise allow).

    Eligible when all of the following hold:
    - the goal is not completed
    - the goal is not archived
    - the goal has a target_date
    - target_date is between `today` and `today + days_before` (inclusive),
      i.e. the deadline is approaching but has not already passed.
    """
    if goal.is_completed or goal.is_archived:
        return False

    target_date = goal.target_date
    if target_date is None:
        return False

    days_remaining = (target_date - today).days

    return 0 <= days_remaining <= days_before


class Command(BaseCommand):
    help = ()

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Number of days without a deposit before a goal is "
            "considered due for the inactivity reminder. Defaults to 7.",
        )

    def handle(self, *args, **options):
        days = options["days"]
        if days <= 0:
            self.stderr.write(
                self.style.ERROR("--days must be a positive integer.")
            )
            return

        now = timezone.now()
        today = timezone.localdate()
        cutoff = now - timedelta(days=days)
        iso_year, iso_week, _ = now.isocalendar()

        active_goals = SavingsGoal.objects.filter(
            is_completed=False,
            is_archived=False,
        )

        created_count = 0
        skipped_count = 0

        # ------------------------------------------------------------
        # Existing behaviour: inactivity reminder ("no recent deposit").
        # Unchanged.
        # ------------------------------------------------------------
        for goal in active_goals:
            last_deposit = (
                SavingsTransaction.objects.filter(
                    goal=goal,
                    transaction_type=SavingsTransaction.DEPOSIT,
                )
                .order_by("-created_at")
                .first()
            )

            last_activity = (
                last_deposit.created_at if last_deposit else goal.created_at
            )

            if last_activity > cutoff:
                continue

            dedup_key = (
                f"savings_goal:{goal.id}:reminder:{iso_year}-W{iso_week:02d}"
            )

            existed = Notification.objects.filter(
                user=goal.user, dedup_key=dedup_key
            ).exists()

            remaining = goal.target_amount - goal.current_amount

            create_notification(
                user=goal.user,
                title="Savings Reminder",
                priority=Notification.Priority.LOW,
                message=(
                    f'Don\'t forget to continue saving for your '
                    f'"{goal.goal_name}" goal. '
                    f"{format_currency_for_user(goal.user, remaining)} left to reach your "
                    f"{format_currency_for_user(goal.user, goal.target_amount)} target."
                ),
                notification_type=Notification.NotificationType.REMINDER,
                action_url="/savings-goals",
                dedup_key=dedup_key,
            )

            if existed:
                skipped_count += 1
            else:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Savings Reminders (idle {days}+ days): "
                f"{created_count} created, {skipped_count} already existed "
                f"this week."
            )
        )

        # ------------------------------------------------------------
        # New behaviour: target-date reminder ("deadline approaching").
        # Separate notification, separate dedup_key, additive only -
        # does not alter the inactivity reminder above.
        # ------------------------------------------------------------
        target_date_created_count = 0
        target_date_skipped_count = 0

        for goal in active_goals:
            if not is_target_date_reminder_eligible(goal, today):
                continue

            days_remaining = (goal.target_date - today).days
            day_word = "day" if days_remaining == 1 else "days"

            dedup_key = (
                f"savings_goal:{goal.id}:target_date_reminder:"
                f"{goal.target_date.isoformat()}"
            )

            existed = Notification.objects.filter(
                user=goal.user, dedup_key=dedup_key
            ).exists()

            remaining = goal.target_amount - goal.current_amount

            create_notification(
                user=goal.user,
                title="Savings Goal Deadline Approaching",
                priority=Notification.Priority.LOW,
                message=(
                    f'Your "{goal.goal_name}" goal is due in '
                    f"{days_remaining} {day_word}. "
                    f"{format_currency_for_user(goal.user, remaining)} remains to reach your "
                    f"{format_currency_for_user(goal.user, goal.target_amount)} target."
                ),
                notification_type=Notification.NotificationType.REMINDER,
                action_url="/savings-goals",
                dedup_key=dedup_key,
            )

            if existed:
                target_date_skipped_count += 1
            else:
                target_date_created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Savings Goal Target-Date Reminders (within "
                f"{TARGET_DATE_REMINDER_DAYS_BEFORE} days of deadline): "
                f"{target_date_created_count} created, "
                f"{target_date_skipped_count} already existed for that "
                f"target date."
            )
        )
