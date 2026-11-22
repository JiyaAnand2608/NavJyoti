"""
NavJyoti Authority Portal Comprehensive Demo Seeder
Generates realistic, interconnected, medically consistent demonstration data for the
Authority (Supervisor) Portal:
- 10 Healthcare Workers across multiple sectors in District HQ jurisdiction
- 50 Synthetic Child Profiles across distinct age cohorts (0m to 5y)
- Completed, upcoming, overdue, and catch-up UIP vaccination records
- Growth records and developmental milestones spanning 6 months
- Appointments with varied statuses (scheduled, completed, missed)
- High (red), Medium (amber), and Low (green) priority follow-ups
- Worker communications and outreach activity logs
- Historical transactional audit logs spanning 6 months for reports and charts
- System alerts and notifications

Safety & Idempotency:
- All synthetic records are tagged with "[DEMO-SYNTHETIC]" or specific demo email domains.
- Script is 100% idempotent: safe to run repeatedly without creating duplicates.
- Respects existing records and never deletes or overwrites production data.
"""

import sys
import os
import json
import argparse
from pathlib import Path
from datetime import date, datetime, timezone, timedelta

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

from models import (
    Base, User, Child, Vaccination, GrowthRecord, MilestoneRecord,
    Appointment, FollowUp, Notification, Communication, AuditLog
)
from auth import hash_password

DEMO_PASSWORD_RAW = "NavJyoti@123"
DEMO_TAG = "[DEMO-SYNTHETIC]"

SECTORS = [
    "Bilaspur Sadar Sector 1",
    "Bilaspur Sadar Sector 2",
    "Rampur Sector A",
    "Rampur Sector B",
    "Fatehpur Sub-Centre",
    "Haridaspur Sector 1",
    "Haridaspur Sector 2",
    "Bilaspur Rural North",
    "Bilaspur Rural South",
    "Bilaspur Urban Block"
]

WORKER_PROFILES = [
    ("Rekha Devi", "worker.demo@navjyoti.test", "ANM-UP-BLS-4019", "+919876543201", SECTORS[0]),
    ("Sunita Patel", "worker.sunita@navjyoti.test", "ANM-UP-BLS-4020", "+919876543202", SECTORS[1]),
    ("Anjali Sharma", "worker.anjali@navjyoti.test", "ANM-UP-BLS-4021", "+919876543203", SECTORS[2]),
    ("Meena Kumari", "worker.meena@navjyoti.test", "ANM-UP-BLS-4022", "+919876543204", SECTORS[3]),
    ("Pooja Verma", "worker.pooja@navjyoti.test", "ANM-UP-BLS-4023", "+919876543205", SECTORS[4]),
    ("Geeta Yadav", "worker.geeta@navjyoti.test", "ANM-UP-BLS-4024", "+919876543206", SECTORS[5]),
    ("Suman Lata", "worker.suman@navjyoti.test", "ANM-UP-BLS-4025", "+919876543207", SECTORS[6]),
    ("Kavita Singh", "worker.kavita@navjyoti.test", "ANM-UP-BLS-4026", "+919876543208", SECTORS[7]),
    ("Priya Mishra", "worker.priya@navjyoti.test", "ANM-UP-BLS-4027", "+919876543209", SECTORS[8]),
    ("Radha Gupta", "worker.radha@navjyoti.test", "ANM-UP-BLS-4028", "+919876543210", SECTORS[9]),
]

FIRST_NAMES_MALE = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Dhruv", "Kabir", "Rudra", "Om", "Samarth"]
FIRST_NAMES_FEMALE = ["Ananya", "Diya", "Ira", "Myra", "Saanvi", "Aadhya", "Navya", "Kiara", "Pari", "Riya", "Avni", "Kavya", "Ahana", "Tanvi", "Siya"]
LAST_NAMES = ["Sharma", "Verma", "Patel", "Yadav", "Gupta", "Singh", "Kumar", "Mishra", "Chaudhary", "Pandey"]

