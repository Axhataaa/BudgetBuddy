from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        WORKING_PROFESSIONAL = "working_professional", "Working Professional"
        FREELANCER = "freelancer", "Freelancer"
        BUSINESS_OWNER = "business_owner", "Business Owner"
        OTHER = "other", "Other"
        ADMIN = "admin", "Admin"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )
    role = models.CharField(
        max_length=25,
        choices=Role.choices,
        default=Role.STUDENT,
    )
    full_name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name or self.user.username