"""
HTTPS-based email backend(s) for environments (e.g. Render's free tier)
where outbound SMTP connections on port 587 hang or are blocked.

This backend is only wired up in *production* via the EMAIL_BACKEND
environment variable. Local development continues to use Django's
built-in django.core.mail.backends.smtp.EmailBackend against Gmail,
completely untouched.

Deliberately implemented with only the Python standard library (urllib)
so no new dependency is added to requirements.txt.
"""
import json
import logging

from urllib import request as urllib_request
from urllib.error import HTTPError, URLError

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


class ResendEmailBackend(BaseEmailBackend):
    """
    Sends mail through the Resend HTTPS API instead of SMTP.

    Failure behavior mirrors Django's own email backends: if
    fail_silently is False (Django's default, and what
    email_verification_service.send_verification_email passes), a
    failed send raises an exception. That exception is already caught
    and logged one layer up in send_verification_email, so a failed or
    misconfigured email provider degrades to "user is created, no
    verification email is sent, error is logged" rather than a 500 on
    registration. Nothing in this backend silently swallows errors on
    its own -- the logging/graceful-degradation happens at the call
    site, where the rest of the verification architecture already
    expects it.
    """

    def __init__(self, fail_silently=False, api_key=None, timeout=None, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = api_key if api_key is not None else getattr(
            settings, "RESEND_API_KEY", ""
        )
        self.timeout = timeout if timeout is not None else getattr(
            settings, "EMAIL_TIMEOUT", 10
        )

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not self.api_key:
            msg = (
                "RESEND_API_KEY is not configured; cannot send email via "
                "ResendEmailBackend."
            )
            if self.fail_silently:
                logger.error(msg)
                return 0
            raise ValueError(msg)

        sent_count = 0
        for message in email_messages:
            try:
                self._send_one(message)
                sent_count += 1
            except Exception:
                logger.exception(
                    "ResendEmailBackend failed to send message (subject=%r, to=%r)",
                    getattr(message, "subject", ""),
                    getattr(message, "to", []),
                )
                if not self.fail_silently:
                    raise
        return sent_count

    def _send_one(self, message):
        payload = self._build_payload(message)
        body = json.dumps(payload).encode("utf-8")

        req = urllib_request.Request(
            RESEND_API_URL,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
        )

        # The timeout is the whole point: a slow/unreachable provider
        # must fail within `self.timeout` seconds, never hang the
        # Gunicorn worker the way the unbounded SMTP connect() did.
        try:
            with urllib_request.urlopen(req, timeout=self.timeout) as resp:
                resp.read()
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Resend API returned HTTP {exc.code}: {detail}"
            ) from exc
        except URLError as exc:
            raise RuntimeError(
                f"Could not reach Resend API within {self.timeout}s: {exc.reason}"
            ) from exc

    @staticmethod
    def _build_payload(message):
        html_body = None
        for alt_body, alt_mimetype in getattr(message, "alternatives", []) or []:
            if alt_mimetype == "text/html":
                html_body = alt_body
                break

        payload = {
            "from": message.from_email,
            "to": list(message.to),
            "subject": message.subject,
            "text": message.body,
        }
        if html_body:
            payload["html"] = html_body
        if message.cc:
            payload["cc"] = list(message.cc)
        if message.bcc:
            payload["bcc"] = list(message.bcc)
        if message.reply_to:
            payload["reply_to"] = list(message.reply_to)
        return payload
