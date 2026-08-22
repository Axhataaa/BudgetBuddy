import logging

from django.conf import settings
from django.contrib.auth.models import User
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

logger = logging.getLogger(__name__)

class GoogleAuthenticationError(Exception):
    """Raised when a Google ID token cannot be authenticated."""

def authenticate_google_credential(credential):
    if not credential:
        raise GoogleAuthenticationError("A Google credential is required.")
    client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
    if not client_id:
        raise GoogleAuthenticationError("Google login is not configured on the server.")
    try:
        token_info = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
    except Exception as exc:
        # The client only ever sees the generic message below. This log is
        # the only place the real cause (expired token, cert-fetch/network
        # failure, audience mismatch, malformed token, etc.) is recorded.
        logger.exception("Google credential verification failed: %s", exc)
        raise GoogleAuthenticationError("Invalid Google credential.") from exc
    if token_info.get("aud") != client_id:
        raise GoogleAuthenticationError("Invalid Google audience.")
    if token_info.get("email_verified") is not True:
        raise GoogleAuthenticationError("Google email is not verified.")
    email = (token_info.get("email") or "").strip().lower()
    if not email:
        raise GoogleAuthenticationError("Google account does not provide an email address.")
    return email, (token_info.get("given_name") or "").strip(), (token_info.get("family_name") or "").strip()

def get_or_create_google_user(email, first_name="", last_name=""):
    user = User.objects.filter(email__iexact=email).first()
    if user is not None:
        changed = []
        if first_name and user.first_name != first_name:
            user.first_name = first_name; changed.append("first_name")
        if last_name and user.last_name != last_name:
            user.last_name = last_name; changed.append("last_name")
        if changed: user.save(update_fields=changed)
        return user, False
    base_username = email.split("@", 1)[0][:120] or "googleuser"
    username = base_username
    suffix = 1
    while User.objects.filter(username=username).exists():
        suffix_text = f"_{suffix}"
        username = f"{base_username[:150-len(suffix_text)]}{suffix_text}"
        suffix += 1
    user = User.objects.create_user(username=username, email=email, first_name=first_name, last_name=last_name)
    user.set_unusable_password()
    user.save(update_fields=["password"])
    user.profile.email_verified = True
    user.profile.full_name = f"{first_name} {last_name}".strip()
    user.profile.save(update_fields=["email_verified", "full_name"])
    return user, True
