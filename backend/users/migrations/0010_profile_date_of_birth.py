from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0009_backfill_email_achievement_notifications"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True),
        ),
    ]
