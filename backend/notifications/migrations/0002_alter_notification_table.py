from django.db import migrations


class Migration(migrations.Migration):
    """
    Real database operation: renames the physical table from
    reports_notification to notifications_notification.

    This is a plain ALTER TABLE ... RENAME TO ... under both
    PostgreSQL and SQLite - an atomic, metadata-only rename. It does
    NOT copy, recreate, or touch any row; every existing notification,
    its id, and all column values are preserved exactly. Indexes and
    the unique_user_dedup_key constraint are automatically carried
    over by the rename (Postgres/SQLite both keep constraints attached
    through a table rename), so nothing further is needed for them
    here.
    """

    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelTable(
            name="notification",
            table="notifications_notification",
        ),
    ]
