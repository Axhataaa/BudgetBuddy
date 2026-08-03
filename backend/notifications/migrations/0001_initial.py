import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Part of moving Notification out of the reports app (see
    reports/migrations/0004_delete_notification_state_only.py) into
    this new notifications app.

    SeparateDatabaseAndState with database_operations=[] means this
    only updates Django's migration STATE - it does NOT create a new
    database table. The table already exists physically (as
    reports_notification, with all pre-existing notification data
    intact) from when it was created by reports' own migration
    history; this migration just tells Django "notifications now owns
    this model going forward". The field list below is an exact match
    of Notification's schema as of reports/migrations/0003 (title,
    message, notification_type, action_url, dedup_key, is_read,
    created_at, user, plus the unique constraint) - deliberately not
    including `priority`, which is a genuinely new field added by
    0003_notification_priority.py as a real AddField, since it did not
    exist on the table this migration is taking over.

    0002_alter_notification_table.py (next) is the migration that
    actually renames the physical table to notifications_notification
    - a real, safe, atomic ALTER TABLE RENAME that preserves every
    existing row, index, and constraint.
    """

    initial = True

    dependencies = [
        ("reports", "0004_delete_notification_state_only"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name="Notification",
                    fields=[
                        (
                            "id",
                            models.BigAutoField(
                                auto_created=True,
                                primary_key=True,
                                serialize=False,
                                verbose_name="ID",
                            ),
                        ),
                        (
                            "title",
                            models.CharField(
                                blank=True, default="", max_length=100
                            ),
                        ),
                        ("message", models.TextField()),
                        (
                            "notification_type",
                            models.CharField(
                                choices=[
                                    ("budget_alert", "Budget Alert"),
                                    ("savings_goal", "Savings Goal"),
                                    ("general", "General"),
                                ],
                                default="general",
                                max_length=20,
                            ),
                        ),
                        (
                            "action_url",
                            models.CharField(
                                blank=True, default="", max_length=200
                            ),
                        ),
                        (
                            "dedup_key",
                            models.CharField(
                                blank=True, max_length=255, null=True
                            ),
                        ),
                        ("is_read", models.BooleanField(default=False)),
                        (
                            "created_at",
                            models.DateTimeField(auto_now_add=True),
                        ),
                        (
                            "user",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="notifications",
                                to=settings.AUTH_USER_MODEL,
                            ),
                        ),
                    ],
                    options={
                        "ordering": ["-created_at"],
                        # Critical: this MUST match the table's actual
                        # current physical name (still reports_notification
                        # at this point - it hasn't been renamed yet).
                        # Without this, Django's migration state would
                        # default to assuming the table is already named
                        # "notifications_notification" (app_label +
                        # model name) from this migration onward, which
                        # would make 0002_alter_notification_table.py's
                        # rename a silent no-op (Django would see
                        # from-state == to-state and skip the real SQL
                        # entirely) - confirmed by actually running this
                        # migration sequence against a populated database
                        # before shipping it, not assumed.
                        "db_table": "reports_notification",
                    },
                ),
                migrations.AddConstraint(
                    model_name="notification",
                    constraint=models.UniqueConstraint(
                        condition=models.Q(("dedup_key__isnull", False)),
                        fields=("user", "dedup_key"),
                        name="unique_user_dedup_key",
                    ),
                ),
            ],
            database_operations=[],
        ),
    ]
