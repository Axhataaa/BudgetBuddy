from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_profile_budget_alert_notifications_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='email_achievement_notifications',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='profile',
            name='email_important_notifications',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='email_monthly_report_notifications',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='email_savings_goal_notifications',
            field=models.BooleanField(default=True),
        ),
    ]
