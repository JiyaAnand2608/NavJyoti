import os
import unittest
from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

sys_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
import sys
sys.path.insert(0, sys_path)

os.environ["JWT_SECRET_KEY"] = "test_otp_salt_secret_key_32_bytes_long"
os.environ["ENVIRONMENT"] = "testing"

from models import Base, User, OTPRecord
from email_service import MockEmailProvider
import otp_service


class TestOTPService(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.email_provider = MockEmailProvider()

        # Seed test worker
        self.worker = User(
            name="Rekha Devi",
            email="rekha@navjyoti.gov.in",
            password_hash="argon2_dummy",
            role="worker",
            worker_id="ANM-UP-BLS-4019"
        )
        self.db.add(self.worker)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_nonexistent_email_returns_generic_message(self):
        """Unknown accounts receive generic response without account disclosure."""
        success, msg, cooldown = otp_service.request_otp(
            self.db, "unknown@example.com", "worker", self.email_provider
        )
        self.assertTrue(success)
        self.assertIn("If unknown@example.com is registered", msg)
        self.assertEqual(len(self.email_provider.sent_messages), 0)

    def test_worker_otp_generation_and_dispatch(self):
        """Valid worker receives 6-digit OTP via email provider."""
        success, msg, cooldown = otp_service.request_otp(
            self.db, "rekha@navjyoti.gov.in", "worker", self.email_provider
        )
        self.assertTrue(success)
        self.assertEqual(len(self.email_provider.sent_messages), 1)

        # Check that OTP is 6 digits in email text
        sent_text = self.email_provider.sent_messages[0]["text"]
        self.assertIn("Your verification code", sent_text)

        # Check DB record
        record = self.db.query(OTPRecord).filter_by(email="rekha@navjyoti.gov.in").first()
        self.assertIsNotNone(record)
        self.assertFalse(record.is_used)
        self.assertEqual(record.attempts, 0)

    def test_otp_cooldown_enforcement(self):
        """Requesting OTP again within cooldown raises HTTP 429."""
        otp_service.request_otp(self.db, "rekha@navjyoti.gov.in", "worker", self.email_provider)

        with self.assertRaises(HTTPException) as ctx:
            otp_service.request_otp(self.db, "rekha@navjyoti.gov.in", "worker", self.email_provider)
        self.assertEqual(ctx.exception.status_code, 429)
        self.assertIn("Please wait", ctx.exception.detail)

    def test_successful_otp_verification(self):
        """Correct OTP verifies user and is marked as used."""
        otp_service.request_otp(self.db, "rekha@navjyoti.gov.in", "worker", self.email_provider)
        sent_text = self.email_provider.sent_messages[0]["text"]

        # Extract 6-digit OTP code from email body
        import re
        match = re.search(r"\b\d{6}\b", sent_text)
        self.assertIsNotNone(match)
        raw_code = match.group(0)

        verified_user = otp_service.verify_otp(
            self.db, "rekha@navjyoti.gov.in", "worker", raw_code
        )
        self.assertEqual(verified_user.id, self.worker.id)
        self.assertEqual(verified_user.role, "worker")

        # OTP should now be marked as used
        record = self.db.query(OTPRecord).filter_by(email="rekha@navjyoti.gov.in").first()
        self.assertTrue(record.is_used)

        # Replay attempt must fail
        with self.assertRaises(HTTPException) as ctx:
            otp_service.verify_otp(self.db, "rekha@navjyoti.gov.in", "worker", raw_code)
        self.assertEqual(ctx.exception.status_code, 400)

    def test_incorrect_otp_increments_attempts(self):
        """Incorrect OTP increments attempts and rejects."""
        otp_service.request_otp(self.db, "rekha@navjyoti.gov.in", "worker", self.email_provider)

        with self.assertRaises(HTTPException) as ctx:
            otp_service.verify_otp(self.db, "rekha@navjyoti.gov.in", "worker", "000000")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("attempts remaining", ctx.exception.detail)

        record = self.db.query(OTPRecord).filter_by(email="rekha@navjyoti.gov.in").first()
        self.assertEqual(record.attempts, 1)

    def test_expired_otp_is_rejected(self):
        """Expired OTP is rejected."""
        otp_service.request_otp(self.db, "rekha@navjyoti.gov.in", "worker", self.email_provider)
        sent_text = self.email_provider.sent_messages[0]["text"]
        import re
        raw_code = re.search(r"\b\d{6}\b", sent_text).group(0)

        # Force record to be expired
        record = self.db.query(OTPRecord).filter_by(email="rekha@navjyoti.gov.in").first()
        record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=10)
        self.db.commit()

        with self.assertRaises(HTTPException) as ctx:
            otp_service.verify_otp(self.db, "rekha@navjyoti.gov.in", "worker", raw_code)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("expired", ctx.exception.detail)

    def test_role_mismatch_fails_authorization(self):
        """Requesting worker OTP using an existing user who is a parent is rejected with anti-enumeration."""
        parent = User(name="Parent User", email="parent.user@example.com", password_hash="h", role="parent")
        self.db.add(parent)
        self.db.commit()

        success, msg, cooldown = otp_service.request_otp(
            self.db, "parent.user@example.com", "worker", self.email_provider
        )
        self.assertTrue(success)
        self.assertIn("If parent.user@example.com is registered as an authorized worker", msg)
        self.assertEqual(len(self.email_provider.sent_messages), 0)

    def test_email_delivery_failure_handled_gracefully(self):
        """When email provider fails to dispatch, OTP request handles it without unhandled crash."""
        class FailingEmailProvider(otp_service.EmailProvider):
            def send_email(self, recipient_email, subject, text_content, html_content=None):
                return False

        failing_prov = FailingEmailProvider()
        success, msg, cooldown = otp_service.request_otp(
            self.db, "rekha@navjyoti.gov.in", "worker", failing_prov
        )
        self.assertTrue(success)
        self.assertIn("verification code has been dispatched", msg)


if __name__ == "__main__":
    unittest.main()
