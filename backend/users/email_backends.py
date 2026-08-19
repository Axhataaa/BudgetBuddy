import json
import logging

from urllib import request as urllib_request
from urllib.error import HTTPError, URLError

from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"


class SendGridEmailBackend(BaseEmailBackend):

    def __init__(self, fail_silently=False, api_key=None, timeout=None, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)

        self.api_key = api_key if api_key is not None else getattr(
            settings, "SENDGRID_API_KEY", ""
        )

        self.timeout = timeout if timeout is not None else getattr(
            settings, "EMAIL_TIMEOUT", 10
        )

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        if not self.api_key:
            msg = (
                "SENDGRID_API_KEY is not configured; "
                "cannot send email via SendGridEmailBackend."
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
                    "SendGridEmailBackend failed to send message "
                    "(subject=%r, to=%r)",
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
            SENDGRID_API_URL,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
        )

        try:
            with urllib_request.urlopen(req, timeout=self.timeout) as resp:
                resp.read()

        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")

            raise RuntimeError(
                f"SendGrid API returned HTTP {exc.code}: {detail}"
            ) from exc

        except URLError as exc:
            raise RuntimeError(
                f"Could not reach SendGrid API within "
                f"{self.timeout}s: {exc.reason}"
            ) from exc

    @staticmethod
    def _build_payload(message):
        html_body = None

        for alt_body, alt_mimetype in (
            getattr(message, "alternatives", []) or []
        ):
            if alt_mimetype == "text/html":
                html_body = alt_body
                break

        from_email = getattr(
            settings,
            "SENDGRID_FROM_EMAIL",
            ""
        )

        if not from_email:
            from_email = getattr(
                settings,
                "DEFAULT_FROM_EMAIL",
                ""
            )

        payload = {
            "personalizations": [
                {
                    "to": [
                        {"email": email}
                        for email in message.to
                    ]
                }
            ],
            "from": {
                "email": from_email,
                "name": "BudgetBuddy",
            },
            "subject": message.subject,
            "content": [
                {
                    "type": "text/plain",
                    "value": message.body or "",
                }
            ],
        }

        if html_body:
            payload["content"].append(
                {
                    "type": "text/html",
                    "value": html_body,
                }
            )

        if message.cc:
            payload["personalizations"][0]["cc"] = [
                {"email": email}
                for email in message.cc
            ]

        if message.bcc:
            payload["personalizations"][0]["bcc"] = [
                {"email": email}
                for email in message.bcc
            ]

        if message.reply_to:
            payload["reply_to"] = {
                "email": message.reply_to[0]
            }

        return payload