import hashlib
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import PasswordResetToken

logger = logging.getLogger(__name__)

PASSWORD_RESET_TTL_HOURS = 1
PASSWORD_RESET_COOLDOWN_SECONDS = 60


def _hash_token(raw_token):
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_password_reset_token(user):
    PasswordResetToken.objects.filter(
        user=user,
        used_at__isnull=True,
    ).delete()

    raw_token = secrets.token_urlsafe(32)

    PasswordResetToken.objects.create(
        user=user,
        email=user.email,
        token_hash=_hash_token(raw_token),
        expires_at=timezone.now() + timedelta(hours=PASSWORD_RESET_TTL_HOURS),
    )

    return raw_token


def send_password_reset_email(user, raw_token):
    reset_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}"
        f"/reset-password?token={raw_token}"
    )

    context = {
        "title": "Reset your password",
        "message": (
            "We received a request to reset your BudgetBuddy password. "
            "Use the button below to create a new password. "
            "This link expires in 1 hour."
        ),
        "cta_label": "Reset Password",
        "cta_url": reset_url,
        "accent_color": "#303B8E",
        "recipient_email": user.email,
    }

    try:
        html_body = render_to_string(
            "notifications/emails/password_reset.html",
            context,
        )
        text_body = strip_tags(html_body)

        message = EmailMultiAlternatives(
            subject="Reset your password - BudgetBuddy",
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)

    except Exception:
        logger.exception(
            "Failed to send password reset email (user_id=%s)",
            user.id,
        )


def can_request_password_reset(user):
    latest = (
        PasswordResetToken.objects
        .filter(user=user)
        .order_by("-created_at")
        .first()
    )

    if latest is None:
        return True, 0

    elapsed = (timezone.now() - latest.created_at).total_seconds()
    remaining = PASSWORD_RESET_COOLDOWN_SECONDS - elapsed

    if remaining <= 0:
        return True, 0

    return False, int(remaining)


class PasswordResetError(Exception):

    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


def reset_password(raw_token, new_password):
    token_hash = _hash_token(raw_token)

    try:
        token = PasswordResetToken.objects.select_related(
            "user",
        ).get(token_hash=token_hash)

    except PasswordResetToken.DoesNotExist as exc:
        raise PasswordResetError(
            "invalid",
            "This password reset link is invalid.",
        ) from exc

    if token.used_at is not None:
        raise PasswordResetError(
            "already_used",
            "This password reset link has already been used.",
        )

    if token.expires_at <= timezone.now():
        raise PasswordResetError(
            "expired",
            "This password reset link has expired. Request a new one.",
        )

    if token.email != token.user.email:
        raise PasswordResetError(
            "invalid",
            "This password reset link is no longer valid.",
        )

    user = token.user
    user.set_password(new_password)
    user.save(update_fields=["password"])

    token.used_at = timezone.now()
    token.save(update_fields=["used_at"])

    return user