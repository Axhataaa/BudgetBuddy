from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Adds the new `priority` field required by the mentor's Task 2. A
    real database operation (unlike 0001/0002, which only moved the
    existing model/table) - a straightforward ALTER TABLE ADD COLUMN
    with a default, so every pre-existing notification row backfills
    to priority="medium" automatically with no data loss.
    """

    dependencies = [
        ("notifications", "0002_alter_notification_table"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="priority",
            field=models.CharField(
                choices=[
                    ("low", "Low"),
                    ("medium", "Medium"),
                    ("high", "High"),
                ],
                default="medium",
                max_length=10,
            ),
        ),
    ]
