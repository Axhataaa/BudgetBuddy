from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_profile_bio'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='role',
            field=models.CharField(choices=[('student', 'Student'), ('working_professional', 'Working Professional'), ('freelancer', 'Freelancer'), ('business_owner', 'Business Owner'), ('other', 'Other')], default='student', max_length=25),
        ),
    ]
