from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Profile


class RegisterSerializer(serializers.ModelSerializer):
    # Deliberately NOT Profile.Role.choices - Admin is a valid backend
    # role (Django Admin/staff accounts) but must never be self-selected
    # at registration. Restricting the choices here is the actual
    # enforcement boundary; the frontend simply not rendering an Admin
    # option in the dropdown is not enough on its own, since someone
    # could still POST role="admin" directly to this endpoint.
    REGISTRATION_ROLE_CHOICES = [
        choice for choice in Profile.Role.choices if choice[0] != Profile.Role.ADMIN
    ]

    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=REGISTRATION_ROLE_CHOICES, source="profile.role")
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
        # Wasn't enforced before - registration accepted any password,
        # including trivially weak ones, while ChangePasswordSerializer
        # already used Django's real validators. Aligning the two here.
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
        # The post_save signal (signals.py) already created a Profile
        # with the default role by this point - updated here with the
        # registration-time choices the signal has no way to know about,
        # rather than duplicating profile-creation logic in two places.
        user.profile.role = profile_data.get("role", Profile.Role.STUDENT)
        user.profile.phone_number = profile_data.get("phone_number", "")
        user.profile.save(update_fields=["role", "phone_number"])
        return user


class ProfileSerializer(serializers.ModelSerializer):
    """
    Flattens User + Profile into one response, per API Design Doc §3's
    planned /users/me/ endpoint. role/date_joined are deliberately
    read-only. username and email are editable but sourced from the
    related User, so `update()` below handles them specially.
    """

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
            "bio",
            "role",
            "profile_picture",
            "date_joined",
        ]
        read_only_fields = ["role"]

    def validate_username(self, value):
        request = self.context["request"]
        if User.objects.filter(username=value).exclude(pk=request.user.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_profile_picture(self, value):
        # Enforced here per API Design Doc §18 - was documented but not
        # yet implemented until this module. `value` is None when the
        # client is clearing the picture (allow_null=True above) - skip
        # the size/type checks in that case, there's nothing to check.
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
        # `username`/`email` are the only writable fields sourced from
        # the related User (dotted source), so DRF nests both under
        # validated_data["user"] - everything else in validated_data
        # belongs to Profile directly and is handled by the normal
        # ModelSerializer update path via super().
        user_data = validated_data.pop("user", None)
        if user_data:
            update_fields = []
            for field in ("username", "email"):
                if field in user_data:
                    setattr(instance.user, field, user_data[field])
                    update_fields.append(field)
            if update_fields:
                instance.user.save(update_fields=update_fields)
        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        # Reuses Django's own password validators (length, common
        # password, numeric-only checks, etc.) rather than inventing a
        # separate password-strength policy for this one endpoint.
        validate_password(value)
        return value