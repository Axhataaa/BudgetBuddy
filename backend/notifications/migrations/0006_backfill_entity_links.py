import re

from django.db import migrations

ENTITY_KEY_PATTERNS = [
    (re.compile(r"^expense:(\d+):added$"), "expense", "expenses", "Expense"),
    (re.compile(r"^income:(\d+):added$"), "income", "incomes", "Income"),
    (re.compile(r"^budget:(\d+):created$"), "budget", "budgets", "Budget"),
    (re.compile(r"^budget:(\d+):updated$"), "budget", "budgets", "Budget"),
    (re.compile(r"^savings_goal:(\d+):created$"), "savings_goal", "budgets", "SavingsGoal"),
    (re.compile(r"^savings_goal:(\d+):updated$"), "savings_goal", "budgets", "SavingsGoal"),
]


def backfill_entity_links(apps, schema_editor):

    Notification = apps.get_model("notifications", "Notification")
    Expense = apps.get_model("expenses", "Expense")
    Income = apps.get_model("incomes", "Income")
    Budget = apps.get_model("budgets", "Budget")
    SavingsGoal = apps.get_model("budgets", "SavingsGoal")

    model_by_label = {
        "expenses.Expense": Expense,
        "incomes.Income": Income,
        "budgets.Budget": Budget,
        "budgets.SavingsGoal": SavingsGoal,
    }

    candidates = (
        Notification.objects
        .filter(dedup_key__isnull=False)
        .exclude(dedup_key="")
    )

    for notification in candidates.iterator():
        for pattern, field_name, app_label, model_name in ENTITY_KEY_PATTERNS:
            match = pattern.match(notification.dedup_key)
            if not match:
                continue

            entity_id = int(match.group(1))
            model = model_by_label[f"{app_label}.{model_name}"]

            entity = model.objects.filter(
                pk=entity_id, user_id=notification.user_id
            ).first()

            if entity is None:

                break

            setattr(notification, field_name, entity)
            notification.save(update_fields=[field_name])
            break


def noop_reverse(apps, schema_editor):

    pass


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0005_notification_entity_links'),
    ]

    operations = [
        migrations.RunPython(backfill_entity_links, noop_reverse),
    ]
