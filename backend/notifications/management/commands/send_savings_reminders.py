from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from budgets.models import SavingsGoal, SavingsTransaction
from common.formatting import format_currency_for_user
from notifications.models import Notification
from notifications.notification_service import create_notification


class Command(BaseCommand):
    help = ()

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
