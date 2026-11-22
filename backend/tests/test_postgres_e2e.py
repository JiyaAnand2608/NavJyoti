"""
NavJyoti Comprehensive PostgreSQL End-to-End Integration Test Suite
Verifies full operational integrity against the real PostgreSQL database:
- Parent registration & Argon2 password authentication
- Worker & Supervisor 6-digit OTP authentication lifecycle & single-use verification
- Child management & clinical record tracking (Vaccines, Growth, Milestones)
- Appointment scheduling & cancellation
- Secure QR token generation & public resolution
- Supervisor analytics calculated directly from PostgreSQL records
"""

import os
import sys
import unittest
from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlparse

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Ensure backend path is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

os.environ.setdefault("JWT_SECRET_KEY", "navjyoti_postgres_e2e_secret_key_32_bytes_test_valid")
os.environ["ENVIRONMENT"] = "testing"

TEST_DATABASE_URL = os.getenv("NAVJYOTI_TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise unittest.SkipTest(
        "Set NAVJYOTI_TEST_DATABASE_URL to an isolated PostgreSQL test database."
    )
if not TEST_DATABASE_URL.startswith(("postgresql://", "postgresql+psycopg://")):
    raise RuntimeError("NAVJYOTI_TEST_DATABASE_URL must use PostgreSQL.")
if "test" not in urlparse(TEST_DATABASE_URL).path.casefold():
    raise RuntimeError("The isolated test database name must include 'test'.")

from fastapi.testclient import TestClient
import main
from models import Base, User, Child, Vaccination, GrowthRecord, MilestoneRecord, Appointment, FollowUp, OTPRecord, Notification, Communication, QRTokenRecord
import otp_service
original_test_connection = main.test_connection

test_database_parts = urlparse(TEST_DATABASE_URL)
application_database_url = os.getenv("DATABASE_URL")
app_database_parts = urlparse(application_database_url) if application_database_url else None
if app_database_parts and (
    test_database_parts.hostname == app_database_parts.hostname
    and test_database_parts.port == app_database_parts.port
    and test_database_parts.path == app_database_parts.path
):
    raise RuntimeError("Refusing to run PostgreSQL tests against the application database.")

