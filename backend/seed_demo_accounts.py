"""
NavJyoti Demo Accounts Seeder
Safely and idempotently creates or updates the official demo accounts in PostgreSQL:
1. Parent: Sunita Sharma (Phone: +919876543210 / 9876543210, Password: NavJyoti@123)
2. Health Worker: Rekha Devi (Email: worker.demo@navjyoti.test, Password: NavJyoti@123, ID: ANM-UP-BLS-4019)
3. Supervisor: Dr. Alok Verma (Email: supervisor.demo@navjyoti.test, Password: NavJyoti@123, ID: MOIC-UP-BLS-1001)

Also provisions linked synthetic clinical records for Aarav Sharma so all dashboards
display complete, verified information without altering any existing data.
"""

import sys
from pathlib import Path
from datetime import date, datetime, timezone, timedelta

# Ensure backend directory is in path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import SessionLocal
from models import (
    User, Child, Vaccination, GrowthRecord, MilestoneRecord,
    Appointment, FollowUp, Notification, Communication
)
from auth import hash_password, verify_password
from phone_utils import normalize_indian_phone

DEMO_PASSWORD_RAW = "NavJyoti@123"

def seed_demo_accounts():
    db = SessionLocal()
    try:
        print("[1/4] Checking and seeding Health Worker demo account...")
        worker = db.query(User).filter(User.email == "worker.demo@navjyoti.test").first()
        if not worker:
            worker = User(
                name="Rekha Devi",
                email="worker.demo@navjyoti.test",
                password_hash=hash_password(DEMO_PASSWORD_RAW),
                role="worker",
                worker_id="ANM-UP-BLS-4019",
                village="Rampur",
                preferred_language="hi",
                consent=True
            )
            db.add(worker)
            db.commit()
            db.refresh(worker)
            print(f"  -> Created Health Worker account: ID={worker.id}, Email={worker.email}")
        else:
            if not verify_password(DEMO_PASSWORD_RAW, worker.password_hash):
                worker.password_hash = hash_password(DEMO_PASSWORD_RAW)
                worker.name = "Rekha Devi"
                worker.worker_id = "ANM-UP-BLS-4019"
                worker.village = "Rampur"
                db.commit()
                print(f"  -> Updated Health Worker password hash: ID={worker.id}")
            else:
                print(f"  -> Health Worker already present and verified: ID={worker.id}")

        print("[2/4] Checking and seeding Supervisor demo account...")
        supervisor = db.query(User).filter(User.email == "supervisor.demo@navjyoti.test").first()
        if not supervisor:
            supervisor = User(
                name="Dr. Alok Verma",
                email="supervisor.demo@navjyoti.test",
                password_hash=hash_password(DEMO_PASSWORD_RAW),
                role="supervisor",
                worker_id="MOIC-UP-BLS-1001",
                village="Bilaspur Sadar",
                jurisdiction="District HQ",
                preferred_language="hi",
                consent=True
            )
            db.add(supervisor)
            db.commit()
            db.refresh(supervisor)
            print(f"  -> Created Supervisor account: ID={supervisor.id}, Email={supervisor.email}")
        else:
            supervisor.jurisdiction = "District HQ"
            if not verify_password(DEMO_PASSWORD_RAW, supervisor.password_hash):
                supervisor.password_hash = hash_password(DEMO_PASSWORD_RAW)
                supervisor.name = "Dr. Alok Verma"
                supervisor.worker_id = "MOIC-UP-BLS-1001"
                supervisor.village = "Bilaspur Sadar"
                db.commit()
                print(f"  -> Updated Supervisor password hash: ID={supervisor.id}")
            else:
                db.commit()
                print(f"  -> Supervisor already present and verified: ID={supervisor.id}")

        print("[3/4] Checking and seeding Parent demo account...")
        canonical_parent_phone = normalize_indian_phone("9876543210")
        parent = db.query(User).filter(User.phone == canonical_parent_phone).first()
        if not parent:
            parent = User(
                name="Sunita Sharma",
                phone=canonical_parent_phone,
                email="parent.demo@navjyoti.test",
                password_hash=hash_password(DEMO_PASSWORD_RAW),
                role="parent",
                village="Rampur",
                preferred_language="hi",
                consent=True
            )
            db.add(parent)
            db.commit()
            db.refresh(parent)
            print(f"  -> Created Parent account: ID={parent.id}, Phone={parent.phone}")
        else:
            if not verify_password(DEMO_PASSWORD_RAW, parent.password_hash):
                parent.password_hash = hash_password(DEMO_PASSWORD_RAW)
                parent.name = "Sunita Sharma"
                parent.village = "Rampur"
                db.commit()
                print(f"  -> Updated Parent password hash: ID={parent.id}")
            else:
                print(f"  -> Parent already present and verified: ID={parent.id}")

        print("[4/4] Checking and seeding linked demo child (Aarav Sharma)...")
        child = db.query(Child).filter(
            Child.parent_id == parent.id,
            Child.name == "Aarav Sharma"
        ).first()

        if not child:
            child = Child(
                name="Aarav Sharma",
                date_of_birth=date(2024, 3, 15),
                parent_id=parent.id,
                assigned_worker_id=worker.id,
                gender="Male",
                village="Rampur",
                blood_group="B+",
                birth_weight_kg=3.2,
                migration_status="resident",
                priority_level="green"
            )
            db.add(child)
            db.commit()
            db.refresh(child)
            print(f"  -> Linked demo child created: ID={child.id}, Name={child.name}")

            # Seed standard UIP vaccination records
            vax_records = [
                Vaccination(child_id=child.id, vaccine_name="BCG", due_date=date(2024, 3, 15), administered_date=date(2024, 3, 15), completed=True, batch_number="BCG-24-101", facility="Rampur Sub-Centre", worker_name="Rekha Devi", site="Left upper arm"),
                Vaccination(child_id=child.id, vaccine_name="OPV 0", due_date=date(2024, 3, 15), administered_date=date(2024, 3, 15), completed=True, batch_number="OPV-24-002", facility="Rampur Sub-Centre", worker_name="Rekha Devi", site="Oral (2 drops)"),
                Vaccination(child_id=child.id, vaccine_name="HepB 0", due_date=date(2024, 3, 15), administered_date=date(2024, 3, 15), completed=True, batch_number="HEP-24-303", facility="Rampur Sub-Centre", worker_name="Rekha Devi", site="Anterolateral mid-thigh"),
                Vaccination(child_id=child.id, vaccine_name="Pentavalent 1", due_date=date(2024, 4, 26), administered_date=date(2024, 4, 28), completed=True, batch_number="PNT-24-404", facility="Rampur Sub-Centre", worker_name="Rekha Devi", site="Anterolateral mid-thigh"),
                Vaccination(child_id=child.id, vaccine_name="OPV 1", due_date=date(2024, 4, 26), administered_date=date(2024, 4, 28), completed=True, batch_number="OPV-24-505", facility="Rampur Sub-Centre", worker_name="Rekha Devi", site="Oral (2 drops)"),
                Vaccination(child_id=child.id, vaccine_name="Rotavirus 1", due_date=date(2024, 4, 26), administered_date=date(2024, 4, 28), completed=True, batch_number="ROTA-24-606", facility="Rampur Sub-Centre", worker_name="Rekha Devi", site="Oral (5 drops)"),
                Vaccination(child_id=child.id, vaccine_name="MR 1 (Measles-Rubella)", due_date=date(2024, 12, 15), completed=False, facility="Rampur Sub-Centre"),
                Vaccination(child_id=child.id, vaccine_name="JE 1", due_date=date(2024, 12, 15), completed=False, facility="Rampur Sub-Centre"),
                Vaccination(child_id=child.id, vaccine_name="PCV Booster", due_date=date(2024, 12, 15), completed=False, facility="Rampur Sub-Centre"),
            ]
            db.add_all(vax_records)

            # Growth records
            growth_records = [
                GrowthRecord(child_id=child.id, recorded_by=worker.id, measurement_date=date(2024, 3, 15), weight_kg=3.2, height_cm=50.0),
                GrowthRecord(child_id=child.id, recorded_by=worker.id, measurement_date=date(2024, 4, 28), weight_kg=4.5, height_cm=55.0),
                GrowthRecord(child_id=child.id, recorded_by=worker.id, measurement_date=date(2024, 7, 20), weight_kg=6.8, height_cm=64.0),
                GrowthRecord(child_id=child.id, recorded_by=worker.id, measurement_date=date(2024, 10, 10), weight_kg=8.4, height_cm=71.0),
            ]
            db.add_all(growth_records)

            # Milestone records (schema categories: motor, language, social, cognitive)
            milestone_records = [
                MilestoneRecord(child_id=child.id, recorded_by=worker.id, observation_date=date(2024, 5, 10), category="motor", description="Holds head steady when upright", status="observed"),
                MilestoneRecord(child_id=child.id, recorded_by=worker.id, observation_date=date(2024, 7, 15), category="social", description="Smiles responsively and recognizes mother's voice", status="observed"),
                MilestoneRecord(child_id=child.id, recorded_by=worker.id, observation_date=date(2024, 9, 20), category="motor", description="Rolls tummy-to-back and reaches for objects", status="observed"),
            ]
            db.add_all(milestone_records)

            # Upcoming appointment
            appointment = Appointment(
                child_id=child.id,
                requested_by=parent.id,
                appointment_date=date.today() + timedelta(days=7),
                reason="9-Month Routine Vaccination & Growth Assessment (MR 1 & JE 1)",
                status="scheduled"
            )
            db.add(appointment)

            # Follow-up
            follow_up = FollowUp(
                child_id=child.id,
                created_by=worker.id,
                due_date=date.today() + timedelta(days=7),
                reason="Routine Immunization & Vitamin A supplementation session",
                status="pending"
            )
            db.add(follow_up)

            # Notification
            now_utc = datetime.now(timezone.utc)
            notif = Notification(
                user_id=parent.id,
                child_id=child.id,
                title="Upcoming Vaccination Session",
                message="Aarav Sharma is due for MR 1 and JE 1 in 7 days at Rampur Sub-Centre.",
                type="reminder",
                read=False,
                created_at=now_utc
            )
            db.add(notif)

            db.commit()
            print("  -> Created complete clinical history, growth, milestones, appointment, and notifications!")
        else:
            print(f"  -> Linked demo child already present: ID={child.id}")

        print("\nDemo account seeding completed successfully and idempotently!")
        return True
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_accounts()
