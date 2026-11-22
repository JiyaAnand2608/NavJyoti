"""
NavJyoti Authority (Supervisor) Portal & Audit Trail Integration Tests
Tests:
1. Supervisor Role Access Enforcement (Parents & Workers forbidden)
2. Jurisdiction-based Access Control & Missing Jurisdiction Safeguard
3. Transactional Audit Trail Recording upon Worker clinical actions (vaccines, follow-ups, growth)
4. Audit Trail Search & Filters (worker_id, child_id, action_type)
5. Authority Child Oversight & Minimum-Necessary Information Access
6. Aggregate Reports & Safe CSV Export
7. Operational Alerts Generation
"""

import os
import sys
import unittest
from datetime import date, datetime, timedelta, timezone

sys_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, sys_path)

os.environ["JWT_SECRET_KEY"] = "authority_test_jwt_secret_key_32_bytes_long_ok"
os.environ["ENVIRONMENT"] = "testing"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from models import Base, User, Child, Vaccination, FollowUp, GrowthRecord, Appointment, AuditLog
import main
from auth import create_access_token, hash_password

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


class TestAuthorityPortal(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        main.app.dependency_overrides[main.get_db] = override_get_db
        cls.client = TestClient(main.app)

        # Seed test actors
        db = TestingSessionLocal()

        # 1. Supervisor in Rampur
        cls.supervisor = User(
            name="Dr. Alok Verma",
            email="supervisor.alok@navjyoti.gov.in",
            password_hash=hash_password("SupervisorPass123!"),
            role="supervisor",
            jurisdiction="Rampur",
            village="Rampur"
        )
        # 2. Supervisor with NO jurisdiction
        cls.supervisor_no_jurisdiction = User(
            name="Dr. Unassigned",
            email="supervisor.unassigned@navjyoti.gov.in",
            password_hash=hash_password("SupervisorPass123!"),
            role="supervisor",
            jurisdiction=None,
            village=None
        )
        # 3. Worker in Rampur
        cls.worker_rampur = User(
            name="Rekha Devi (ANM)",
            email="rekha.rampur@navjyoti.gov.in",
            password_hash=hash_password("WorkerPass123!"),
            role="worker",
            worker_id="ANM-RAM-01",
            jurisdiction="Rampur",
            village="Rampur"
        )
        # 4. Worker in Bilaspur (different jurisdiction)
        cls.worker_bilaspur = User(
            name="Meena Kumari (ANM)",
            email="meena.bilaspur@navjyoti.gov.in",
            password_hash=hash_password("WorkerPass123!"),
            role="worker",
            worker_id="ANM-BIL-02",
            jurisdiction="Bilaspur",
            village="Bilaspur"
        )
        # 5. Parent in Rampur
        cls.parent = User(
            name="Sunita Sharma",
            phone="+919876543210",
            password_hash=hash_password("ParentPass123!"),
            role="parent",
            village="Rampur"
        )
        db.add_all([cls.supervisor, cls.supervisor_no_jurisdiction, cls.worker_rampur, cls.worker_bilaspur, cls.parent])
        db.commit()

        # Refresh and capture IDs before closing session
        db.refresh(cls.supervisor)
        db.refresh(cls.supervisor_no_jurisdiction)
        db.refresh(cls.worker_rampur)
        db.refresh(cls.worker_bilaspur)
        db.refresh(cls.parent)

        sup_id = cls.supervisor.id
        sup_no_j_id = cls.supervisor_no_jurisdiction.id
        worker_id = cls.worker_rampur.id
        worker_bil_id = cls.worker_bilaspur.id
        cls.worker_bilaspur_id = worker_bil_id
        parent_id = cls.parent.id

        # Create children
        cls.child_rampur = Child(
            name="Aarav Sharma",
            date_of_birth=date(2025, 6, 1),
            parent_id=parent_id,
            assigned_worker_id=worker_id,
            village="Rampur",
            gender="Male",
            blood_group="O+",
            birth_weight_kg=3.1
        )
        cls.child_bilaspur = Child(
            name="Rohan Kumar",
            date_of_birth=date(2025, 8, 15),
            parent_id=parent_id,
            assigned_worker_id=worker_bil_id,
            village="Bilaspur",
            gender="Male",
            blood_group="B+",
            birth_weight_kg=2.9
        )
        db.add_all([cls.child_rampur, cls.child_bilaspur])
        db.commit()
        db.refresh(cls.child_rampur)
        db.refresh(cls.child_bilaspur)

        cls.child_rampur_id = cls.child_rampur.id
        cls.child_bilaspur_id = cls.child_bilaspur.id
        db.close()

        # Generate tokens
        cls.sup_token = create_access_token(sup_id, role="supervisor")
        cls.sup_no_j_token = create_access_token(sup_no_j_id, role="supervisor")
        cls.worker_token = create_access_token(worker_id, role="worker")
        cls.parent_token = create_access_token(parent_id, role="parent")
        cls.worker_rampur_id = worker_id

    @classmethod
    def tearDownClass(cls):
        main.app.dependency_overrides.pop(main.get_db, None)
        Base.metadata.drop_all(bind=test_engine)

    def test_01_worker_cannot_access_supervisor_endpoints(self):
        """Workers and parents receive HTTP 403 when trying to access Authority endpoints."""
        res = self.client.get("/supervisor/dashboard", headers={"Authorization": f"Bearer {self.worker_token}"})
        self.assertEqual(res.status_code, 403)

        res2 = self.client.get("/supervisor/dashboard", headers={"Authorization": f"Bearer {self.parent_token}"})
        self.assertEqual(res2.status_code, 403)

    def test_02_supervisor_missing_jurisdiction_safeguard(self):
        """Supervisor without configured jurisdiction is safely denied access (HTTP 403)."""
        res = self.client.get("/supervisor/dashboard", headers={"Authorization": f"Bearer {self.sup_no_j_token}"})
        self.assertEqual(res.status_code, 403)
        self.assertIn("No healthcare jurisdiction is assigned", res.json()["detail"])

    def test_03_supervisor_dashboard_jurisdiction_scoping(self):
        """Authorized supervisor accesses dashboard scoped strictly to Rampur jurisdiction."""
        res = self.client.get("/supervisor/dashboard", headers={"Authorization": f"Bearer {self.sup_token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["jurisdiction"], "Rampur")
        self.assertEqual(data["total_workers"], 1)  # Only Rekha Devi in Rampur, not Meena in Bilaspur
        self.assertEqual(data["total_children"], 1)  # Only Aarav in Rampur

    def test_04_supervisor_workers_list(self):
        """Supervisor views workers strictly in assigned jurisdiction."""
        res = self.client.get("/supervisor/workers", headers={"Authorization": f"Bearer {self.sup_token}"})
        self.assertEqual(res.status_code, 200)
        workers = res.json()
        self.assertEqual(len(workers), 1)
        self.assertEqual(workers[0]["name"], "Rekha Devi (ANM)")
        self.assertEqual(workers[0]["assigned_children_count"], 1)

    def test_05_worker_actions_record_audit_log_atomically(self):
        """When worker administers vaccine or updates child, an audit log is committed atomically."""
        # Worker administers dose to Aarav
        dose_payload = {
            "vaccine_name": "BCG",
            "administered_date": date.today().isoformat(),
            "batch": "BCG-9988",
            "facility": "Rampur Subcentre",
            "worker_name": "Rekha Devi (ANM)",
            "site": "Left arm",
            "notes": "Administered standard dose."
        }
        res = self.client.post(
            f"/worker/vaccinations/administer?child_id={self.child_rampur_id}",
            json=dose_payload,
            headers={"Authorization": f"Bearer {self.worker_token}"}
        )
        self.assertEqual(res.status_code, 201)

        # Verify audit log in database
        db = TestingSessionLocal()
        log = db.query(AuditLog).filter(
            AuditLog.child_id == self.child_rampur_id,
            AuditLog.action_type == "ADMINISTER_VACCINE"
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.user_id, self.worker_rampur_id)
        self.assertEqual(log.record_type, "vaccination")
        self.assertIn("BCG", log.new_values)
        db.close()

    def test_06_supervisor_audit_logs_query_and_filters(self):
        """Supervisor queries Activity Logs / Audit Trail with filters."""
        res = self.client.get(
            f"/supervisor/audit-logs?child_id={self.child_rampur_id}",
            headers={"Authorization": f"Bearer {self.sup_token}"}
        )
        self.assertEqual(res.status_code, 200)
        logs = res.json()
        self.assertGreaterEqual(len(logs), 1)
        self.assertEqual(logs[0]["action_type"], "ADMINISTER_VACCINE")
        self.assertEqual(logs[0]["worker_name"], "Rekha Devi (ANM)")

    def test_07_supervisor_child_oversight_and_cross_jurisdiction_block(self):
        """Supervisor can oversee child in jurisdiction, but is blocked from child in other jurisdiction."""
        # Allowed child in Rampur
        res_allowed = self.client.get(
            f"/supervisor/children/{self.child_rampur_id}",
            headers={"Authorization": f"Bearer {self.sup_token}"}
        )
        self.assertEqual(res_allowed.status_code, 200)
        self.assertEqual(res_allowed.json()["name"], "Aarav Sharma")

        # Blocked child in Bilaspur
        res_blocked = self.client.get(
            f"/supervisor/children/{self.child_bilaspur_id}",
            headers={"Authorization": f"Bearer {self.sup_token}"}
        )
        self.assertEqual(res_blocked.status_code, 403)

    def test_08_reports_and_csv_export(self):
        """Supervisor can fetch aggregate reports and download CSV export."""
        rep_res = self.client.get("/supervisor/reports", headers={"Authorization": f"Bearer {self.sup_token}"})
        self.assertEqual(rep_res.status_code, 200)
        data = rep_res.json()
        self.assertEqual(data["jurisdiction"], "Rampur")

        csv_res = self.client.get("/supervisor/reports/export-csv", headers={"Authorization": f"Bearer {self.sup_token}"})
        self.assertEqual(csv_res.status_code, 200)
        self.assertIn("text/csv", csv_res.headers.get("content-type", ""))
        self.assertIn("NavJyoti Healthcare Authority Operations Report", csv_res.text)

    def test_09_supervisor_alerts(self):
        """Supervisor receives operational alerts based on real database records."""
        res = self.client.get("/supervisor/alerts", headers={"Authorization": f"Bearer {self.sup_token}"})
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_10_worker_cannot_read_or_change_unassigned_child_records(self):
        db = TestingSessionLocal()
        vaccination = Vaccination(
            child_id=self.child_bilaspur_id,
            vaccine_name="UNASSIGNED DOSE",
            due_date=date.today(),
            completed=False
        )
        db.add(vaccination)
        db.commit()
        vaccination_id = vaccination.id
        db.close()
        headers = {"Authorization": f"Bearer {self.worker_token}"}

        requests = [
            self.client.get(f"/children/{self.child_bilaspur_id}", headers=headers),
            self.client.get(f"/children/{self.child_bilaspur_id}/vaccinations", headers=headers),
            self.client.post(
                f"/children/{self.child_bilaspur_id}/vaccinations",
                json={"vaccine_name": "FOREIGN DOSE", "due_date": date.today().isoformat()},
                headers=headers,
            ),
            self.client.patch(
                f"/worker/vaccinations/{vaccination_id}/complete",
                json={"administered_date": date.today().isoformat()},
                headers=headers,
            ),
            self.client.post(
                f"/worker/vaccinations/administer?child_id={self.child_bilaspur_id}",
                json={"vaccine_name": "FOREIGN DOSE", "administered_date": date.today().isoformat()},
                headers=headers,
            ),
            self.client.get(f"/children/{self.child_bilaspur_id}/growth", headers=headers),
            self.client.post(
                f"/children/{self.child_bilaspur_id}/growth",
                json={
                    "measurement_date": date.today().isoformat(),
                    "weight_kg": 10,
                    "height_cm": 80,
                },
                headers=headers,
            ),
            self.client.get(f"/children/{self.child_bilaspur_id}/milestones", headers=headers),
            self.client.post(
                f"/children/{self.child_bilaspur_id}/milestones",
                json={
                    "observation_date": date.today().isoformat(),
                    "category": "motor",
                    "description": "Sits without support",
                    "status": "observed",
                },
                headers=headers,
            ),
            self.client.get(f"/children/{self.child_bilaspur_id}/appointments", headers=headers),
            self.client.get(f"/children/{self.child_bilaspur_id}/follow-ups", headers=headers),
            self.client.post(
                f"/children/{self.child_bilaspur_id}/qr-token",
                headers=headers,
            ),
        ]
        self.assertTrue(all(response.status_code == 403 for response in requests))

    def test_11_parent_cannot_change_worker_or_jurisdiction(self):
        headers = {"Authorization": f"Bearer {self.parent_token}"}
        db = TestingSessionLocal()
        other_parent = User(
            name="Other Parent",
            password_hash=hash_password("ParentPass123!"),
            role="parent",
            village="Bilaspur",
        )
        db.add(other_parent)
        db.flush()
        other_child = Child(
            name="Other Child",
            date_of_birth=date(2025, 2, 1),
            parent_id=other_parent.id,
            village="Bilaspur",
        )
        db.add(other_child)
        db.commit()
        other_child_id = other_child.id
        db.close()

        cross_user_read = self.client.get(
            f"/children/{other_child_id}",
            headers=headers,
        )
        assigned_worker = self.client.patch(
            f"/children/{self.child_rampur_id}",
            json={"assigned_worker_id": self.worker_bilaspur_id},
            headers=headers,
        )
        changed_village = self.client.patch(
            f"/children/{self.child_rampur_id}",
            json={"village": "Bilaspur"},
            headers=headers,
        )
        self.assertEqual(cross_user_read.status_code, 403)
        self.assertEqual(assigned_worker.status_code, 403)
        self.assertEqual(changed_village.status_code, 403)

        supervisor_write = self.client.patch(
            f"/children/{self.child_rampur_id}",
            json={"name": "Unauthorized Supervisor Edit"},
            headers={"Authorization": f"Bearer {self.sup_token}"},
        )
        self.assertEqual(supervisor_write.status_code, 403)

    def test_12_district_like_jurisdiction_is_not_a_global_access_bypass(self):
        db = TestingSessionLocal()
        broad_label_user = User(
            name="Unscoped Supervisor",
            email="unscoped.supervisor@navjyoti.gov.in",
            password_hash=hash_password("SupervisorPass123!"),
            role="supervisor",
            jurisdiction="all",
        )
        db.add(broad_label_user)
        db.commit()
        db.refresh(broad_label_user)
        token = create_access_token(broad_label_user.id, role="supervisor")
        db.close()

        response = self.client.get(
            "/supervisor/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total_workers"], 0)
        self.assertEqual(response.json()["total_children"], 0)

    def test_13_failed_child_creation_rolls_back_without_audit_event(self):
        original_recorder = main.record_audit_event

        def fail_audit(**_kwargs):
            raise RuntimeError("simulated audit failure")

        main.record_audit_event = fail_audit
        try:
            with self.assertRaises(RuntimeError):
                self.client.post(
                    "/children",
                    json={
                        "name": "Rollback Child",
                        "date_of_birth": date(2025, 1, 1).isoformat(),
                        "gender": "Female",
                    },
                    headers={"Authorization": f"Bearer {self.parent_token}"},
                )
        finally:
            main.record_audit_event = original_recorder

        db = TestingSessionLocal()
        self.assertIsNone(db.query(Child).filter(Child.name == "Rollback Child").first())
        self.assertIsNone(
            db.query(AuditLog).filter(AuditLog.action_type == "CREATE_CHILD").first()
        )
        db.close()

    def test_14_duplicate_vaccination_stage_is_rejected_case_insensitively(self):
        response = self.client.post(
            f"/children/{self.child_rampur_id}/vaccinations",
            json={"vaccine_name": "bcg", "due_date": date.today().isoformat()},
            headers={"Authorization": f"Bearer {self.parent_token}"},
        )
        self.assertEqual(response.status_code, 409)


if __name__ == "__main__":
    unittest.main()
