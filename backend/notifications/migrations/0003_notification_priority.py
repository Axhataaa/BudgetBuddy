from django.db import migrations, models


class Migration(migrations.Migration):

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
