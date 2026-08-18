from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0002_notification_dedup_key_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='action_url',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='notification',
            name='title',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
