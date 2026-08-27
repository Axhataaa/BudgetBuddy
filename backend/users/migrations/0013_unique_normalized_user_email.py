from django.db import migrations
from django.db.models import Count
from django.db.models.functions import Lower


INDEX_NAME = "auth_user_email_lower_unique_idx"


def reject_existing_duplicate_emails(apps, schema_editor):
    User = apps.get_model("auth", "User")

    duplicates = (
        User.objects
        .exclude(email="")
        .annotate(normalized_email=Lower("email"))
        .values("normalized_email")
        .annotate(total=Count("id"))
        .filter(total__gt=1)
        .order_by("normalized_email")
    )

    duplicate_values = [row["normalized_email"] for row in duplicates[:20]]
    if duplicate_values:
        raise RuntimeError(
            "Cannot enforce unique BudgetBuddy emails because duplicate "
            f"emails already exist: {', '.join(duplicate_values)}. "
            "Resolve the duplicate accounts first, then run migrate again."
        )


def create_unique_email_index(apps, schema_editor):
    schema_editor.execute(
        f'CREATE UNIQUE INDEX "{INDEX_NAME}" '
        'ON "auth_user" (LOWER("email")) '
        'WHERE "email" <> \'\''
    )


def drop_unique_email_index(apps, schema_editor):
    schema_editor.execute(f'DROP INDEX IF EXISTS "{INDEX_NAME}"')


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0012_passwordresettoken"),
    ]

    operations = [
        migrations.RunPython(
            reject_existing_duplicate_emails,
            migrations.RunPython.noop,
        ),
        migrations.RunPython(
            create_unique_email_index,
            drop_unique_email_index,
        ),
    ]
