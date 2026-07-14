from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Ensure every User has exactly one Profile.

    The registration serializer immediately updates the role chosen by
    the user after the profile is created. Until then, every newly
    created profile starts as Student.
    """
    if created:
        full_name = f"{instance.first_name} {instance.last_name}".strip()

        Profile.objects.create(
            user=instance,
            full_name=full_name,
            role=Profile.Role.STUDENT,
        )