"""
Email verification for BudgetBuddy accounts.

Deliberately NOT routed through notifications/notification_service.py's
create_notification()/email_service.py pipeline: that pipeline exists
to gate notification EMAILS behind user preferences and an
email_verified check - neither of which makes sense here. A
verification email must always send when explicitly triggered
(register, resend, email change), and gating it behind
"is the email verified yet" would be circular. This module reuses that
pipeline's PATTERN (EmailMultiAlternatives, HTML template via
render_to_string, same base.html shell, same try/except-and-log
resilience) without reusing its eligibility logic, which doesn't apply.

Token design: only a SHA-256 hash is ever persisted (see
EmailVerificationToken's own docstring in models.py). The raw token
exists only long enough to build the verification URL and hand it to
the email template - never logged, never stored in plain form.
"""

import hashlib
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import EmailVerificationToken

logger = logging.getLogger(__name__)

TOKEN_TTL_HOURS = 24
RESEND_COOLDOWN_SECONDS = 60


def _hash_token(raw_token):
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_verification_token(user):
    """
    Issues a new verification token for the user's CURRENT email,
    invalidating any previous unused token for this user first (so
    only the most recently issued link is ever valid - an old email
    with a stale link can't be used alongside a newer one).

    Returns the raw token (a URL-safe random string) - the only place
    in this whole flow the raw value exists outside the recipient's
    inbox.
    """
    EmailVerificationToken.objects.filter(user=user, used_at__isnull=True).delete()

    raw_token = secrets.token_urlsafe(32)
    EmailVerificationToken.objects.create(
        user=user,
        email=user.email,
        token_hash=_hash_token(raw_token),
        expires_at=timezone.now() + timedelta(hours=TOKEN_TTL_HOURS),
    )
    return raw_token


def send_verification_email(user, raw_token):
    """
    Sends the verification email to user.email (the address the token
    was just issued for). Never raises - same resilience contract as
    notifications/email_service.py's send_notification_email(): a
    failed send here must not break registration or the profile-update
    request that triggered it.
    """
    verification_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={raw_token}"
    )

    context = {
        "title": "Verify your email",
        "message": (
            f"Confirm that {user.email} is your email address to finish "
            "setting up notification emails for your BudgetBuddy account. "
            "This link expires in 24 hours."
        ),
        "cta_label": "Verify Email",
        "cta_url": verification_url,
        "accent_color": "#303B8E",
        "recipient_email": user.email,
    }

    try:
        html_body = render_to_string(
            "notifications/emails/verify_email.html", context
        )
        text_body = strip_tags(html_body)

        message = EmailMultiAlternatives(
            subject="Verify your email - BudgetBuddy",
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)
    except Exception:
        logger.exception(
            "Failed to send verification email (user_id=%s)", user.id
        )


class VerificationError(Exception):
    """Raised by verify_token() with a `code` VerifyEmailView maps to a
    specific, distinct user-facing message (invalid / expired /
    already used) rather than one generic failure."""

    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


def verify_token(raw_token):
    """
    Validates raw_token and marks the matching user's email verified.

    Checks, in order:
      1. A token with this hash exists at all -> INVALID otherwise.
      2. It hasn't already been used -> ALREADY_USED otherwise.
      3. It hasn't expired -> EXPIRED otherwise.
      4. The email it was issued for still matches the user's CURRENT
         email -> INVALID otherwise (the user changed their email
         again since this link was sent; this old link can never
         verify whatever their email is now - only a fresh one can).

    Returns the Profile that was marked verified.
    """
    token_hash = _hash_token(raw_token)

    try:
        token = EmailVerificationToken.objects.select_related(
            "user", "user__profile"
        ).get(token_hash=token_hash)
    except EmailVerificationToken.DoesNotExist as exc:
        raise VerificationError(
            "invalid", "This verification link is invalid."
        ) from exc

    if token.used_at is not None:
        raise VerificationError(
            "already_used", "This verification link has already been used."
        )

    if token.expires_at <= timezone.now():
        raise VerificationError(
            "expired",
            "This verification link has expired. Request a new one from Settings.",
        )

    if token.email != token.user.email:
        raise VerificationError(
            "invalid",
            "This verification link is for an email address that's no longer "
            "on your account. Request a new one from Settings.",
        )

    token.used_at = timezone.now()
    token.save(update_fields=["used_at"])

    profile = token.user.profile
    profile.email_verified = True
    profile.save(update_fields=["email_verified"])
    return profile


def can_resend(user):
    """Simple DB-timestamp cooldown - no cache/task-queue dependency,
    consistent with this project's standing "no Celery/Redis" rule.
    Returns (allowed: bool, seconds_remaining: int)."""
    latest = (
        EmailVerificationToken.objects.filter(user=user)
        .order_by("-created_at")
        .first()
    )
    if latest is None:
        return True, 0

    elapsed = (timezone.now() - latest.created_at).total_seconds()
    remaining = RESEND_COOLDOWN_SECONDS - elapsed
    if remaining <= 0:
        return True, 0
    return False, int(remaining)
