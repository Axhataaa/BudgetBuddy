from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
import logging

from .models import Profile
from .email_verification_service import generate_verification_token, send_verification_email

logger = logging.getLogger(__name__)


class RegisterSerializer(serializers.ModelSerializer):

    REGISTRATION_ROLE_CHOICES = [
        choice for choice in Profile.Role.choices if choice[0] != Profile.Role.ADMIN
    ]

    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=REGISTRATION_ROLE_CHOICES,
        source="profile.role",
        required=False,
        default=Profile.Role.STUDENT
    )
    phone_number = serializers.CharField(
        required=False, allow_blank=True, max_length=15, source="profile.phone_number"
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "confirm_password",
            "first_name",
            "last_name",
            "role",
            "phone_number",
        ]

    def validate_password(self, value):

        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        profile_data = validated_data.pop("profile", {})

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )

        user.profile.role = profile_data.get("role", Profile.Role.STUDENT)
        user.profile.phone_number = profile_data.get("phone_number", "")
        user.profile.save(update_fields=["role", "phone_number"])

        return user


class ProfileSerializer(serializers.ModelSerializer):

    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")
    date_joined = serializers.DateTimeField(source="user.date_joined", read_only=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Profile
        fields = [
            "username",
            "email",
            "full_name",
            "phone_number",
            "date_of_birth",
            "bio",
            "role",
            "profile_picture",
            "date_joined",
            "theme",
            "currency",
            "monthly_saving_target",
            "budget_warning_threshold",
            "email_notifications",
            "budget_alert_notifications",
            "email_savings_goal_notifications",
            "email_monthly_report_notifications",
            "email_important_notifications",
            "email_achievement_notifications",
            "email_verified",
        ]
        read_only_fields = ["role", "email_verified"]

    def validate_budget_warning_threshold(self, value):
        if not (1 <= value <= 100):
            raise serializers.ValidationError("Must be between 1 and 100.")
        return value

    def validate_monthly_saving_target(self, value):
        if value < 0:
            raise serializers.ValidationError("Cannot be negative.")
        return value

    def validate_username(self, value):
        request = self.context["request"]
        if User.objects.filter(username=value).exclude(pk=request.user.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_profile_picture(self, value):

        if value is None:
            return value
        if value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError("Image must be smaller than 2MB.")
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        content_type = getattr(value, "content_type", None)
        if content_type and content_type not in allowed_types:
            raise serializers.ValidationError("Only JPEG, PNG, or WEBP images are allowed.")
        return value

    def update(self, instance, validated_data):

        user_data = validated_data.pop("user", None)
        if user_data:
            update_fields = []
            email_changed = False
            for field in ("username", "email"):
                if field in user_data:
                    if field == "email" and user_data["email"] != instance.user.email:
                        email_changed = True
                    setattr(instance.user, field, user_data[field])
                    update_fields.append(field)
            if update_fields:
                instance.user.save(update_fields=update_fields)

            if email_changed:
                instance.email_verified = False
                instance.save(update_fields=["email_verified"])
                try:
                    raw_token = generate_verification_token(instance.user)
                    send_verification_email(instance.user, raw_token)
                except Exception:
                    logger.exception(
                        "Failed to issue/send verification email after email change (user_id=%s)",
                        instance.user.id,
                    )

        return super().update(instance, validated_data)
    
    
class UserListSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "date_joined",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):

        validate_password(value)
        return value


class DeleteAccountSerializer(serializers.Serializer):

    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirmation_text = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def validate(self, attrs):
        password = attrs.get("password", "")
        confirmation_text = attrs.get("confirmation_text", "")
        user = self.context["request"].user

        if confirmation_text:
            if confirmation_text != "DELETE":
                raise serializers.ValidationError(
                    {"confirmation_text": 'Type "DELETE" exactly to confirm.'}
                )
            return attrs

        if password:
            if not user.check_password(password):
                raise serializers.ValidationError({"password": "Incorrect password."})
            return attrs

        raise serializers.ValidationError(
            "Enter your password or type \"DELETE\" to confirm account deletion."
        )


class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ConfirmPasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs