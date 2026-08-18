import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

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
