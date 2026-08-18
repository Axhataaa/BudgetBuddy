from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='dedup_key',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(choices=[('budget_alert', 'Budget Alert'), ('savings_goal', 'Savings Goal'), ('general', 'General')], default='general', max_length=20),
        ),
        migrations.AddConstraint(
            model_name='notification',
            constraint=models.UniqueConstraint(condition=models.Q(('dedup_key__isnull', False)), fields=('user', 'dedup_key'), name='unique_user_dedup_key'),
        ),
    ]
