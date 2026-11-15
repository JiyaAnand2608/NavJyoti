import logging
import os
import smtplib
from abc import ABC, abstractmethod
from email.message import EmailMessage
from typing import Optional

logger = logging.getLogger("navjyoti.email")


class EmailProvider(ABC):
    @abstractmethod
    def send_email(self, recipient_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
        pass


class SMTPEmailProvider(EmailProvider):
    """
    Standard SMTP email provider using environment variables.
    Fails safely and logs a warning when credentials are unconfigured,
    without claiming live delivery.
    """
    def __init__(self):
        self.host = os.getenv("SMTP_HOST")
        self.port = int(os.getenv("SMTP_PORT", "587"))
        self.user = os.getenv("SMTP_USER")
        self.password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", "no-reply@navjyoti.gov.in")
        self.use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    def is_configured(self) -> bool:
        return bool(self.host and self.user and self.password)

    def send_email(self, recipient_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
        if not self.is_configured():
            logger.warning(
                "SMTP is not configured (missing SMTP_HOST, SMTP_USER, or SMTP_PASSWORD). "
                "OTP email dispatch skipped in safe mock mode."
            )
            return False

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self.from_email
        msg["To"] = recipient_email
        msg.set_content(text_content)

        if html_content:
            msg.add_alternative(html_content, subtype="html")

        try:
            with smtplib.SMTP(self.host, self.port, timeout=10) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.user, self.password)
                server.send_message(msg)
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch email via SMTP: {e}")
            return False


class MockEmailProvider(EmailProvider):
    """In-memory mock email provider strictly for testing."""
    def __init__(self):
        self.sent_messages = []

    def send_email(self, recipient_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
        self.sent_messages.append({
            "recipient": recipient_email,
            "subject": subject,
            "text": text_content,
            "html": html_content
        })
        return True

    def clear(self):
        self.sent_messages.clear()


def get_email_provider() -> EmailProvider:
    """Returns active email provider based on ENVIRONMENT configuration."""
    if os.getenv("ENVIRONMENT") == "testing":
        return MockEmailProvider()
    return SMTPEmailProvider()
