import unittest
from datetime import date, datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import (
    Base,
    User,
    Child,
    Vaccination,
    GrowthRecord,
    MilestoneRecord,
    Appointment,
    FollowUp,
    OTPRecord,
    Notification,
    Communication,
    QRTokenRecord
)


class TestModels(unittest.TestCase):
    def setUp(self):
        """Set up an isolated in-memory SQLite database for testing."""
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_create_user_and_child(self):
        """Verify User and Child creation and relationship."""
        parent = User(
            name="Sunita Sharma",
            email="sunita@example.com",
            password_hash="argon2_hashed_value",
            role="parent",
            phone="+91 98765 43210",
            village="Rampur"
        )
        self.session.add(parent)
        self.session.commit()
        self.assertIsNotNone(parent.id)

        child = Child(
            name="Aarav Sharma",
            date_of_birth=date(2024, 3, 15),
            parent_id=parent.id,
            gender="Male",
            village="Rampur",
            blood_group="B+",
            birth_weight_kg=3.1,
            migration_status="resident",
            priority_level="amber"
        )
        self.session.add(child)
        self.session.commit()
        self.assertIsNotNone(child.id)

        # Check relationships
        self.assertEqual(len(parent.children), 1)
        self.assertEqual(parent.children[0].name, "Aarav Sharma")
        self.assertEqual(child.parent.name, "Sunita Sharma")

    def test_vaccination_and_growth_records(self):
        """Verify clinical records linked to child."""
        parent = User(name="Pooja", email="pooja@example.com", password_hash="h", role="parent")
        worker = User(name="Rekha Devi", email="rekha@example.com", password_hash="h", role="worker")
        self.session.add_all([parent, worker])
        self.session.commit()

        child = Child(name="Ananya", date_of_birth=date(2024, 6, 20), parent_id=parent.id, assigned_worker_id=worker.id)
        self.session.add(child)
        self.session.commit()

        vax = Vaccination(
            child_id=child.id,
            vaccine_name="BCG",
            due_date=date(2024, 6, 20),
            administered_date=date(2024, 6, 21),
            completed=True,
            batch_number="BCG-24B",
            facility="Rampur Sub-Centre",
            worker_name="Rekha Devi"
        )
        growth = GrowthRecord(
            child_id=child.id,
            recorded_by=worker.id,
            measurement_date=date(2024, 6, 21),
            weight_kg=3.2,
            height_cm=50.0
        )
        self.session.add_all([vax, growth])
        self.session.commit()

        self.assertEqual(len(child.vaccinations), 1)
        self.assertEqual(child.vaccinations[0].batch_number, "BCG-24B")
        self.assertEqual(len(child.growth_records), 1)
        self.assertEqual(child.growth_records[0].weight_kg, 3.2)

    def test_otp_record_creation(self):
        """Verify OTPRecord model persists and validates."""
        now = datetime.now(timezone.utc)
        otp = OTPRecord(
            email="worker@navjyoti.gov.in",
            role="worker",
            otp_hash="sha256_hashed_123456",
            created_at=now,
            expires_at=now,
            last_sent_at=now,
            attempts=0,
            is_used=False
        )
        self.session.add(otp)
        self.session.commit()
        self.assertIsNotNone(otp.id)
        self.assertFalse(otp.is_used)

    def test_notification_and_communication(self):
        """Verify Notification and Communication models."""
        user = User(name="Staff", email="staff@navjyoti.gov.in", password_hash="h", role="worker")
        self.session.add(user)
        self.session.commit()

        notif = Notification(
            user_id=user.id,
            title="Vaccine Session Tomorrow",
            message="Immunisation drive in Rampur at 10 AM.",
            type="reminder",
            read=False,
            created_at=datetime.now(timezone.utc)
        )
        comm = Communication(
            sender_id=user.id,
            recipient_name="Sunita Sharma",
            recipient_phone="+91 98765 43210",
            message_type="reminder",
            message="Reminder: Pentavalent-1 is due next week.",
            channel="SMS",
            status="Delivered",
            sent_at=datetime.now(timezone.utc)
        )
        self.session.add_all([notif, comm])
        self.session.commit()

        self.assertIsNotNone(notif.id)
        self.assertIsNotNone(comm.id)
        self.assertEqual(len(user.notifications), 1)

    def test_qr_token_record(self):
        """Verify QRTokenRecord model."""
        parent = User(name="Parent", email="p@example.com", password_hash="h", role="parent")
        self.session.add(parent)
        self.session.commit()

        child = Child(name="Baby", date_of_birth=date(2024, 1, 1), parent_id=parent.id)
        self.session.add(child)
        self.session.commit()

        qr = QRTokenRecord(
            child_id=child.id,
            token_hash="hash_of_random_token_123",
            created_by=parent.id,
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc),
            is_revoked=False
        )
        self.session.add(qr)
        self.session.commit()
        self.assertIsNotNone(qr.id)
        self.assertFalse(qr.is_revoked)


if __name__ == "__main__":
    unittest.main()
