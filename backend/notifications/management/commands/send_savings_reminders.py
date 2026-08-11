"""
Generates a "Savings Reminder" notification for active savings goals
that haven't received a deposit in a while.

Mentor spec (Batch 2): "If a Savings Goal has not received deposits
for several days, generate a reminder notification... e.g. 'Don't
forget to continue saving for your Laptop Goal.' Use a proper
scheduled architecture. Do not hardcode reminders. Avoid duplicates."
"Savings Reminder should notify users only for active goals that need
attention (do not spam completed goals)."

Plain Django management command - runnable by hand now
(`python manage.py send_savings_reminders`) and later via cron /
Windows Task Scheduler, matching generate_monthly_report_notifications
and the project's "no Celery/Redis/APScheduler" constraint.

Reuses, rather than duplicates:
- notifications.notification_service.create_notification() and the
  Notification model's dedup_key mechanism - same pattern as every
  other notification in the app.
- budgets.models.SavingsGoal / SavingsTransaction - the existing
  savings module's own is_completed/is_archived flags and its own
  transaction history, rather than tracking "last activity" in any
  new field or table.
- Notification.NotificationType.REMINDER (Batch B) and action_url=
  "/savings-goals" - REMINDER, not SAVINGS_GOAL (which this used until
  Batch B), because this notification is a proactive nudge the user
  didn't cause, unlike SAVINGS_GOAL's other events (Goal Created,
  Deposit Added, Withdrawal Made, Goal Completed), which all fire in
  direct response to something the user just did.

"Do not hardcode reminders": the --days threshold is a command
argument (default 7), not a fixed string baked into the message, and
the message itself is built from each goal's own name/amounts.

Deduplication design: unlike one-shot lifecycle events (goal created,
goal completed - each happens once, so a permanent dedup_key is
correct), a savings reminder is meant to recur if the goal keeps
sitting idle. The dedup_key therefore includes the ISO year/week the
command was run in, so at most one reminder fires per goal per
calendar week no matter how often this command is invoked (e.g. a
daily cron), while still allowing a fresh reminder the following week
if the goal is still idle then.
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from budgets.models import SavingsGoal, SavingsTransaction
from common.formatting import format_inr
from notifications.models import Notification
from notifications.notification_service import create_notification


class Command(BaseCommand):
    help = (
        "Creates a 'Savings Reminder' notification for active savings "
        "goals (not completed, not archived/purchased) that have had "
        "no deposit in the last N days. Safe to re-run - at most one "
        "reminder per goal per calendar week via dedup_key."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Number of days without a deposit before a goal is "
            "considered due for a reminder. Defaults to 7.",
        )

    def handle(self, *args, **options):
        days = options["days"]
        if days <= 0:
            self.stderr.write(
                self.style.ERROR("--days must be a positive integer.")
            )
            return

        now = timezone.now()
        cutoff = now - timedelta(days=days)
        iso_year, iso_week, _ = now.isocalendar()

        # "active goals that need attention" - explicitly excludes
        # completed and archived/purchased goals ("do not spam
        # completed goals"), matching the same is_completed/
        # is_archived flags DashboardSummaryView already uses to
        # separate active goals from achievements.
        active_goals = SavingsGoal.objects.filter(
            is_completed=False,
            is_archived=False,
        )

        created_count = 0
        skipped_count = 0

        for goal in active_goals:
            last_deposit = (
                SavingsTransaction.objects.filter(
                    goal=goal,
                    transaction_type=SavingsTransaction.DEPOSIT,
                )
                .order_by("-created_at")
                .first()
            )

            # A goal that has never received a deposit is measured
            # from its own creation date, so brand-new goals aren't
            # immediately flagged as "idle" before the user has had a
            # reasonable chance to make a first deposit.
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
                    f"₹{format_inr(remaining)} left to reach your "
                    f"₹{format_inr(goal.target_amount)} target."
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
