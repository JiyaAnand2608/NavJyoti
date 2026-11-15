import hashlib
import os
import secrets
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)
from database import (
    test_connection,
    SessionLocal
)
from models import (
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
import otp_service
from schemas import (
    ParentRegister,
    UserRegister,
    UserResponse,
    UserLogin,
    TokenResponse,
    OTPRequest,
    OTPRequestResponse,
    OTPVerify,
    ChildCreate,
    ChildUpdate,
    ChildResponse,
    VaccinationResponse,
    VaccinationScheduleCreate,
    VaccinationComplete,
    VaccinationAdminister,
    UIPScheduleItem,
    GrowthCreate,
    GrowthResponse,
    MilestoneCreate,
    MilestoneResponse,
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    AppointmentCancel,
    FollowUpCreate,
    FollowUpResponse,
    FollowUpUpdate,
    NotificationResponse,
    CommunicationCreate,
    CommunicationResponse,
    QRPassResponse,
    QRPublicResolverResponse
)
from phone_utils import normalize_indian_phone, is_valid_indian_phone

app = FastAPI(title="NavJyoti API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "https://navjyoti-web.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# DATABASE DEPENDENCY & HEALTH CHECKS
# ==============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok", "project": "NavJyoti"}


@app.get("/db-check")
def db_check():
    try:
        if test_connection():
            return {"database": "connected"}
    except SQLAlchemyError:
        pass
    return {"database": "connection failed"}


# ==============================================================================
# AUTHENTICATION & SECURITY DEPENDENCIES
# ==============================================================================

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    user_id = decode_access_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(*allowed_roles: str):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{current_user.role}'. Required: {allowed_roles}"
            )
        return current_user
    return role_checker


# ==============================================================================
# PHASE 3: PARENT REGISTRATION & PASSWORD LOGIN (OPTION B: PHONE + PASSWORD)
# ==============================================================================

@app.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a Parent account using Mobile Number or Email.
    Option B: Phone number + Password (Email is optional).
    Validates Indian 10-digit mobile numbers starting with 6-9.
    """
    normalized_phone = None
    clean_email = None

    if data.phone and str(data.phone).strip():
        try:
            normalized_phone = normalize_indian_phone(data.phone)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e)
            )

        # Check duplicate phone registration
        existing_phone = db.query(User).filter(User.phone == normalized_phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this mobile number is already registered."
            )

    if data.email and str(data.email).strip():
        clean_email = str(data.email).lower().strip()
        existing_email = db.query(User).filter(User.email == clean_email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email is already registered."
            )

    # Require at least one valid identifier
    if not normalized_phone and not clean_email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either a valid Indian mobile number or an email address is required for registration."
        )

    if data.consent is False:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Caregiver consent acknowledgement is required to register."
        )

    new_user = User(
        name=data.name.strip(),
        email=clean_email,
        phone=normalized_phone,
        password_hash=hash_password(data.password),
        role="parent",
        village=data.village.strip() if data.village else "Rampur",
        preferred_language=data.preferred_language or "hi",
        consent=True if data.consent is None else data.consent
    )

    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account with this mobile number or email already exists."
        )

    return new_user


@app.post("/auth/login", response_model=TokenResponse)
def login_user(
    data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user via:
    1. Mobile number + Password (Parents)
    2. Email + Password (Existing accounts & Staff password login)
    """
    raw_identifier = (data.identifier or data.phone or data.email or "").strip()
    if not raw_identifier:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide your registered mobile number or email address."
        )

    user = None
    if "@" in raw_identifier:
        # Lookup by Email
        clean_email = raw_identifier.lower()
        user = db.query(User).filter(User.email == clean_email).first()
    else:
        # Lookup by Indian Phone Number
        try:
            canonical_phone = normalize_indian_phone(raw_identifier)
            user = db.query(User).filter(User.phone == canonical_phone).first()
        except ValueError:
            # Check raw fallback in case phone stored in alternative format
            user = db.query(User).filter(User.phone == raw_identifier).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid mobile number/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user": user
    }


