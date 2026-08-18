from datetime import date

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from notifications.models import Notification
from notifications.notification_service import create_notification

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


class Command(BaseCommand):
    help = ()

    def add_arguments(self, parser):
        parser.add_argument(
            "--month",
            type=int,
            help="Month (1-12) to generate the notification for. "
            "Defaults to last month, matching the 'end of every "
            "month, report for the month just finished' behaviour.",
        )
        parser.add_argument(
            "--year",
            type=int,
            help="Year to generate the notification for. Defaults to "
            "the year matching --month (or last month's year).",
        )

    def handle(self, *args, **options):
        month = options.get("month")
        year = options.get("year")

        if month is None:
            today = date.today()

            if today.month == 1:
                month, year = 12, today.year - 1
            else:
                month, year = today.month - 1, today.year

        if year is None:
            year = date.today().year

        if not 1 <= month <= 12:
            self.stderr.write(
                self.style.ERROR("--month must be between 1 and 12.")
            )
            return

        month_label = f"{MONTH_NAMES[month - 1]} {year}"

        created_count = 0
        skipped_count = 0

        recipients = User.objects.filter(is_staff=False, is_superuser=False)

        for user in recipients:
            notification, was_created = self._notify(user, month, year, month_label)
            if was_created:
                created_count += 1
            else:
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Monthly Report Ready notifications for {month_label}: "
                f"{created_count} created, {skipped_count} already existed."
            )
        )

    @staticmethod
    def _notify(user, month, year, month_label):

        dedup_key = f"monthly_report:{user.id}:{year}-{month:02d}"

        existing = Notification.objects.filter(
            user=user, dedup_key=dedup_key
        ).exists()

        notification = create_notification(
            user=user,
            title="Monthly Report Ready",
            priority=Notification.Priority.LOW,
            message=(
                f"Your Monthly Financial Report for {month_label} is ready."
            ),
            notification_type=Notification.NotificationType.MONTHLY_REPORT,
            action_url="/reports",
            dedup_key=dedup_key,
        )

        return notification, not existing