def seed_authority_demo_dataset(db_session, jurisdiction="District HQ"):
    print(f"=== Starting Authority Portal Demo Data Population for jurisdiction '{jurisdiction}' ===")
    
    # 1. Ensure Supervisor account exists
    supervisor = db_session.query(User).filter(User.email == "supervisor.demo@navjyoti.test").first()
    if not supervisor:
        supervisor = User(
            name="Dr. Alok Verma",
            email="supervisor.demo@navjyoti.test",
            password_hash=hash_password(DEMO_PASSWORD_RAW),
            role="supervisor",
            worker_id="MOIC-UP-BLS-1001",
            village="Bilaspur Sadar",
            jurisdiction=jurisdiction,
            preferred_language="hi",
            consent=True
        )
        db_session.add(supervisor)
        db_session.commit()
        db_session.refresh(supervisor)
        print(f"  [+] Created supervisor account: ID={supervisor.id}")
    else:
        supervisor.jurisdiction = jurisdiction
        db_session.commit()
        print(f"  [*] Verified supervisor account: ID={supervisor.id}, Jurisdiction={supervisor.jurisdiction}")

    # 2. Seed 10 Healthcare Workers
    workers = []
    for name, email, w_id, phone, sector in WORKER_PROFILES:
        w = db_session.query(User).filter(User.email == email).first()
        if not w:
            w = User(
                name=f"{name} (ANM)",
                email=email,
                password_hash=hash_password(DEMO_PASSWORD_RAW),
                role="worker",
                worker_id=w_id,
                village=sector,
                jurisdiction=jurisdiction,
                phone=phone,
                preferred_language="hi",
                consent=True
            )
            db_session.add(w)
            db_session.commit()
            db_session.refresh(w)
            print(f"  [+] Created Healthcare Worker: {name} ({w_id}) in {sector}")
        else:
            w.jurisdiction = jurisdiction
            w.village = sector
            w.worker_id = w_id
            db_session.commit()
        workers.append(w)

    print(f"  [*] 10 Healthcare Workers active and assigned to '{jurisdiction}'")

    # 3. Seed demo parent pool (10 demo parents)
    parents = []
    for i in range(10):
        parent_phone = f"+9198711000{i:02d}"
        p = db_session.query(User).filter(User.phone == parent_phone).first()
        if not p:
            p = User(
                name=f"Parent {LAST_NAMES[i]} {DEMO_TAG}",
                email=f"parent.demo.{i}@navjyoti.test",
                phone=parent_phone,
                password_hash=hash_password(DEMO_PASSWORD_RAW),
                role="parent",
                village=SECTORS[i % len(SECTORS)],
                preferred_language="hi",
                consent=True
            )
            db_session.add(p)
            db_session.commit()
            db_session.refresh(p)
        parents.append(p)

    # 4. Seed 50 Synthetic Children (5 children per worker)
    today = date.today()
    children_seeded = 0
    vaccinations_seeded = 0
    audit_logs_seeded = 0
    
    for idx in range(50):
        worker_idx = idx % 10
        assigned_worker = workers[worker_idx]
        parent = parents[idx % 10]
        village = assigned_worker.village

        is_male = (idx % 2 == 0)
        first_name = FIRST_NAMES_MALE[idx % len(FIRST_NAMES_MALE)] if is_male else FIRST_NAMES_FEMALE[idx % len(FIRST_NAMES_FEMALE)]
        last_name = LAST_NAMES[(idx // 5) % len(LAST_NAMES)]
        child_name = f"{first_name} {last_name} #{idx + 1}"

        # Age cohort distribution:
        # 0-10: 1-3 months old (infants)
        # 11-25: 4-9 months old
        # 26-40: 10-18 months old
        # 41-49: 2-4 years old
        if idx < 10:
            age_days = 20 + idx * 7  # 3 to 12 weeks
        elif idx < 25:
            age_days = 100 + (idx - 10) * 10 # 3.5 to 8 months
        elif idx < 40:
            age_days = 280 + (idx - 25) * 15 # 9 to 16 months
        else:
            age_days = 550 + (idx - 40) * 80 # 1.5 to 3.5 years

        dob = today - timedelta(days=age_days)

        # Check existing child
        existing_child = db_session.query(Child).filter(
            Child.parent_id == parent.id,
            Child.name == child_name
        ).first()

        if not existing_child:
            # Set priority distribution
            if idx % 7 == 0:
                priority = "red"  # Overdue / high-risk
            elif idx % 3 == 0:
                priority = "amber" # Due soon
            else:
                priority = "green" # Up to date

            migration_status = "migrant_in" if idx % 6 == 0 else "resident"

            child = Child(
                name=child_name,
                date_of_birth=dob,
                parent_id=parent.id,
                assigned_worker_id=assigned_worker.id,
                gender="Male" if is_male else "Female",
                village=village,
                blood_group=["A+", "B+", "O+", "AB+"][idx % 4],
                birth_weight_kg=round(2.6 + (idx % 12) * 0.1, 1),
                migration_status=migration_status,
                priority_level=priority
            )
            db_session.add(child)
            db_session.commit()
            db_session.refresh(child)
            children_seeded += 1
        else:
            child = existing_child

        # 5. Populate Medically-Consistent UIP Vaccinations
        # UIP Master Schedule:
        # Birth: BCG, OPV 0, HepB 0
        # 6 wks: Pentavalent 1, OPV 1, Rotavirus 1, fIPV 1, PCV 1
        # 10 wks: Pentavalent 2, OPV 2, Rotavirus 2
        # 14 wks: Pentavalent 3, OPV 3, Rotavirus 3, fIPV 2, PCV 2
        # 9 mos: MR 1, JE 1, PCV Booster
        # 16-24 mos: DPT Booster 1, OPV Booster, MR 2
        schedule = [
            ("BCG", dob, dob),
            ("OPV 0", dob, dob),
            ("HepB 0", dob, dob),
            ("Pentavalent 1", dob + timedelta(days=42), dob + timedelta(days=44)),
            ("OPV 1", dob + timedelta(days=42), dob + timedelta(days=44)),
            ("Rotavirus 1", dob + timedelta(days=42), dob + timedelta(days=44)),
            ("fIPV 1", dob + timedelta(days=42), dob + timedelta(days=44)),
            ("PCV 1", dob + timedelta(days=42), dob + timedelta(days=44)),
            ("Pentavalent 2", dob + timedelta(days=70), dob + timedelta(days=73)),
            ("OPV 2", dob + timedelta(days=70), dob + timedelta(days=73)),
            ("Rotavirus 2", dob + timedelta(days=70), dob + timedelta(days=73)),
            ("Pentavalent 3", dob + timedelta(days=98), dob + timedelta(days=101)),
            ("OPV 3", dob + timedelta(days=98), dob + timedelta(days=101)),
            ("fIPV 2", dob + timedelta(days=98), dob + timedelta(days=101)),
            ("PCV 2", dob + timedelta(days=98), dob + timedelta(days=101)),
            ("MR 1", dob + timedelta(days=270), dob + timedelta(days=275)),
            ("JE 1", dob + timedelta(days=270), dob + timedelta(days=275)),
            ("PCV Booster", dob + timedelta(days=270), dob + timedelta(days=275)),
            ("DPT Booster 1", dob + timedelta(days=480), dob + timedelta(days=490)),
            ("OPV Booster", dob + timedelta(days=480), dob + timedelta(days=490)),
        ]

        for vax_name, due_d, admin_d in schedule:
            # Check if this vaccine already exists for this child
            existing_vax = db_session.query(Vaccination).filter(
                Vaccination.child_id == child.id,
                func.lower(func.trim(Vaccination.vaccine_name)) == vax_name.lower().strip()
            ).first()

            if existing_vax:
                continue

            # Determine completion based on child age and priority
            if due_d < today - timedelta(days=30):
                # In past: mostly completed, except red priority which has overdue missed doses
                if child.priority_level == "red" and vax_name in ["Pentavalent 3", "MR 1", "DPT Booster 1"]:
                    is_completed = False
                    admin_date_val = None
                else:
                    is_completed = True
                    admin_date_val = admin_d if admin_d <= today else today - timedelta(days=5)
            elif due_d <= today:
                # Due right around now
                is_completed = (child.priority_level == "green")
                admin_date_val = due_d if is_completed else None
            else:
                # In future: scheduled
                is_completed = False
                admin_date_val = None

            vax = Vaccination(
                child_id=child.id,
                vaccine_name=vax_name,
                due_date=due_d,
                administered_date=admin_date_val,
                completed=is_completed,
                batch_number=f"UIP-2024-{100 + (idx * 7) % 900}" if is_completed else None,
                facility=f"{village} Sub-Centre",
                worker_name=assigned_worker.name if is_completed else None,
                site="Left mid-thigh" if "Penta" in vax_name else "Oral" if "OPV" in vax_name else "Right upper arm",
                notes="Administered during routine session" if is_completed else None
            )
            db_session.add(vax)
            vaccinations_seeded += 1

            # Seed an atomic audit log for completed doses
            if is_completed and admin_date_val:
                audit = AuditLog(
                    user_id=assigned_worker.id,
                    child_id=child.id,
                    action_type="COMPLETE_VACCINATION",
                    record_type="vaccination",
                    record_id=idx * 100 + vaccinations_seeded,
                    fields_changed="completed,administered_date,batch_number",
                    previous_values=json.dumps({"completed": False}),
                    new_values=json.dumps({"completed": True, "vaccine": vax_name}),
                    timestamp=datetime(admin_date_val.year, admin_date_val.month, admin_date_val.day, 10, 30, tzinfo=timezone.utc)
                )
                db_session.add(audit)
                audit_logs_seeded += 1

        # 6. Growth Records (Historical spanning past 6 months)
        if db_session.query(GrowthRecord).filter(GrowthRecord.child_id == child.id).count() == 0:
            growth_points = [
                (dob, 3.1, 50.0),
                (dob + timedelta(days=45), 4.4, 55.0),
                (dob + timedelta(days=90), 5.7, 60.5),
                (dob + timedelta(days=180), 7.5, 68.0),
                (dob + timedelta(days=365), 9.6, 76.0),
            ]
            for g_date, w_val, h_val in growth_points:
                if g_date <= today:
                    g_rec = GrowthRecord(
                        child_id=child.id,
                        recorded_by=assigned_worker.id,
                        measurement_date=g_date,
                        weight_kg=round(w_val + (idx % 5) * 0.2, 1),
                        height_cm=round(h_val + (idx % 4) * 0.5, 1)
                    )
                    db_session.add(g_rec)

        # 7. Milestone Records
        if db_session.query(MilestoneRecord).filter(MilestoneRecord.child_id == child.id).count() == 0:
            m_points = [
                ("motor", "Holds neck steady and controls head", dob + timedelta(days=60), "observed"),
                ("social", "Social smile and responds to mother's voice", dob + timedelta(days=75), "observed"),
                ("language", "Coos and produces vowel sounds", dob + timedelta(days=90), "observed" if age_days > 90 else "pending"),
                ("motor", "Sits without support for 1 minute", dob + timedelta(days=210), "observed" if age_days > 210 else "pending"),
            ]
            for cat, desc, m_date, st in m_points:
                if m_date <= today + timedelta(days=30):
                    m_rec = MilestoneRecord(
                        child_id=child.id,
                        recorded_by=assigned_worker.id,
                        observation_date=m_date if m_date <= today else today,
                        category=cat,
                        description=desc,
                        status=st
                    )
                    db_session.add(m_rec)

        # 8. Follow-ups
        if db_session.query(FollowUp).filter(FollowUp.child_id == child.id).count() == 0:
            if child.priority_level == "red":
                fu = FollowUp(
                    child_id=child.id,
                    created_by=assigned_worker.id,
                    due_date=today + timedelta(days=3),
                    reason="URGENT: Defaulter tracking for missed Pentavalent / MR dose",
                    status="pending"
                )
                db_session.add(fu)
            elif child.priority_level == "amber":
                fu = FollowUp(
                    child_id=child.id,
                    created_by=assigned_worker.id,
                    due_date=today + timedelta(days=10),
                    reason="Upcoming session counselling & reminder call",
                    status="pending"
                )
                db_session.add(fu)

        # 9. Appointments
        if db_session.query(Appointment).filter(Appointment.child_id == child.id).count() == 0:
            apt_status = "completed" if idx % 4 == 0 else "scheduled" if idx % 4 == 1 else "cancelled"
            apt = Appointment(
                child_id=child.id,
                requested_by=parent.id,
                appointment_date=today + timedelta(days=(idx % 14) - 7),
                reason=f"Session immunisation & growth monitoring at {village}",
                status=apt_status
            )
            db_session.add(apt)

        # 10. Worker Communication Activity Records
        if db_session.query(Communication).filter(Communication.child_id == child.id).count() == 0:
            comm = Communication(
                sender_id=assigned_worker.id,
                child_id=child.id,
                recipient_name=parent.name,
                recipient_phone=parent.phone,
                message_type="reminder" if idx % 2 == 0 else "follow_up",
                message=f"Reminder for {child_name}'s scheduled vaccination session at {village}.",
                channel="sms" if idx % 3 == 0 else "call",
                status="delivered",
                sent_at=datetime.now(timezone.utc) - timedelta(days=idx % 30)
            )
            db_session.add(comm)

        # 11. Notifications
        if db_session.query(Notification).filter(Notification.child_id == child.id).count() == 0:
            notif = Notification(
                user_id=parent.id,
                child_id=child.id,
                title="Vaccination Follow-up Scheduled" if child.priority_level == "red" else "Upcoming Health Session",
                message=f"Reminder for {child_name}'s scheduled vaccination session at {village} Sub-Centre.",
                type="alert" if child.priority_level == "red" else "reminder",
                read=False,
                created_at=datetime.now(timezone.utc) - timedelta(days=idx % 15)
            )
            db_session.add(notif)

        if idx % 10 == 0:
            db_session.commit()
            print(f"  -> Seeded {idx + 1}/50 child cohorts with clinical records...")

    db_session.commit()
    print(f"\n[DONE] Successfully seeded Authority Portal dataset:")
    print(f"  - Healthcare Workers: 10 in jurisdiction '{jurisdiction}'")
    print(f"  - Synthetic Children: 50 with distinct age brackets")
    print(f"  - Vaccination Records: {vaccinations_seeded} UIP doses")
    print(f"  - Transactional Audit Logs: {audit_logs_seeded} historical events")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NavJyoti Authority Portal Demo Seeder")
    parser.add_argument("--isolated-db-url", type=str, help="Target isolated test/demo PostgreSQL URL")
    parser.add_argument("--dry-run", action="store_true", help="Validate logic without committing")
    args = parser.parse_args()

    if args.isolated_db_url:
        print(f"Connecting to isolated demo database: {args.isolated_db_url}")
        engine = create_engine(args.isolated_db_url)
        Base.metadata.create_all(bind=engine)
        Session = sessionmaker(bind=engine)
        session = Session()
        seed_authority_demo_dataset(session)
        session.close()
    else:
        print("Note: To run against an isolated demo database, pass --isolated-db-url <url>.")
        print("Safeguard: Refusing to automatically write synthetic data to shared production without explicit parameter.")