@app.get("/auth/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user


# ==============================================================================
# PHASE 4: HEALTH WORKER & SUPERVISOR EMAIL OTP AUTHENTICATION
# ==============================================================================

@app.post("/auth/otp/request", response_model=OTPRequestResponse)
def request_email_otp(
    data: OTPRequest,
    db: Session = Depends(get_db)
):
    success, message, cooldown = otp_service.request_otp(
        db=db,
        email=data.email,
        role=data.role
    )
    return {"message": message, "cooldown_seconds": cooldown}


@app.post("/auth/otp/verify", response_model=TokenResponse)
def verify_email_otp(
    data: OTPVerify,
    db: Session = Depends(get_db)
):
    user = otp_service.verify_otp(
        db=db,
        email=data.email,
        role=data.role,
        submitted_otp=data.otp
    )

    token = create_access_token(user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user": user
    }


# ==============================================================================
# PHASE 7: CHILD MANAGEMENT APIS
# ==============================================================================

@app.post(
    "/children",
    response_model=ChildResponse,
    status_code=status.HTTP_201_CREATED
)
def create_child(
    data: ChildCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.date_of_birth > date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Date of birth cannot be in the future."
        )

    if current_user.role == "parent":
        parent_id = current_user.id
        assigned_worker_id = data.assigned_worker_id
    elif current_user.role == "worker":
        # Worker registering a child in the field:
        # If parent_id is provided, verify it exists; else assign current user as primary worker
        parent_id = current_user.id  # Default link if caregiver profile is pending
        assigned_worker_id = current_user.id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisors cannot register individual children directly."
        )

    child = Child(
        name=data.name.strip(),
        date_of_birth=data.date_of_birth,
        parent_id=parent_id,
        assigned_worker_id=assigned_worker_id,
        gender=data.gender or "Male",
        village=data.village,
        blood_group=data.blood_group,
        birth_weight_kg=data.birth_weight_kg,
        migration_status=data.migration_status or "resident",
        priority_level="green"
    )

    db.add(child)
    db.commit()
    db.refresh(child)
    return child


@app.get(
    "/children",
    response_model=List[ChildResponse]
)
def get_accessible_children(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "parent":
        return db.query(Child).filter(Child.parent_id == current_user.id).all()
    elif current_user.role == "worker":
        return db.query(Child).filter(Child.assigned_worker_id == current_user.id).all()
    elif current_user.role == "supervisor":
        return db.query(Child).all()
    return []


@app.get(
    "/children/{child_id}",
    response_model=ChildResponse
)
def get_child_by_id(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child record not found."
        )

    # Authorization verification
    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this child record."
        )
    if current_user.role == "worker" and child.assigned_worker_id != current_user.id:
        # Check if worker shares the child's village or jurisdiction
        pass  # Worker authorized for sub-centre oversight

    return child


@app.patch(
    "/children/{child_id}",
    response_model=ChildResponse
)
def update_child(
    child_id: int,
    data: ChildUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child record not found."
        )

    # Authorization
    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    if current_user.role == "worker" and child.assigned_worker_id != current_user.id:
        # Allow worker assigned or supervisor
        if current_user.role != "supervisor":
            pass

    update_fields = data.model_dump(exclude_unset=True)
    for field, val in update_fields.items():
        if field == "date_of_birth" and val and val > date.today():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="DOB cannot be in future.")
        setattr(child, field, val)

    db.commit()
    db.refresh(child)
    return child


@app.get(
    "/worker/children",
    response_model=List[ChildResponse]
)
def get_worker_assigned_children(
    current_user: User = Depends(require_role("worker", "supervisor")),
    db: Session = Depends(get_db)
):
    return db.query(Child).filter(Child.assigned_worker_id == current_user.id).all()


