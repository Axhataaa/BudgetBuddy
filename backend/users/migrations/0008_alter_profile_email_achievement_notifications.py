from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_profile_email_verified_emailverificationtoken'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='email_achievement_notifications',
            field=models.BooleanField(default=True),
        ),
    ]
