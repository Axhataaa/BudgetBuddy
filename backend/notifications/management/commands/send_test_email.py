"""
Sends one real test email using the currently configured EMAIL_*
settings (settings.py / .env), independent of the notification system
itself - a direct way to verify SMTP delivery (Brevo, Gmail, or any
other provider) actually works before relying on it for real
notifications.

Reuses the same base.html template shell every notification email
uses (via the generic admin.html child template), so a successful test
also confirms the HTML template renders correctly, not just that SMTP
credentials are valid.

Usage:
    python manage.py send_test_email you@example.com
"""

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.management.base import BaseCommand, CommandError
from django.template.loader import render_to_string

CONSOLE_BACKEND = "django.core.mail.backends.console.EmailBackend"


class Command(BaseCommand):
    help = (
        "Sends a real test email to verify EMAIL_* configuration "
        "(Brevo, Gmail, or any SMTP provider) end-to-end."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "to",
            help="Email address to send the test message to.",
        )

    def handle(self, *args, **options):
        to_address = options["to"]

        if settings.EMAIL_BACKEND == CONSOLE_BACKEND:
            self.stdout.write(
                self.style.WARNING(
                    "EMAIL_BACKEND is still the console backend - this "
                    "will print the email below instead of actually "
                    "sending it. Uncomment and fill in the Brevo or "
                    "Gmail block in your .env (see 'Email Configuration') "
                    "to send a real message."
                )
            )

        context = {
            "title": "BudgetBuddy Test Email",
            "message": (
                "This is a test message confirming your BudgetBuddy "
                "email configuration is working correctly. If you're "
                "reading this in your inbox, SMTP delivery is set up "
                "correctly."
            ),
            "cta_label": "Open BudgetBuddy",
            "cta_url": settings.FRONTEND_URL,
            "accent_color": "#303B8E",
        }

        try:
            html_body = render_to_string("notifications/emails/admin.html", context)
        except Exception as exc:
            raise CommandError(f"Failed to render email template: {exc}") from exc

        message = EmailMultiAlternatives(
            subject="BudgetBuddy Test Email",
            body=(
                "This is a test message confirming your BudgetBuddy "
                "email configuration is working correctly."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_address],
        )
        message.attach_alternative(html_body, "text/html")

        try:
            sent_count = message.send(fail_silently=False)
        except Exception as exc:
            raise CommandError(
                f"Failed to send test email via {settings.EMAIL_BACKEND} "
                f"(host={settings.EMAIL_HOST or 'n/a'}): {exc}"
            ) from exc

        if sent_count:
            destination = settings.EMAIL_HOST or settings.EMAIL_BACKEND
            self.stdout.write(
                self.style.SUCCESS(
                    f"Test email sent to {to_address} via {destination}."
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING("send() returned 0 - message was not sent.")
            )
