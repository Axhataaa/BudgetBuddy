from django.db import migrations


class Migration(migrations.Migration):
    """
    Part of moving Notification out of the reports app and into its
    own notifications app (see notifications/migrations/0001_initial.py
    for the corresponding state-only CreateModel, and 0002 for the
    real table rename).

    SeparateDatabaseAndState with database_operations=[] means this
    only updates Django's migration STATE (so reports no longer
    "thinks" it owns a Notification model) - it does NOT touch the
    actual database table or any of its rows. The reports_notification
    table, with all existing data, is left completely untouched here;
    it's handed over to the notifications app's own migrations, which
    take state ownership immediately after this one runs.
    """

    dependencies = [
        ("reports", "0003_notification_action_url_notification_title"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name="Notification"),
            ],
            database_operations=[],
        ),
    ]
