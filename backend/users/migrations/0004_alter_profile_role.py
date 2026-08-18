from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_profile_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='role',
            field=models.CharField(choices=[('student', 'Student'), ('working_professional', 'Working Professional'), ('freelancer', 'Freelancer'), ('business_owner', 'Business Owner'), ('other', 'Other'), ('admin', 'Admin')], default='student', max_length=25),
        ),
    ]
