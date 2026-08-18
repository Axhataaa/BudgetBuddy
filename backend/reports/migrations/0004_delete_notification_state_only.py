from django.db import migrations


class Migration(migrations.Migration):

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
