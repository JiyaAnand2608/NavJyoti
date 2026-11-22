"""
Regression test for Authority Portal Demo Seeder
Verifies:
1. Complete generation of 10 workers, 50 children, vaccinations, audit logs, follow-ups
2. Strict idempotency upon second run
3. Authority API endpoints (Dashboard, Workers, Children, Audit Logs) correctly return the enriched dataset
"""

import os
import sys
import unittest
from datetime import date

sys_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, sys_path)

os.environ["JWT_SECRET_KEY"] = "authority_seeder_test_secret_32_characters_ok"
os.environ["ENVIRONMENT"] = "testing"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from models import Base, User, Child, Vaccination, FollowUp, GrowthRecord, Appointment, AuditLog
import main
from auth import create_access_token
from seed_authority_demo_data import seed_authority_demo_dataset

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

class TestAuthorityDemoSeeder(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        main.app.dependency_overrides[main.get_db] = override_get_db
        cls.client = TestClient(main.app)

    @classmethod
    def tearDownClass(cls):
        main.app.dependency_overrides.pop(main.get_db, None)

    def test_01_seeder_generates_complete_dataset(self):
        db = TestingSessionLocal()
        try:
            success = seed_authority_demo_dataset(db, jurisdiction="District HQ")
            self.assertTrue(success)

            workers_count = db.query(User).filter(User.role == "worker").count()
            self.assertGreaterEqual(workers_count, 10)

            children_count = db.query(Child).count()
            self.assertGreaterEqual(children_count, 50)

            vax_count = db.query(Vaccination).count()
            self.assertGreaterEqual(vax_count, 100)

            audit_count = db.query(AuditLog).count()
            self.assertGreaterEqual(audit_count, 50)

            fu_count = db.query(FollowUp).count()
            self.assertGreaterEqual(fu_count, 5)

            growth_count = db.query(GrowthRecord).count()
            self.assertGreaterEqual(growth_count, 50)
        finally:
            db.close()

    def test_02_seeder_is_strictly_idempotent(self):
        db = TestingSessionLocal()
        try:
            # Run second time
            seed_authority_demo_dataset(db, jurisdiction="District HQ")
            
            # Verify counts did not duplicate
            workers_count = db.query(User).filter(User.role == "worker").count()
            self.assertEqual(workers_count, 10)

            children_count = db.query(Child).count()
            self.assertEqual(children_count, 50)
        finally:
            db.close()

    def test_03_authority_endpoints_serve_seeded_data(self):
        db = TestingSessionLocal()
        supervisor = db.query(User).filter(User.email == "supervisor.demo@navjyoti.test").first()
        token = create_access_token(supervisor.id, role="supervisor")
        db.close()

        headers = {"Authorization": f"Bearer {token}"}

        # Dashboard
        dash_res = self.client.get("/supervisor/dashboard", headers=headers)
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.json()
        self.assertGreaterEqual(dash_data["total_workers"], 10)
        self.assertGreaterEqual(dash_data["total_children"], 50)

        # Workers list
        w_res = self.client.get("/supervisor/workers", headers=headers)
        self.assertEqual(w_res.status_code, 200)
        self.assertGreaterEqual(len(w_res.json()), 10)

        # Child registry
        c_res = self.client.get("/supervisor/children", headers=headers)
        self.assertEqual(c_res.status_code, 200)
        self.assertGreaterEqual(len(c_res.json()), 50)

        # Audit logs
        a_res = self.client.get("/supervisor/audit-logs", headers=headers)
        self.assertEqual(a_res.status_code, 200)
        self.assertGreaterEqual(len(a_res.json()), 50)

if __name__ == "__main__":
    unittest.main()
