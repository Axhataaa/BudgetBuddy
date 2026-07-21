from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Ensure every User has exactly one Profile.

    Users created through registration initially receive the default
    Student role, while Django superusers automatically receive the
    Admin role.
    """
    if created:
        full_name = f"{instance.first_name} {instance.last_name}".strip()

        role = (
            Profile.Role.ADMIN
            if instance.is_superuser
            else Profile.Role.STUDENT
        )

        Profile.objects.create(
            user=instance,
            full_name=full_name,
            role=role,
        )