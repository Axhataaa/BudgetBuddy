from django.db import migrations


def set_achievement_notifications_true(apps, schema_editor):
    """
    Approved existing-user backfill (Option B):

    Every existing Profile row with email_achievement_notifications=False
    is switched to True, matching the new model default introduced in
    migration 0008. Rows already True are left untouched by the filter.

    No other preference field (email_notifications,
    budget_alert_notifications, email_savings_goal_notifications,
    email_monthly_report_notifications, email_important_notifications)
    is read or written by this migration.
    """
    Profile = apps.get_model("users", "Profile")
    Profile.objects.filter(email_achievement_notifications=False).update(
        email_achievement_notifications=True
    )


def revert_achievement_notifications(apps, schema_editor):
    """
    Deterministic reverse: this migration is not information-preserving
    (it cannot know which False rows were originally True vs False before
    the forward migration ran), so the safest, most predictable reverse
    is to reset every Profile row back to email_achievement_notifications
    = False, matching the pre-migration-0008 default. This mirrors the
    reverse behavior explicitly approved for this backfill.
    """
    Profile = apps.get_model("users", "Profile")
    Profile.objects.all().update(email_achievement_notifications=False)


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0008_alter_profile_email_achievement_notifications"),
    ]

    operations = [
        migrations.RunPython(
            set_achievement_notifications_true,
            reverse_code=revert_achievement_notifications,
        ),
    ]