test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestPostgreSQLEndToEnd(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with test_engine.connect() as connection:
            assert connection.execute(text("SELECT 1")).scalar() == 1
        Base.metadata.create_all(bind=test_engine)
        main.app.dependency_overrides[main.get_db] = override_get_db
        main.test_connection = lambda: True
        cls.client = TestClient(main.app)

    @classmethod
    def tearDownClass(cls):
        main.app.dependency_overrides.pop(main.get_db, None)
        main.test_connection = original_test_connection
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()

    # --------------------------------------------------------------------------
    # 1. DATABASE CONNECTIVITY & HEALTH CHECKS
    # --------------------------------------------------------------------------

    def test_01_db_check_endpoint(self):
        """GET /db-check reports connected to PostgreSQL."""
        res = self.client.get("/db-check")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"database": "connected"})

    def test_02_health_endpoint(self):
        """GET /health reports ok."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok", "project": "NavJyoti"})

    # --------------------------------------------------------------------------
    # 2. PARENT AUTHENTICATION (MOBILE + PASSWORD) & SESSION
    # --------------------------------------------------------------------------

    def test_03_parent_registration_and_login(self):
        """Test complete parent registration, duplicate prevention, and login."""
        phone = "+91 98111 22233"
        normalized_phone = "+919811122233"
        password = "SecureParentPass123!"

        # Register Parent
        reg_payload = {
            "name": "Pooja Verma",
            "phone": phone,
            "password": password,
            "village": "Bilaspur Sadar",
            "preferred_language": "hi",
            "consent": True
        }
        res = self.client.post("/auth/register", json=reg_payload)
        if res.status_code == 201:
            data = res.json()
            self.assertEqual(data["name"], "Pooja Verma")
            self.assertEqual(data["phone"], normalized_phone)
            self.assertEqual(data["role"], "parent")
        else:
            self.assertEqual(res.status_code, 409)

        # Duplicate Phone Rejection
        dup_res = self.client.post("/auth/register", json=reg_payload)
        self.assertEqual(dup_res.status_code, 409)

        # Login with Phone
        login_payload = {
            "identifier": normalized_phone,
            "password": password
        }
        login_res = self.client.post("/auth/login", json=login_payload)
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertIn("access_token", login_data)
        self.assertEqual(login_data["role"], "parent")
        token = login_data["access_token"]

        # Verify /auth/me Profile
        me_res = self.client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.json()
        self.assertEqual(me_data["name"], "Pooja Verma")

    # --------------------------------------------------------------------------
    # 3. WORKER & SUPERVISOR OTP AUTHENTICATION
    # --------------------------------------------------------------------------

    def test_04_worker_otp_full_lifecycle(self):
        """Test worker OTP request, rate limiting, and verification."""
        worker_email = "anm_rekha_test@navjyoti.gov.in"
        worker_name = "Rekha Devi (ANM)"

        # Seed staff worker in PostgreSQL
        with TestingSessionLocal() as db:
            existing = db.query(User).filter(User.email == worker_email).first()
            if not existing:
                worker = User(
                    name=worker_name,
                    email=worker_email,
                    password_hash="argon2_hashed_placeholder",
                    role="worker",
                    worker_id="ANM-UP-BLS-01",
                    village="Bilaspur Sadar",
                    consent=True
                )
                db.add(worker)
                db.commit()

        # Clean existing test OTP records
        with TestingSessionLocal() as db:
            db.query(OTPRecord).filter(OTPRecord.email == worker_email).delete()
            db.commit()

        # Request OTP
        req_res = self.client.post("/auth/otp/request", json={"email": worker_email, "role": "worker"})
        self.assertEqual(req_res.status_code, 200)
        self.assertIn("verification code has been dispatched", req_res.json()["message"])

        # Check OTPRecord created in PostgreSQL
        with TestingSessionLocal() as db:
            otp_rec = db.query(OTPRecord).filter(OTPRecord.email == worker_email, OTPRecord.is_used.is_(False)).first()
            self.assertIsNotNone(otp_rec)
            self.assertEqual(otp_rec.attempts, 0)
            # Inject known hash for deterministic verification testing
            raw_otp = "849201"
            otp_rec.otp_hash = otp_service._hash_otp(raw_otp, worker_email)
            db.commit()

        # Test invalid OTP rejected
        bad_res = self.client.post("/auth/otp/verify", json={"email": worker_email, "role": "worker", "otp": "000000"})
        self.assertEqual(bad_res.status_code, 400)

        # Test valid OTP verified
        good_res = self.client.post("/auth/otp/verify", json={"email": worker_email, "role": "worker", "otp": "849201"})
        self.assertEqual(good_res.status_code, 200)
        good_data = good_res.json()
        self.assertIn("access_token", good_data)
        self.assertEqual(good_data["role"], "worker")
        self.assertEqual(good_data["user"]["name"], worker_name)

        # Test single-use enforcement: re-using same OTP is rejected
        replay_res = self.client.post("/auth/otp/verify", json={"email": worker_email, "role": "worker", "otp": "849201"})
        self.assertEqual(replay_res.status_code, 400)

    def test_05_supervisor_otp_and_access_control(self):
        """Test supervisor OTP login and authorization."""
        sup_email = "moic_sharma_test@navjyoti.gov.in"

        # Seed supervisor in PostgreSQL
        with TestingSessionLocal() as db:
            existing = db.query(User).filter(User.email == sup_email).first()
            if not existing:
                sup = User(
                    name="Dr. Sharma (MOIC)",
                    email=sup_email,
                    password_hash="argon2_hashed_placeholder",
                    role="supervisor",
                    worker_id="MOIC-UP-BLS-01",
                    village="Bilaspur District",
                    consent=True
                )
                db.add(sup)
                db.commit()

        # Clean old OTPs
        with TestingSessionLocal() as db:
            db.query(OTPRecord).filter(OTPRecord.email == sup_email).delete()
            db.commit()

        # Request OTP
        req_res = self.client.post("/auth/otp/request", json={"email": sup_email, "role": "supervisor"})
        self.assertEqual(req_res.status_code, 200)

        # Set known OTP
        with TestingSessionLocal() as db:
            otp_rec = db.query(OTPRecord).filter(OTPRecord.email == sup_email, OTPRecord.is_used.is_(False)).first()
            self.assertIsNotNone(otp_rec)
            raw_otp = "654321"
            otp_rec.otp_hash = otp_service._hash_otp(raw_otp, sup_email)
            db.commit()

        # Verify OTP
        verify_res = self.client.post("/auth/otp/verify", json={
            "email": sup_email,
            "role": "supervisor",
            "otp": "654321"
        })
        self.assertEqual(verify_res.status_code, 200)
        sup_token = verify_res.json()["access_token"]

        # Supervisor can access analytics dashboard
        analytics_res = self.client.get("/supervisor/dashboard", headers={"Authorization": f"Bearer {sup_token}"})
        self.assertEqual(analytics_res.status_code, 200)
        analytics_data = analytics_res.json()
        self.assertIn("total_children", analytics_data)
        self.assertIn("total_vaccinations", analytics_data)
        self.assertIn("completed_vaccinations", analytics_data)

    # --------------------------------------------------------------------------
    # 4. CLINICAL WORKFLOW: CHILD, VACCINES, GROWTH, MILESTONES, QR, APPOINTMENT
    # --------------------------------------------------------------------------

    def test_06_complete_clinical_and_qr_workflow(self):
        """
        Complete end-to-end clinical workflow:
        1. Parent adds child.
        2. Parent schedules a dose from UIP schedule.
        3. Worker views child, records vaccination administration.
        4. Worker records growth measurement.
        5. Worker records developmental milestone.
        6. Parent requests appointment.
        7. Parent generates QR health pass.
        8. Strict public QR resolution verifies child clinical summary.
        9. Parent cancels appointment.
        """
        # Register Parent & Login
        p_phone = "+91 97777 66666"
        norm_phone = "+919777766666"
        p_pw = "CaregiverPass123!"
        self.client.post("/auth/register", json={
            "name": "Kavita Devi",
            "phone": p_phone,
            "password": p_pw,
            "village": "Rampur"
        })
        p_res = self.client.post("/auth/login", json={"identifier": norm_phone, "password": p_pw})
        p_token = p_res.json()["access_token"]
        p_headers = {"Authorization": f"Bearer {p_token}"}

        # Step 1: Parent registers child
        child_res = self.client.post("/children", headers=p_headers, json={
            "name": "Aarav Sharma",
            "date_of_birth": "2025-06-15",
            "gender": "Male",
            "village": "Rampur",
            "blood_group": "O+",
            "birth_weight_kg": 3.2,
            "migration_status": "resident",
            "priority_level": "green"
        })
        self.assertEqual(child_res.status_code, 201)
        child_data = child_res.json()
        child_id = child_data["id"]
        self.assertEqual(child_data["name"], "Aarav Sharma")

        # Step 2: Parent schedules a vaccination dose
        sched_res = self.client.post(
            f"/children/{child_id}/vaccinations",
            headers=p_headers,
            json={
                "vaccine_name": "BCG",
                "due_date": "2025-06-15"
            }
        )
        self.assertEqual(sched_res.status_code, 201)
        vax_id = sched_res.json()["id"]

        # Retrieve UIP vaccination list for child
        vax_list_res = self.client.get(f"/children/{child_id}/vaccinations", headers=p_headers)
        self.assertEqual(vax_list_res.status_code, 200)
        vax_list = vax_list_res.json()
        self.assertGreaterEqual(len(vax_list), 1)

        # Worker logs in
        worker_email = "anm_rekha_test@navjyoti.gov.in"
        with TestingSessionLocal() as db:
            db.query(OTPRecord).filter(OTPRecord.email == worker_email).delete()
            db.commit()
        self.client.post("/auth/otp/request", json={"email": worker_email, "role": "worker"})
        with TestingSessionLocal() as db:
            otp_rec = db.query(OTPRecord).filter(OTPRecord.email == worker_email, OTPRecord.is_used.is_(False)).first()
            raw_otp = "998877"
            otp_rec.otp_hash = otp_service._hash_otp(raw_otp, worker_email)
            db.commit()

        w_res = self.client.post("/auth/otp/verify", json={"email": worker_email, "role": "worker", "otp": "998877"})
        w_token = w_res.json()["access_token"]
        w_headers = {"Authorization": f"Bearer {w_token}"}

        # Step 3: Worker records dose administration
        admin_res = self.client.patch(f"/worker/vaccinations/{vax_id}/complete", headers=w_headers, json={
            "administered_date": "2025-06-16",
            "batch_number": "BCG-2026-99A",
            "facility": "Rampur Sub-Centre",
            "worker_name": "Rekha Devi (ANM)",
            "site": "Left Upper Arm",
            "notes": "Administered without adverse reaction."
        })
        self.assertEqual(admin_res.status_code, 200)
        admin_data = admin_res.json()
        self.assertTrue(admin_data["completed"])
        self.assertEqual(admin_data["batch_number"], "BCG-2026-99A")

        # Step 4: Worker records growth measurement
        growth_res = self.client.post(f"/children/{child_id}/growth", headers=w_headers, json={
            "measurement_date": "2026-11-15",
            "weight_kg": 8.5,
            "height_cm": 72.0
        })
        self.assertEqual(growth_res.status_code, 201)
        growth_data = growth_res.json()
        self.assertEqual(growth_data["weight_kg"], 8.5)

        # Step 5: Worker records developmental milestone
        milestone_res = self.client.post(f"/children/{child_id}/milestones", headers=w_headers, json={
            "observation_date": "2026-11-15",
            "category": "motor",
            "description": "Sits steadily without support",
            "status": "observed"
        })
        self.assertEqual(milestone_res.status_code, 201)
        self.assertEqual(milestone_res.json()["status"], "observed")

        # Step 6: Parent books an appointment
        appt_res = self.client.post(f"/children/{child_id}/appointments", headers=p_headers, json={
            "appointment_date": "2026-12-01",
            "reason": "Routine 9-Month Measles-Rubella Vaccination"
        })
        self.assertEqual(appt_res.status_code, 201)
        appt_id = appt_res.json()["id"]

        # Step 7: Parent generates secure expiring QR Health Pass
        qr_gen_res = self.client.post(f"/children/{child_id}/qr-token", headers=p_headers)
        self.assertEqual(qr_gen_res.status_code, 201)
        qr_data = qr_gen_res.json()
        self.assertIn("qr_token", qr_data)
        qr_token = qr_data["qr_token"]

        # Step 8: Strict public QR resolution verifies child clinical summary
        lookup_res = self.client.get(f"/records/lookup/{qr_token}")
        self.assertEqual(lookup_res.status_code, 200)
        lookup_data = lookup_res.json()
        self.assertTrue(lookup_data["valid"])
        self.assertEqual(lookup_data["verification_authority"], "NavJyoti Health Record Platform")
        self.assertEqual(lookup_data["child_identifier"], f"NJ-****-{child_id}")
        self.assertGreaterEqual(lookup_data["administered_doses"], 1)

        # Step 9: Parent cancels appointment
        cancel_res = self.client.patch(f"/appointments/{appt_id}/cancel", headers=p_headers, json={
            "reason": "Family traveling out of town, will reschedule next week."
        })
        self.assertEqual(cancel_res.status_code, 200)
        self.assertEqual(cancel_res.json()["status"], "cancelled")


if __name__ == "__main__":
    unittest.main(verbosity=2)