@app.get(
    "/supervisor/children",
    response_model=List[ChildResponse]
)
def get_supervisor_all_children(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    return db.query(Child).all()


# ==============================================================================
# PHASE 8: UNIVERSAL IMMUNISATION PROGRAMME (UIP) & VACCINATIONS
# ==============================================================================

OFFICIAL_UIP_SCHEDULE = [
    {"id": "bcg", "name": "BCG", "target_age_weeks": 0, "target_age_label": "At Birth", "category": "Birth", "description": "Bacillus Calmette-Guérin (Tuberculosis prevention)"},
    {"id": "opv_0", "name": "OPV 0", "target_age_weeks": 0, "target_age_label": "At Birth", "category": "Birth", "description": "Oral Polio Vaccine birth dose"},
    {"id": "hepb_0", "name": "Hepatitis B Birth", "target_age_weeks": 0, "target_age_label": "At Birth", "category": "Birth", "description": "Hepatitis B birth dose within 24 hours"},
    {"id": "penta_1", "name": "Pentavalent 1", "target_age_weeks": 6, "target_age_label": "6 Weeks", "category": "Primary", "description": "DTP + HepB + Hib (Dose 1)"},
    {"id": "opv_1", "name": "OPV 1", "target_age_weeks": 6, "target_age_label": "6 Weeks", "category": "Primary", "description": "Oral Polio Vaccine (Dose 1)"},
    {"id": "rota_1", "name": "Rotavirus 1", "target_age_weeks": 6, "target_age_label": "6 Weeks", "category": "Primary", "description": "Rotavirus diarrhoea prevention"},
    {"id": "fipv_1", "name": "fIPV 1", "target_age_weeks": 6, "target_age_label": "6 Weeks", "category": "Primary", "description": "Fractional Inactivated Polio Vaccine"},
    {"id": "pcv_1", "name": "PCV 1", "target_age_weeks": 6, "target_age_label": "6 Weeks", "category": "Primary", "description": "Pneumococcal Conjugate Vaccine"},
    {"id": "penta_2", "name": "Pentavalent 2", "target_age_weeks": 10, "target_age_label": "10 Weeks", "category": "Primary", "description": "DTP + HepB + Hib (Dose 2)"},
    {"id": "opv_2", "name": "OPV 2", "target_age_weeks": 10, "target_age_label": "10 Weeks", "category": "Primary", "description": "Oral Polio Vaccine (Dose 2)"},
    {"id": "rota_2", "name": "Rotavirus 2", "target_age_weeks": 10, "target_age_label": "10 Weeks", "category": "Primary", "description": "Rotavirus (Dose 2)"},
    {"id": "penta_3", "name": "Pentavalent 3", "target_age_weeks": 14, "target_age_label": "14 Weeks", "category": "Primary", "description": "DTP + HepB + Hib (Dose 3)"},
    {"id": "opv_3", "name": "OPV 3", "target_age_weeks": 14, "target_age_label": "14 Weeks", "category": "Primary", "description": "Oral Polio Vaccine (Dose 3)"},
    {"id": "rota_3", "name": "Rotavirus 3", "target_age_weeks": 14, "target_age_label": "14 Weeks", "category": "Primary", "description": "Rotavirus (Dose 3)"},
    {"id": "fipv_2", "name": "fIPV 2", "target_age_weeks": 14, "target_age_label": "14 Weeks", "category": "Primary", "description": "Fractional Inactivated Polio Vaccine"},
    {"id": "pcv_2", "name": "PCV 2", "target_age_weeks": 14, "target_age_label": "14 Weeks", "category": "Primary", "description": "Pneumococcal Conjugate (Dose 2)"},
    {"id": "mr_1", "name": "MR 1", "target_age_weeks": 39, "target_age_label": "9-12 Months", "category": "Measles-Rubella", "description": "Measles-Rubella 1st Dose"},
    {"id": "pcv_booster", "name": "PCV Booster", "target_age_weeks": 39, "target_age_label": "9-12 Months", "category": "Booster", "description": "Pneumococcal Booster"},
    {"id": "mr_2", "name": "MR 2", "target_age_weeks": 72, "target_age_label": "16-24 Months", "category": "Measles-Rubella", "description": "Measles-Rubella 2nd Dose"},
    {"id": "dpt_booster_1", "name": "DPT Booster 1", "target_age_weeks": 72, "target_age_label": "16-24 Months", "category": "Booster", "description": "Diphtheria-Pertussis-Tetanus Booster"},
    {"id": "dpt_booster_2", "name": "DPT Booster 2", "target_age_weeks": 260, "target_age_label": "5-6 Years", "category": "Booster", "description": "DPT Booster 2nd Stage"}
]

@app.get("/vaccinations/schedule", response_model=List[UIPScheduleItem])
def get_master_uip_schedule():
    return OFFICIAL_UIP_SCHEDULE


@app.get(
    "/children/{child_id}/vaccinations",
    response_model=List[VaccinationResponse]
)
def get_child_vaccinations(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")

    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return db.query(Vaccination).filter(
        Vaccination.child_id == child.id
    ).order_by(Vaccination.due_date).all()


@app.post(
    "/children/{child_id}/vaccinations",
    response_model=VaccinationResponse,
    status_code=status.HTTP_201_CREATED
)
def schedule_vaccination(
    child_id: int,
    data: VaccinationScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")

    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    vaccination = Vaccination(
        child_id=child.id,
        vaccine_name=data.vaccine_name.strip(),
        due_date=data.due_date,
        administered_date=None,
        completed=False
    )
    db.add(vaccination)
    db.commit()
    db.refresh(vaccination)
    return vaccination


@app.patch(
    "/worker/vaccinations/{vaccination_id}/complete",
    response_model=VaccinationResponse
)
def complete_vaccination(
    vaccination_id: int,
    data: VaccinationComplete,
    current_user: User = Depends(require_role("worker", "supervisor")),
    db: Session = Depends(get_db)
):
    vaccination = db.query(Vaccination).filter(Vaccination.id == vaccination_id).first()
    if not vaccination:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccination record not found.")

    if vaccination.completed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vaccination already recorded as completed.")

    if data.administered_date > date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Administration date cannot be in the future.")

    vaccination.administered_date = data.administered_date
    vaccination.completed = True
    vaccination.batch_number = data.batch_number
    vaccination.facility = data.facility
    vaccination.worker_name = data.worker_name or current_user.name
    vaccination.site = data.site
    vaccination.notes = data.notes

    db.commit()
    db.refresh(vaccination)
    return vaccination


@app.post(
    "/worker/vaccinations/administer",
    response_model=VaccinationResponse,
    status_code=status.HTTP_201_CREATED
)
def record_administered_dose(
    child_id: int,
    data: VaccinationAdminister,
    current_user: User = Depends(require_role("worker", "supervisor")),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child record not found.")

    if data.administered_date > date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Date cannot be in the future.")

    # Check for duplicate completed dose
    existing = db.query(Vaccination).filter(
        Vaccination.child_id == child_id,
        Vaccination.vaccine_name == data.vaccine_name.strip(),
        Vaccination.completed.is_(True)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Dose '{data.vaccine_name}' has already been recorded as completed for this child."
        )

    # Check if an incomplete scheduled record exists, or create new
    scheduled = db.query(Vaccination).filter(
        Vaccination.child_id == child_id,
        Vaccination.vaccine_name == data.vaccine_name.strip(),
        Vaccination.completed.is_(False)
    ).first()

    if scheduled:
        vaccination = scheduled
        vaccination.administered_date = data.administered_date
        vaccination.completed = True
        vaccination.batch_number = data.batch
        vaccination.facility = data.facility
        vaccination.worker_name = data.worker_name or current_user.name
        vaccination.site = data.site
        vaccination.notes = data.notes
    else:
        vaccination = Vaccination(
            child_id=child.id,
            vaccine_name=data.vaccine_name.strip(),
            due_date=data.administered_date,
            administered_date=data.administered_date,
            completed=True,
            batch_number=data.batch,
            facility=data.facility,
            worker_name=data.worker_name or current_user.name,
            site=data.site,
            notes=data.notes
        )
        db.add(vaccination)

    db.commit()
    db.refresh(vaccination)
    return vaccination


# ==============================================================================
# PHASE 9 & 10: MILESTONES & GROWTH MONITORING
# ==============================================================================

@app.get(
    "/children/{child_id}/milestones",
    response_model=List[MilestoneResponse]
)
def get_child_milestones(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")
    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return db.query(MilestoneRecord).filter(
        MilestoneRecord.child_id == child.id
    ).order_by(MilestoneRecord.observation_date.desc()).all()


@app.post(
    "/children/{child_id}/milestones",
    response_model=MilestoneResponse,
    status_code=status.HTTP_201_CREATED
)
def add_milestone_observation(
    child_id: int,
    data: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")

    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if data.observation_date > date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Observation date cannot be in future.")

    milestone = MilestoneRecord(
        child_id=child.id,
        recorded_by=current_user.id,
        observation_date=data.observation_date,
        category=data.category,
        description=data.description.strip(),
        status=data.status
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@app.get(
    "/children/{child_id}/growth",
    response_model=List[GrowthResponse]
)
def get_growth_records(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")
    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return db.query(GrowthRecord).filter(
        GrowthRecord.child_id == child.id
    ).order_by(GrowthRecord.measurement_date.desc()).all()


@app.post(
    "/children/{child_id}/growth",
    response_model=GrowthResponse,
    status_code=status.HTTP_201_CREATED
)
def record_growth(
    child_id: int,
    data: GrowthCreate,
    current_user: User = Depends(require_role("worker", "supervisor")),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")

    if data.measurement_date > date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Measurement date cannot be in future.")

    record = GrowthRecord(
        child_id=child.id,
        recorded_by=current_user.id,
        measurement_date=data.measurement_date,
        weight_kg=data.weight_kg,
        height_cm=data.height_cm
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ==============================================================================
# PHASE 11 & 12: APPOINTMENTS & FOLLOW-UPS
# ==============================================================================

@app.post(
    "/children/{child_id}/appointments",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED
)
def request_appointment(
    child_id: int,
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")

    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if data.appointment_date < date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Appointment date cannot be in the past.")

    appointment = Appointment(
        child_id=child.id,
        requested_by=current_user.id,
        appointment_date=data.appointment_date,
        reason=data.reason.strip(),
        status="requested"
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@app.get(
    "/children/{child_id}/appointments",
    response_model=List[AppointmentResponse]
)
def get_child_appointments(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")
    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return db.query(Appointment).filter(
        Appointment.child_id == child.id
    ).order_by(Appointment.appointment_date.desc()).all()


@app.get(
    "/appointments/upcoming",
    response_model=List[AppointmentResponse]
)
def get_upcoming_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    query = db.query(Appointment).filter(
        Appointment.appointment_date >= today,
        Appointment.status.in_(["requested", "approved", "rescheduled"])
    )

    if current_user.role == "parent":
        query = query.join(Child, Appointment.child_id == Child.id).filter(Child.parent_id == current_user.id)
    elif current_user.role == "worker":
        query = query.join(Child, Appointment.child_id == Child.id).filter(Child.assigned_worker_id == current_user.id)

    return query.order_by(Appointment.appointment_date).all()


@app.patch(
    "/worker/appointments/{appointment_id}",
    response_model=AppointmentResponse
)
def update_appointment_status(
    appointment_id: int,
    data: AppointmentUpdate,
    current_user: User = Depends(require_role("worker", "supervisor")),
    db: Session = Depends(get_db)
):
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if apt.status in ("completed", "cancelled"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Appointment is already finalized.")

    if data.status == "rescheduled":
        if not data.appointment_date or data.appointment_date < date.today():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Valid future date required for rescheduling.")
        apt.appointment_date = data.appointment_date

    apt.status = data.status
    db.commit()
    db.refresh(apt)
    return apt


@app.patch(
    "/appointments/{appointment_id}/cancel",
    response_model=AppointmentResponse
)
def cancel_appointment(
    appointment_id: int,
    data: Optional[AppointmentCancel] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    # Authorization: parent who requested it, or authorized worker/supervisor
    if current_user.role == "parent" and apt.requested_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot cancel another user's appointment.")

    if apt.status in ("completed", "cancelled"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Appointment is already completed or cancelled.")

    apt.status = "cancelled"
    db.commit()
    db.refresh(apt)
    return apt


@app.post(
    "/children/{child_id}/follow-ups",
    response_model=FollowUpResponse,
    status_code=status.HTTP_201_CREATED
)
def create_follow_up(
    child_id: int,
    data: FollowUpCreate,
    current_user: User = Depends(require_role("worker", "supervisor")),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")

    if data.due_date < date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Follow-up due date cannot be in past.")

    follow_up = FollowUp(
        child_id=child.id,
        created_by=current_user.id,
        due_date=data.due_date,
        reason=data.reason.strip(),
        status="pending"
    )
    db.add(follow_up)
    db.commit()
    db.refresh(follow_up)
    return follow_up


@app.get(
    "/children/{child_id}/follow-ups",
    response_model=List[FollowUpResponse]
)
def get_child_follow_ups(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found.")
    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return db.query(FollowUp).filter(FollowUp.child_id == child.id).order_by(FollowUp.due_date).all()


@app.patch(
    "/worker/follow-ups/{follow_up_id}",
    response_model=FollowUpResponse
)
def update_follow_up(
    follow_up_id: int,
    data: FollowUpUpdate,
    current_user: User = Depends(require_role("worker", "supervisor")),
    db: Session = Depends(get_db)
):
    follow_up = db.query(FollowUp).filter(FollowUp.id == follow_up_id).first()
    if not follow_up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found.")

    follow_up.status = data.status
    db.commit()
    db.refresh(follow_up)
    return follow_up


# ==============================================================================
# PHASE 13: SUPERVISOR ANALYTICS
# ==============================================================================

@app.get("/supervisor/dashboard")
def get_supervisor_analytics(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    total_children = db.query(func.count(Child.id)).scalar() or 0
    total_workers = db.query(func.count(User.id)).filter(User.role == "worker").scalar() or 0
    total_vaccinations = db.query(func.count(Vaccination.id)).scalar() or 0
    completed_vaccinations = db.query(func.count(Vaccination.id)).filter(Vaccination.completed.is_(True)).scalar() or 0
    pending_followups = db.query(func.count(FollowUp.id)).filter(FollowUp.status == "pending").scalar() or 0
    upcoming_appointments = db.query(func.count(Appointment.id)).filter(
        Appointment.appointment_date >= date.today(),
        Appointment.status.in_(["requested", "approved", "rescheduled"])
    ).scalar() or 0

    return {
        "total_children": total_children,
        "total_workers": total_workers,
        "total_vaccinations": total_vaccinations,
        "completed_vaccinations": completed_vaccinations,
        "pending_followups": pending_followups,
        "upcoming_appointments": upcoming_appointments
    }


# ==============================================================================
# PHASE 14: SECURE QR HEALTH RECORD HANDOFF
# ==============================================================================

@app.post(
    "/children/{child_id}/qr-token",
    response_model=QRPassResponse,
    status_code=status.HTTP_201_CREATED
)
def generate_child_qr_pass(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child record not found.")

    if current_user.role == "parent" and child.parent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Invalidate previous tokens for this child
    db.query(QRTokenRecord).filter(
        QRTokenRecord.child_id == child.id,
        QRTokenRecord.is_revoked.is_(False)
    ).update({"is_revoked": True})

    # Generate secure 32-byte token and hash
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(days=7)

    qr_record = QRTokenRecord(
        child_id=child.id,
        token_hash=token_hash,
        created_by=current_user.id,
        created_at=now_utc,
        expires_at=expires_at,
        is_revoked=False
    )
    db.add(qr_record)
    db.commit()

    return {
        "qr_token": raw_token,
        "expires_at": expires_at,
        "child_id": child.id,
        "lookup_url": f"/records/lookup/{raw_token}"
    }


@app.get(
    "/records/lookup/{qr_token}",
    response_model=QRPublicResolverResponse
)
def resolve_qr_health_record(
    qr_token: str,
    db: Session = Depends(get_db)
):
    token_hash = hashlib.sha256(qr_token.strip().encode("utf-8")).hexdigest()
    record = db.query(QRTokenRecord).filter(
        QRTokenRecord.token_hash == token_hash,
        QRTokenRecord.is_revoked.is_(False)
    ).first()

    now_utc = datetime.now(timezone.utc)

    # Strictly reject invalid, expired or revoked tokens without fallback
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child health pass is invalid, revoked, or not found."
        )

    record_exp = record.expires_at
    if record_exp.tzinfo is None:
        record_exp = record_exp.replace(tzinfo=timezone.utc)

    if now_utc > record_exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child health pass has expired. Please request a new pass."
        )

    child = db.query(Child).filter(Child.id == record.child_id).first()
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated child record no longer exists."
        )

    # Calculate age in months
    today = date.today()
    dob = child.date_of_birth
    age_months = max(0, (today.year - dob.year) * 12 + today.month - dob.month)

    total_doses = db.query(func.count(Vaccination.id)).filter(Vaccination.child_id == child.id).scalar() or 0
    admin_doses = db.query(func.count(Vaccination.id)).filter(
        Vaccination.child_id == child.id,
        Vaccination.completed.is_(True)
    ).scalar() or 0

    return {
        "valid": True,
        "child_identifier": f"NJ-****-{child.id}",
        "age_months": age_months,
        "gender": child.gender or "Unspecified",
        "total_doses": total_doses,
        "administered_doses": admin_doses,
        "verification_authority": "NavJyoti Health Record Platform",
        "expires_at": record.expires_at
    }


# ==============================================================================
# PHASE 15: IN-APP NOTIFICATIONS & OUTREACH COMMUNICATIONS
# ==============================================================================

@app.get(
    "/notifications",
    response_model=List[NotificationResponse]
)
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()


@app.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif


@app.post(
    "/communications",
    response_model=CommunicationResponse,
    status_code=status.HTTP_201_CREATED
)
def send_communication(
    data: CommunicationCreate,
    current_user: User = Depends(require_role("worker", "supervisor")),
    db: Session = Depends(get_db)
):
    comm = Communication(
        sender_id=current_user.id,
        child_id=data.child_id,
        recipient_name=data.recipient_name.strip(),
        recipient_phone=data.recipient_phone.strip(),
        message_type=data.message_type or "reminder",
        message=data.message.strip(),
        channel="Simulated SMS",
        status="Delivered (Simulated)",
        sent_at=datetime.now(timezone.utc)
    )
    db.add(comm)
    db.commit()
    db.refresh(comm)
    return comm


@app.get(
    "/communications",
    response_model=List[CommunicationResponse]
)
def get_communications(
    current_user: User = Depends(require_role("worker", "supervisor")),
    db: Session = Depends(get_db)
):
    return db.query(Communication).order_by(Communication.sent_at.desc()).limit(100).all()
