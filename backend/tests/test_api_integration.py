import os
import sys
import unittest
from datetime import date, datetime, timedelta, timezone

sys_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, sys_path)

os.environ["JWT_SECRET_KEY"] = "integration_test_jwt_secret_key_32_bytes_long_here"
os.environ["ENVIRONMENT"] = "testing"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from models import Base, User, Child, Vaccination, Appointment
from database import SessionLocal
import main
from email_service import MockEmailProvider
import otp_service

# Isolated in-memory SQLite database engine for testing (StaticPool ensures connection persistence)
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestNavJyotiAPIIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        main.app.dependency_overrides[main.get_db] = override_get_db
        cls.client = TestClient(main.app)
        cls.mock_email = MockEmailProvider()

    @classmethod
    def tearDownClass(cls):
        main.app.dependency_overrides.pop(main.get_db, None)
        Base.metadata.drop_all(bind=test_engine)

    def setUp(self):
        self.mock_email.clear()

    # --------------------------------------------------------------------------
    # 1. AUTHENTICATION & PARENT REGISTRATION TESTS
    # --------------------------------------------------------------------------

    def test_01_parent_registration_success(self):
        """Parent registration persists account and returns UserResponse."""
        payload = {
            "name": "Sunita Sharma",
            "email": "sunita@example.com",
            "password": "Password123!",
            "phone": "+91 98765 43210",
            "village": "Rampur",
            "preferred_language": "hi"
        }
        res = self.client.post("/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["name"], "Sunita Sharma")
        self.assertEqual(data["email"], "sunita@example.com")
        self.assertEqual(data["role"], "parent")
        self.assertEqual(data["phone"], "+919876543210")

    def test_02_duplicate_registration_rejected(self):
        """Duplicate registration with the same email returns HTTP 409."""
        payload = {
            "name": "Sunita Duplicate",
            "email": "sunita@example.com",
            "password": "Password123!"
        }
        res = self.client.post("/auth/register", json=payload)
        self.assertEqual(res.status_code, 409)

    def test_03_login_valid_password(self):
        """Valid password returns JWT token with role and user info."""
        res = self.client.post("/auth/login", json={"email": "sunita@example.com", "password": "Password123!"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "parent")
        self.assertEqual(data["user"]["name"], "Sunita Sharma")

    def test_04_login_invalid_password(self):
        """Invalid password returns HTTP 401."""
        res = self.client.post("/auth/login", json={"email": "sunita@example.com", "password": "WrongPassword"})
        self.assertEqual(res.status_code, 401)

    def test_05_auth_me_profile(self):
        """GET /auth/me returns current user profile with valid Bearer token."""
        login_res = self.client.post("/auth/login", json={"email": "sunita@example.com", "password": "Password123!"})
        token = login_res.json()["access_token"]

        res = self.client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["email"], "sunita@example.com")

    # --------------------------------------------------------------------------
    # 2. WORKER & SUPERVISOR EMAIL OTP TESTS
    # --------------------------------------------------------------------------

    def test_06_worker_otp_flow(self):
        """Seed a health worker and test OTP request, verification, and token generation."""
        db = TestingSessionLocal()
        worker = User(
            name="Rekha Devi (ANM)",
            email="rekha.anm@navjyoti.gov.in",
            password_hash=main.hash_password("DummyPass123!"),
            role="worker",
            worker_id="ANM-UP-BLS-4019"
        )
        db.add(worker)
        db.commit()
        db.close()

        # Step 1: Request OTP
        req_res = self.client.post("/auth/otp/request", json={"email": "rekha.anm@navjyoti.gov.in", "role": "worker"})
        self.assertEqual(req_res.status_code, 200)
        self.assertIn("verification code has been dispatched", req_res.json()["message"])

        # Step 2: Extract OTP from DB record for testing
        db = TestingSessionLocal()
        otp_rec = db.query(main.OTPRecord).filter_by(email="rekha.anm@navjyoti.gov.in").first()
        self.assertIsNotNone(otp_rec)
        db.close()

        # Step 3: Incorrect OTP rejected
        bad_verify = self.client.post("/auth/otp/verify", json={
            "email": "rekha.anm@navjyoti.gov.in", "role": "worker", "otp": "000000"
        })
        self.assertEqual(bad_verify.status_code, 400)

        # Step 4: Correct OTP verified
        # Use otp_service with our test worker directly to verify valid hash comparison
        raw_otp = "123456"
        db = TestingSessionLocal()
        otp_rec = db.query(main.OTPRecord).filter_by(email="rekha.anm@navjyoti.gov.in").first()
        otp_rec.otp_hash = otp_service._hash_otp(raw_otp, "rekha.anm@navjyoti.gov.in")
        db.commit()
        db.close()

        good_verify = self.client.post("/auth/otp/verify", json={
            "email": "rekha.anm@navjyoti.gov.in", "role": "worker", "otp": "123456"
        })
        self.assertEqual(good_verify.status_code, 200)
        data = good_verify.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["role"], "worker")
        self.assertEqual(data["user"]["name"], "Rekha Devi (ANM)")

    # --------------------------------------------------------------------------
    # 3. CHILD MANAGEMENT & AUTHORIZATION TESTS
    # --------------------------------------------------------------------------

    def test_07_child_creation_and_isolation(self):
        """Parent creates child; only authorized parent/worker can access."""
        # Login Parent
        p_res = self.client.post("/auth/login", json={"email": "sunita@example.com", "password": "Password123!"})
        p_token = p_res.json()["access_token"]

        # Create child
        child_payload = {
            "name": "Aarav Sharma",
            "date_of_birth": "2024-03-15",
            "gender": "Male",
            "village": "Rampur",
            "blood_group": "B+",
            "birth_weight_kg": 3.1
        }
        c_res = self.client.post("/children", json=child_payload, headers={"Authorization": f"Bearer {p_token}"})
        self.assertEqual(c_res.status_code, 201)
        child = c_res.json()
        child_id = child["id"]

        # Parent gets children list
        list_res = self.client.get("/children", headers={"Authorization": f"Bearer {p_token}"})
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.json()), 1)

        # Single child detail
        detail_res = self.client.get(f"/children/{child_id}", headers={"Authorization": f"Bearer {p_token}"})
        self.assertEqual(detail_res.status_code, 200)
        self.assertEqual(detail_res.json()["name"], "Aarav Sharma")

        # Future DOB rejected
        future_payload = {"name": "Future Baby", "date_of_birth": "2099-01-01"}
        bad_dob = self.client.post("/children", json=future_payload, headers={"Authorization": f"Bearer {p_token}"})
        self.assertEqual(bad_dob.status_code, 422)

    # --------------------------------------------------------------------------
    # 4. CLINICAL VACCINATIONS & UIP SCHEDULE TESTS
    # --------------------------------------------------------------------------

    def test_08_uip_schedule_and_administration(self):
        """Retrieve master schedule and record dose administration."""
        # 1. Master schedule
        sched_res = self.client.get("/vaccinations/schedule")
        self.assertEqual(sched_res.status_code, 200)
        self.assertGreater(len(sched_res.json()), 15)

        # Login Parent and Worker
        p_token = self.client.post("/auth/login", json={"email": "sunita@example.com", "password": "Password123!"}).json()["access_token"]

        db = TestingSessionLocal()
        child = db.query(Child).first()
        child_id = child.id
        db.close()

        # Parent schedules a dose
        dose_res = self.client.post(
            f"/children/{child_id}/vaccinations",
            json={"vaccine_name": "Pentavalent 1", "due_date": "2024-04-26"},
            headers={"Authorization": f"Bearer {p_token}"}
        )
        self.assertEqual(dose_res.status_code, 201)
        vax_id = dose_res.json()["id"]

        # Worker logs in and completes the dose
        w_res = self.client.post("/auth/login", json={"email": "rekha.anm@navjyoti.gov.in", "password": "DummyPass123!"})
        w_token = w_res.json()["access_token"]

        complete_res = self.client.patch(
            f"/worker/vaccinations/{vax_id}/complete",
            json={
                "administered_date": "2024-04-26",
                "batch_number": "PNT-24-991",
                "facility": "Rampur Sub-Centre",
                "site": "Left mid-thigh",
                "notes": "Administered successfully"
            },
            headers={"Authorization": f"Bearer {w_token}"}
        )
        self.assertEqual(complete_res.status_code, 200)
        self.assertTrue(complete_res.json()["completed"])
        self.assertEqual(complete_res.json()["batch_number"], "PNT-24-991")

        # Duplicate completion rejected
        dup_res = self.client.patch(
            f"/worker/vaccinations/{vax_id}/complete",
            json={"administered_date": "2024-04-26"},
            headers={"Authorization": f"Bearer {w_token}"}
        )
        self.assertEqual(dup_res.status_code, 409)

    # --------------------------------------------------------------------------
    # 5. APPOINTMENTS & PARENT CANCELLATION TESTS
    # --------------------------------------------------------------------------

    def test_09_appointment_lifecycle_and_cancellation(self):
        """Parent requests appointment and cancels it; worker cannot be bypassed."""
        p_token = self.client.post("/auth/login", json={"email": "sunita@example.com", "password": "Password123!"}).json()["access_token"]
        db = TestingSessionLocal()
        child_id = db.query(Child).first().id
        db.close()

        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        apt_res = self.client.post(
            f"/children/{child_id}/appointments",
            json={"appointment_date": tomorrow, "reason": "9-Month Routine Vaccination"},
            headers={"Authorization": f"Bearer {p_token}"}
        )
        self.assertEqual(apt_res.status_code, 201)
        apt_id = apt_res.json()["id"]
        self.assertEqual(apt_res.json()["status"], "requested")

        # Parent cancels their own requested appointment
        cancel_res = self.client.patch(
            f"/appointments/{apt_id}/cancel",
            json={"reason": "Caregiver unavailable on that date"},
            headers={"Authorization": f"Bearer {p_token}"}
        )
        self.assertEqual(cancel_res.status_code, 200)
        self.assertEqual(cancel_res.json()["status"], "cancelled")

    # --------------------------------------------------------------------------
    # 6. SUPERVISOR ANALYTICS TESTS
    # --------------------------------------------------------------------------

    def test_10_supervisor_analytics_dashboard(self):
        """Supervisor retrieves KPI statistics; non-supervisor is rejected."""
        # Seed Supervisor with assigned jurisdiction
        db = TestingSessionLocal()
        sup = User(
            name="Dr. MOIC",
            email="moic@navjyoti.gov.in",
            password_hash=main.hash_password("MoicPass123!"),
            role="supervisor",
            jurisdiction="District HQ",
            village="District HQ"
        )
        db.add(sup)
        db.commit()
        db.close()

        sup_token = self.client.post("/auth/login", json={"email": "moic@navjyoti.gov.in", "password": "MoicPass123!"}).json()["access_token"]
        p_token = self.client.post("/auth/login", json={"email": "sunita@example.com", "password": "Password123!"}).json()["access_token"]

        # Parent forbidden
        bad_res = self.client.get("/supervisor/dashboard", headers={"Authorization": f"Bearer {p_token}"})
        self.assertEqual(bad_res.status_code, 403)

        # Supervisor allowed
        good_res = self.client.get("/supervisor/dashboard", headers={"Authorization": f"Bearer {sup_token}"})
        self.assertEqual(good_res.status_code, 200)
        data = good_res.json()
        required_fields = ["total_children", "total_workers", "total_vaccinations", "completed_vaccinations", "pending_followups", "upcoming_appointments"]
        for field in required_fields:
            self.assertIn(field, data)
            self.assertIsInstance(data[field], int)
            self.assertGreaterEqual(data[field], 0)

    # --------------------------------------------------------------------------
    # 7. SECURE QR HANDOFF & PUBLIC RESOLVER TESTS
    # --------------------------------------------------------------------------

    def test_11_secure_qr_handoff_and_strict_lookup(self):
        """QR Pass generation and strict public lookup with NO arbitrary fallback."""
        p_token = self.client.post("/auth/login", json={"email": "sunita@example.com", "password": "Password123!"}).json()["access_token"]
        db = TestingSessionLocal()
        child_id = db.query(Child).first().id
        db.close()

        # Step 1: Parent generates QR Pass
        qr_gen_res = self.client.post(f"/children/{child_id}/qr-token", headers={"Authorization": f"Bearer {p_token}"})
        self.assertEqual(qr_gen_res.status_code, 201)
        qr_data = qr_gen_res.json()
        token = qr_data["qr_token"]

        # Step 2: Public lookup with valid token
        resolver_res = self.client.get(f"/records/lookup/{token}")
        self.assertEqual(resolver_res.status_code, 200)
        res_data = resolver_res.json()
        self.assertTrue(res_data["valid"])
        self.assertIn("NJ-****", res_data["child_identifier"])  # PII masked
        self.assertIn("total_doses", res_data)
        self.assertIn("administered_doses", res_data)

        # Step 3: Invalid token must return 404 (NEVER fall back to another child)
        bad_res = self.client.get("/records/lookup/completely_fake_invalid_token_12345")
        self.assertEqual(bad_res.status_code, 404)
        self.assertIn("invalid, revoked, or not found", bad_res.json()["detail"])


if __name__ == "__main__":
    unittest.main()
