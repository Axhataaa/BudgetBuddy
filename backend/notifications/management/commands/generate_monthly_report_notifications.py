"""
Generates the "Monthly Report Ready" notification for every
non-admin user.

Mentor spec (Batch 2): "At the end of every month (or through a manual
trigger while developing) generate: 'Your Monthly Financial Report is
Ready.' Clicking the notification should open Reports. Avoid duplicate
monthly notifications."

Deliberately a plain Django management command, not Celery/APScheduler
- runnable by hand right now (`python manage.py
generate_monthly_report_notifications`) and later by cron / Windows
Task Scheduler hitting the same command once a month, per the
project's own "no extra scheduling dependency" constraint.

Reuses, rather than duplicates:
- notifications.notification_service.create_notification() - the
  exact same helper every other notification in the app (income,
  expense, budget, savings) already goes through.
- Notification's existing dedup_key mechanism - one row per
  (user, dedup_key) is enforced at the DB level (unique_user_dedup_key
  constraint), so re-running this command for a month that's already
  been notified is always a safe no-op, not a duplicate.
- Notification.NotificationType.MONTHLY_REPORT - added in Batch B
  (notification-system enhancement) specifically for this event; was
  GENERAL until then (see this project's own git history / prior
  batch reports for that earlier reasoning).
- The existing /reports page/route - action_url points at "/reports",
  the same page ReportSummaryView (reports/views.py) already serves,
  rather than introducing any new report-generation or persistence
  logic. The reports.Report model is intentionally left untouched:
  it's currently unused elsewhere in the app (only registered in
  admin.py), and wiring a notification command to start writing rows
  into it would be a scope change beyond "add the two missing
  notification types."

Excludes is_staff/is_superuser accounts. Those are exactly the
accounts RoleAwareTokenObtainPairView's own claims (users/
token_serializer.py) and Login.jsx route to the separate Admin
Dashboard rather than the BudgetBuddy Dashboard - they aren't
budget-tracking users, the same distinction already applied to the
"Users by Occupation" breakdown (analytics/views.py AdminStatsView,
which excludes Profile.Role.ADMIN from that chart). Sending a
"Your Monthly Financial Report is Ready" notification to an account
that isn't using the app's financial features doesn't apply to them.
"""

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
    help = (
        "Creates a 'Monthly Report Ready' notification for every "
        "non-admin user (excludes is_staff/is_superuser accounts) "
        "for the given (or previous, by default) month. Safe to "
        "re-run - deduplicated per user per month via dedup_key."
    )

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
            # Previous calendar month - "the month that just finished"
            # - so a cron job firing on the 1st of the month reports
            # on the month that just ended, not the one just starting.
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

        # is_staff/is_superuser accounts land on the separate Admin
        # Dashboard (Login.jsx / RoleAwareTokenObtainPairView), not
        # the BudgetBuddy Dashboard, so they never generate a
        # financial report of their own to be notified about.
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
        """
        Returns (notification, created) - `created` mirrors
        get_or_create()'s own semantics (True only the first time this
        user/month pair is notified), surfaced here since
        create_notification() itself only returns the instance.
        """
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
