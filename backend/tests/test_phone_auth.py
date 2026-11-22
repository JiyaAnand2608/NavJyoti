import os
import sys
import unittest
from datetime import date

sys_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, sys_path)

os.environ["JWT_SECRET_KEY"] = "test_phone_auth_secret_key_32_bytes_long_ok"
os.environ["ENVIRONMENT"] = "testing"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from models import Base, User
from phone_utils import normalize_indian_phone, is_valid_indian_phone
import main

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


class TestPhoneAuth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        main.app.dependency_overrides[main.get_db] = override_get_db
        cls.client = TestClient(main.app)

    @classmethod
    def tearDownClass(cls):
        main.app.dependency_overrides.pop(main.get_db, None)
        Base.metadata.drop_all(bind=test_engine)

    def test_01_phone_normalization_valid_formats(self):
        """Valid Indian mobile variations normalize to canonical +91XXXXXXXXXX."""
        expected = "+919876543210"
        variations = [
            "9876543210",
            "+91 98765 43210",
            "+91-98765-43210",
            "09876543210",
            "919876543210",
            "(+91) 98765 43210",
        ]
        for var in variations:
            self.assertEqual(normalize_indian_phone(var), expected)
            self.assertTrue(is_valid_indian_phone(var))

    def test_02_phone_normalization_invalid_formats(self):
        """Invalid mobile numbers are rejected with clear ValueErrors."""
        invalids = [
            "1234567890",       # Starts with 1 (not 6-9)
            "5876543210",       # Starts with 5
            "987654321",        # 9 digits
            "98765432100",      # 11 digits
            "abcdefghij",       # Non-numeric
            "",                 # Empty
            None                # None
        ]
        for inv in invalids:
            with self.assertRaises(ValueError):
                normalize_indian_phone(inv)
            self.assertFalse(is_valid_indian_phone(inv))

    def test_03_parent_registration_phone_and_password(self):
        """Parent registers using mobile number + password (email optional)."""
        payload = {
            "name": "Sunita Sharma",
            "phone": "+91 98765 43210",
            "password": "SecurePassword123!",
            "village": "Rampur",
            "preferred_language": "hi",
            "consent": True
        }
        res = self.client.post("/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["name"], "Sunita Sharma")
        self.assertEqual(data["phone"], "+919876543210")
        self.assertIsNone(data["email"])
        self.assertEqual(data["role"], "parent")

    def test_04_duplicate_phone_registration_rejected(self):
        """Duplicate mobile number registration returns HTTP 409."""
        payload = {
            "name": "Sunita Another",
            "phone": "9876543210",  # Same number in different format
            "password": "AnotherPassword123!"
        }
        res = self.client.post("/auth/register", json=payload)
        self.assertEqual(res.status_code, 409)
        self.assertIn("mobile number is already registered", res.json()["detail"])

    def test_05_parent_login_via_phone_and_password(self):
        """Parent logs in using phone number and password."""
        # Login using raw 10 digits
        res1 = self.client.post("/auth/login", json={
            "identifier": "9876543210",
            "password": "SecurePassword123!"
        })
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertIn("access_token", data1)
        self.assertEqual(data1["role"], "parent")
        self.assertEqual(data1["user"]["phone"], "+919876543210")

        # Login using international format (+91 ...)
        res2 = self.client.post("/auth/login", json={
            "phone": "+91 98765 43210",
            "password": "SecurePassword123!"
        })
        self.assertEqual(res2.status_code, 200)

        # Login with wrong password
        bad_res = self.client.post("/auth/login", json={
            "identifier": "9876543210",
            "password": "WrongPassword123!"
        })
        self.assertEqual(bad_res.status_code, 401)

    def test_06_email_password_login_compatibility(self):
        """Staff or legacy parent with email/password continues to authenticate cleanly."""
        db = TestingSessionLocal()
        staff = User(
            name="ANM Staff",
            email="anm.staff@navjyoti.gov.in",
            password_hash=main.hash_password("StaffPassword123!"),
            role="worker",
            worker_id="ANM-001"
        )
        db.add(staff)
        db.commit()
        db.close()

        res = self.client.post("/auth/login", json={
            "identifier": "anm.staff@navjyoti.gov.in",
            "password": "StaffPassword123!"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["role"], "worker")

    def test_07_multiple_null_emails_permitted(self):
        """PostgreSQL standard: multiple parents with email=None do not collide on unique email."""
        p1 = {
            "name": "Parent One",
            "phone": "9811111111",
            "password": "Password123!",
            "email": None
        }
        p2 = {
            "name": "Parent Two",
            "phone": "9822222222",
            "password": "Password123!",
            "email": None
        }
        res1 = self.client.post("/auth/register", json=p1)
        res2 = self.client.post("/auth/register", json=p2)
        self.assertEqual(res1.status_code, 201)
        self.assertEqual(res2.status_code, 201)
        self.assertIsNone(res1.json()["email"])
        self.assertIsNone(res2.json()["email"])

    def test_08_legacy_account_without_phone_remains_valid(self):
        """Existing legacy parent with email and null phone can still authenticate."""
        db = TestingSessionLocal()
        legacy_parent = User(
            name="Legacy Parent",
            email="legacy.parent@example.com",
            password_hash=main.hash_password("LegacyPass123!"),
            role="parent",
            phone=None
        )
        db.add(legacy_parent)
        db.commit()
        db.close()

        res = self.client.post("/auth/login", json={
            "identifier": "legacy.parent@example.com",
            "password": "LegacyPass123!"
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["user"]["name"], "Legacy Parent")
        self.assertIsNone(res.json()["user"]["phone"])


if __name__ == "__main__":
    unittest.main()
