import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('budgets', '0005_alter_budget_category'),
        ('expenses', '0002_alter_expense_category'),
        ('incomes', '0002_alter_income_source'),
        ('notifications', '0004_alter_notification_notification_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='budget',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='budgets.budget'),
        ),
        migrations.AddField(
            model_name='notification',
            name='expense',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='expenses.expense'),
        ),
        migrations.AddField(
            model_name='notification',
            name='income',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='incomes.income'),
        ),
        migrations.AddField(
            model_name='notification',
            name='savings_goal',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='budgets.savingsgoal'),
        ),
    ]
