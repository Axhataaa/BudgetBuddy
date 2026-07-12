from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Ensure every User has exactly one Profile.

    Runs for all user-creation paths (RegisterView, createsuperuser,
    Django admin, shell), not just the registration API - so role and
    profile data can never silently be missing.
    """
    if created:
        full_name = f"{instance.first_name} {instance.last_name}".strip()
        Profile.objects.create(user=instance, full_name=full_name)
