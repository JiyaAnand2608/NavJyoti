import csv
import io
import json
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
from fastapi.responses import StreamingResponse
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
    QRTokenRecord,
    AuditLog
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
    ChatRequest,
    ChatResponse,
    NotificationResponse,
    CommunicationCreate,
    CommunicationResponse,
    QRPassResponse,
    QRPublicResolverResponse,
    AuditLogResponse,
    SupervisorDashboardStats,
    SupervisorWorkerSummary,
    SupervisorWorkerDetail,
    SupervisorChildOverview,
    SupervisorChildDetail,
    SupervisorVaccinationMonitoring,
    SupervisorFollowUpOverview,
    SupervisorReportSummary,
    SupervisorAlert,
    SupervisorProfileResponse
)
from phone_utils import normalize_indian_phone, is_valid_indian_phone
import re
import time
from collections import defaultdict, deque
from groq import Groq, APIConnectionError, APIStatusError, RateLimitError


app = FastAPI(title="NavJyoti API", version="1.0.0")

default_cors_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "https://navjyoti-web.vercel.app",
]
configured_cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
if "*" in configured_cors_origins:
    raise ValueError("CORS_ORIGINS must list trusted origins; '*' is not allowed.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(default_cors_origins + configured_cors_origins)),
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
# AUDIT LOGGING & JURISDICTION HELPERS
# ==============================================================================

def record_audit_event(
    db: Session,
    user_id: int,
    action_type: str,
    record_type: str,
    record_id: Optional[int] = None,
    child_id: Optional[int] = None,
    fields_changed: Optional[str] = None,
    previous_values: Optional[dict] = None,
    new_values: Optional[dict] = None
) -> AuditLog:
    """
    Add a mutation event to the clinical transaction while excluding credentials
    and direct personal identifiers from the audit payload.
    """
    sensitive_key_fragments = (
        "password",
        "token",
        "otp",
        "secret",
        "name",
        "phone",
        "email",
        "address",
        "village",
        "date_of_birth",
        "notes",
        "message",
        "recipient",
        "aadhaar",
        "parent_id",
        "worker_id",
        "assigned_worker_id",
        "child_id",
        "record_id",
    )

    def safe_values(values: Optional[dict]) -> Optional[dict]:
        if not values:
            return None
        return {
            key: value
            for key, value in values.items()
            if not any(fragment in key.casefold() for fragment in sensitive_key_fragments)
        } or None

    safe_prev = safe_values(previous_values)
    safe_new = safe_values(new_values)

    audit_entry = AuditLog(
        user_id=user_id,
        child_id=child_id,
        action_type=action_type,
        record_type=record_type,
        record_id=record_id,
        fields_changed=fields_changed,
        previous_values=json.dumps(safe_prev, default=str) if safe_prev else None,
        new_values=json.dumps(safe_new, default=str) if safe_new else None,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit_entry)
    return audit_entry


def flush_vaccination_changes(db: Session) -> None:
    try:
        db.flush()
    except IntegrityError as error:
        db.rollback()
        if "uq_vaccinations_child_vaccine_stage" in str(error.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This vaccine stage is already scheduled or recorded for this child."
            ) from error
        raise


def commit_vaccination_changes(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        if "uq_vaccinations_child_vaccine_stage" in str(error.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This vaccine stage is already scheduled or recorded for this child."
            ) from error
        raise


def get_supervisor_jurisdiction(supervisor: User) -> str:
    """
    Retrieves the assigned healthcare jurisdiction for an authenticated supervisor.
    If no jurisdiction or village is assigned, access is safely denied.
    """
    jurisdiction = (supervisor.jurisdiction or "").strip()
    if not jurisdiction:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No healthcare jurisdiction is assigned to this supervisor account. Access denied."
        )
    return jurisdiction


def get_jurisdiction_worker_ids(db: Session, jurisdiction: str) -> List[int]:
    """
    Returns the user IDs of all healthcare workers within the assigned jurisdiction.
    """
    j_lower = jurisdiction.strip().lower()
    workers = db.query(User.id).filter(
        User.role == "worker",
        (func.lower(func.trim(User.jurisdiction)) == j_lower)
        | (func.lower(func.trim(User.village)) == j_lower)
    ).all()
    return [w.id for w in workers]


def get_jurisdiction_child_ids(db: Session, jurisdiction: str, worker_ids: List[int]) -> List[int]:
    """
    Returns the child IDs of all children belonging to the assigned jurisdiction or assigned workers.
    """
    j_lower = jurisdiction.strip().lower()
    children = db.query(Child.id).filter(
        (func.lower(func.trim(Child.village)) == j_lower)
        | (Child.assigned_worker_id.in_(worker_ids) if worker_ids else False)
    ).all()
    return [c.id for c in children]


def get_authorized_child(
    child_id: int,
    current_user: User,
    db: Session,
    *,
    allow_supervisor: bool = True,
    for_update: bool = False
) -> Child:
    child_query = db.query(Child).filter(Child.id == child_id)
    if for_update:
        child_query = child_query.with_for_update()
    child = child_query.first()
    if child is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child record not found."
        )

    if current_user.role == "parent":
        authorized = child.parent_id == current_user.id
    elif current_user.role == "worker":
        authorized = child.assigned_worker_id == current_user.id
    elif current_user.role == "supervisor":
        if not allow_supervisor:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supervisors are restricted to read-only oversight."
            )
        jurisdiction = get_supervisor_jurisdiction(current_user)
        worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
        authorized = child.id in get_jurisdiction_child_ids(db, jurisdiction, worker_ids)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )

    if not authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this child record."
        )
    return child


def get_authorized_child_record(
    model,
    record_id: int,
    resource_name: str,
    current_user: User,
    db: Session,
    *,
    allow_supervisor: bool = True,
    for_update: bool = False
):
    record_query = db.query(model).filter(model.id == record_id)
    if for_update:
        record_query = record_query.with_for_update()
    record = record_query.first()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} not found."
        )
    child = get_authorized_child(
        record.child_id,
        current_user,
        db,
        allow_supervisor=allow_supervisor,
        for_update=for_update
    )
    return record, child



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


chat_windows = defaultdict(lambda: deque())


def canonical_chat_question(message: str) -> str:
    lowered = message.casefold()
    topic_keywords = {
        "vaccination": ("vaccin", "immuniz", "immunis", "dose", "schedule", "opv", "bcg"),
        "growth": ("growth", "weight", "height", "nutrition", "feeding", "food"),
        "development": ("milestone", "development", "speech", "walking", "motor"),
        "navigation": ("navjyoti", "dashboard", "appointment", "records", "reminder", "page"),
        "urgent care": ("emergency", "breathing", "seizure", "unresponsive", "severe bleeding"),
    }

    for topic, keywords in topic_keywords.items():
        if any(keyword in lowered for keyword in keywords):
            return (
                f"Give a concise general educational explanation about {topic} for children in India. "
                "Do not refer to an individual child, infer personal facts, or claim access to records."
            )

    return (
        "Briefly explain Kidzy AI's general child-health education and NavJyoti assistance scope, "
        "then invite a general question about vaccinations, growth, nutrition, milestones, or app navigation."
    )


def finish_chat_reply(reply: str, finish_reason: str | None) -> str:
    reply = reply.strip()
    if finish_reason != "length":
        return reply

    sentence_ends = list(re.finditer(r"[.!?।](?=\s|$)", reply))
    if sentence_ends:
        reply = reply[:sentence_ends[-1].end()].rstrip()
        return (
            f"{reply}\n\n"
            "I shortened this reply to avoid leaving it incomplete. "
            "Please ask me to continue or focus on one part."
        )

    return (
        "I couldn't safely finish that reply within the response limit. "
        "Please ask one focused follow-up question."
    )

@app.post("/chat", response_model=ChatResponse)
def chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    now = time.monotonic()
    window = chat_windows[current_user.id]
    window.append(now)
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) > 12:
        window.popleft()
        raise HTTPException(
            status_code=429,
            detail="Kidzy AI is receiving too many requests. Please wait a minute and try again.",
        )

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(
            status_code=503,
            detail="Kidzy AI is temporarily unavailable. Please try again later.",
        )

    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    role_name = {
        "parent": "parent/caregiver",
        "worker": "healthcare worker",
        "supervisor": "authority/supervisor",
    }.get(current_user.role, "parent/caregiver")
    language_name = "Hindi" if data.language == "hi" else "English"
    system_prompt = (
        "You are Kidzy AI, a friendly child-health companion for NavJyoti in India. "
        "Tagline: Little Steps, Brighter Futures. "
        f"The current NavJyoti interface language is {language_name}; respond primarily in that language. "
        "English and Hindi/Hinglish queries are supported; switch language only to match the user's wording. "
        f"Adapt your explanation to a {role_name}. "
        "Help with general childhood vaccinations, growth and development, nutrition, preventive care, "
        "and explaining NavJyoti pages. For India's routine vaccine schedule, use the Government of India "
        "National Health Mission (NHM) Immunization reference: "
        "https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=824&lid=220. "
        "Use only verified authoritative sources. For general guidance, may reference WHO "
        "(https://www.who.int/health-topics/child-health), UNICEF India "
        "(https://www.unicef.org/india/child-health), and MoHFW India "
        "(https://www.mohfw.gov.in/). Include a relevant source link when giving health advice, "
        "and never invent or fabricate a record, date, schedule, citation, or source. "
        "NavJyoti navigation links: Parent vaccination tracker (/parent/vaccines), developmental milestones "
        "(/parent/milestones), appointments (/parent/appointments), reminders (/parent/reminders), child records "
        "(/parent/records), and help (/parent/help). Healthcare-worker equivalents include /worker/registry, "
        "/worker/vaccinations, /worker/appointments, /worker/priority, and /worker/messages. Supervisors use "
        "/supervisor/analytics. Provide these as Markdown links only when relevant. "
        "For irrelevant questions, briefly redirect to child-health, vaccinations, nutrition, growth, milestones, "
        "NavJyoti navigation, or appropriate professional help. "
        "For possible emergencies (breathing difficulty, severe bleeding, blue/gray lips, seizure, "
        "unresponsiveness, severe dehydration, or similar), advise stopping online use and seeking immediate "
        "professional/emergency care. "
        "Never diagnose or prescribe medicines, give medication dosages, or suggest that you can modify clinical records. "
        "When you give UIP timing, cite this source link in the answer. "
        "UIP schedule facts: OPV-0 is an additional oral birth dose and does not replace the routine OPV "
        "series; routine OPV doses are at 6, 10 and 14 weeks, with a booster at 16-24 months. "
        "Pentavalent vaccine (DPT + Hepatitis B + Hib) is given at 6, 10 and 14 weeks; this does not "
        "replace the separate Hepatitis B birth dose. Fractional IPV (fIPV) is given intradermally at "
        "6 weeks, 14 weeks and 9-12 months under India's UIP schedule. PCV is given at 6 and 14 weeks "
        "with a booster at 9-12 months. JE vaccine is only for endemic districts. Clearly label these "
        "as India's UIP schedule; do not present optional/private schedules as UIP requirements, and "
        "refer families to their local vaccination provider for current state implementation. "
        "Do not diagnose, prescribe medication, give individualized medicine "
        "dosages, claim to know personal records, or invent dates or medical histories. Clearly mark general "
        "information, encourage qualified professional care for personal concerns, and advise prompt professional "
        "or emergency help for urgent or serious symptoms. Never include or request names, phone numbers, addresses, "
        "email addresses, Aadhaar numbers, medical records, or other private data. Do not use any child records "
        "or chat history; answer only the supplied general topic."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": canonical_chat_question(data.message)},
    ]

    try:
        client = Groq(api_key=groq_api_key)
        completion = client.chat.completions.create(
            model=groq_model,
            messages=messages,
            temperature=0.6,
            max_tokens=1200,
            timeout=20,
        )
        choice = completion.choices[0]
        reply = finish_chat_reply(
            choice.message.content or "",
            choice.finish_reason,
        )
        if not reply:
            raise HTTPException(
                status_code=502,
                detail="Kidzy AI could not prepare a reply. Please try again.",
            )
        return {"reply": reply}
    except RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="The AI provider is busy or has reached its usage limit. Please try again later.",
        )
    except APIConnectionError as e:
        print("KIDZY Groq connection error:", type(e).__name__)
        raise HTTPException(
            status_code=502,
            detail="Kidzy AI could not connect right now. Please try again.",
        )

    except APIStatusError as e:
        print("KIDZY Groq API HTTP status:", e.status_code)
        raise HTTPException(
            status_code=502,
            detail="Kidzy AI could not connect right now. Please try again.",
        )


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
        if data.assigned_worker_id is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Parents cannot assign healthcare workers directly."
            )
        assigned_worker_id = None
    elif current_user.role == "worker":
        parent_id = current_user.id
        if data.assigned_worker_id not in (None, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Workers can only assign themselves to a child during registration."
            )
        assigned_worker_id = current_user.id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisors cannot register individual children directly."
        )

    assigned_village = current_user.village or (
        current_user.jurisdiction if current_user.role == "worker" else None
    )
    if data.village and (
        not assigned_village
        or data.village.strip().casefold() != assigned_village.strip().casefold()
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Child location must match the authenticated user's registered location."
        )

    child = Child(
        name=data.name.strip(),
        date_of_birth=data.date_of_birth,
        parent_id=parent_id,
        assigned_worker_id=assigned_worker_id,
        gender=data.gender or "Male",
        village=assigned_village,
        blood_group=data.blood_group,
        birth_weight_kg=data.birth_weight_kg,
        migration_status=data.migration_status or "resident",
        priority_level="green"
    )

    db.add(child)
    db.flush()

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="CREATE_CHILD",
        record_type="child",
        record_id=child.id,
        child_id=child.id,
        fields_changed="name,date_of_birth,gender,village,blood_group,birth_weight_kg",
        new_values={
            "name": child.name,
            "date_of_birth": str(child.date_of_birth),
            "gender": child.gender,
            "village": child.village,
            "blood_group": child.blood_group,
            "birth_weight_kg": child.birth_weight_kg
        }
    )

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
        jurisdiction = get_supervisor_jurisdiction(current_user)
        worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
        child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)
        return db.query(Child).filter(Child.id.in_(child_ids) if child_ids else False).all()
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied."
    )


@app.get(
    "/children/{child_id}",
    response_model=ChildResponse
)
def get_child_by_id(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_authorized_child(child_id, current_user, db)


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
    child = get_authorized_child(
        child_id,
        current_user,
        db,
        allow_supervisor=False
    )

    update_fields = data.model_dump(exclude_unset=True)
    if (
        "assigned_worker_id" in update_fields
        and update_fields["assigned_worker_id"] != child.assigned_worker_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker assignment changes require an authorized transfer workflow."
        )
    if (
        "village" in update_fields
        and (update_fields["village"] or "").strip().casefold()
        != (child.village or "").strip().casefold()
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Changing a child's jurisdiction requires an authorized transfer workflow."
        )
    if current_user.role == "parent" and "priority_level" in update_fields:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Parents cannot change clinical priority."
        )
    prev_values = {
        field: str(getattr(child, field, None))
        for field in update_fields.keys()
    }

    for field, val in update_fields.items():
        if field == "date_of_birth" and val and val > date.today():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="DOB cannot be in future.")
        setattr(child, field, val)

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="UPDATE_CHILD",
        record_type="child",
        record_id=child.id,
        child_id=child.id,
        fields_changed=", ".join(update_fields.keys()),
        previous_values=prev_values,
        new_values=update_fields
    )

    db.commit()
    db.refresh(child)
    return child


@app.get(
    "/worker/children",
    response_model=List[ChildResponse]
)
def get_worker_assigned_children(
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db)
):
    return db.query(Child).filter(Child.assigned_worker_id == current_user.id).all()


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
    child = get_authorized_child(child_id, current_user, db)

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
    child = get_authorized_child(
        child_id,
        current_user,
        db,
        allow_supervisor=False,
        for_update=True
    )

    normalized_name = data.vaccine_name.strip()
    duplicate = db.query(Vaccination.id).filter(
        Vaccination.child_id == child.id,
        func.lower(func.trim(Vaccination.vaccine_name)) == normalized_name.casefold()
    ).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Dose '{normalized_name}' is already scheduled or recorded for this child."
        )

    vaccination = Vaccination(
        child_id=child.id,
        vaccine_name=normalized_name,
        due_date=data.due_date,
        administered_date=None,
        completed=False
    )
    db.add(vaccination)
    flush_vaccination_changes(db)

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="SCHEDULE_VACCINATION",
        record_type="vaccination",
        record_id=vaccination.id,
        child_id=child.id,
        fields_changed="vaccine_name,due_date",
        new_values={"vaccine_name": vaccination.vaccine_name, "due_date": str(vaccination.due_date)}
    )

    commit_vaccination_changes(db)
    db.refresh(vaccination)
    return vaccination


@app.patch(
    "/worker/vaccinations/{vaccination_id}/complete",
    response_model=VaccinationResponse
)
def complete_vaccination(
    vaccination_id: int,
    data: VaccinationComplete,
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db)
):
    vaccination, child = get_authorized_child_record(
        Vaccination,
        vaccination_id,
        "Vaccination record",
        current_user,
        db,
        allow_supervisor=False,
        for_update=True
    )

    if vaccination.completed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Vaccination already recorded as completed.")

    if data.administered_date > date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Administration date cannot be in the future.")

    prev_values = {
        "completed": False,
        "administered_date": None
    }

    vaccination.administered_date = data.administered_date
    vaccination.completed = True
    vaccination.batch_number = data.batch_number
    vaccination.facility = data.facility
    vaccination.worker_name = current_user.name
    vaccination.site = data.site
    vaccination.notes = data.notes

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="COMPLETE_VACCINATION",
        record_type="vaccination",
        record_id=vaccination.id,
        child_id=vaccination.child_id,
        fields_changed="completed,administered_date,batch_number,facility,worker_name,site,notes",
        previous_values=prev_values,
        new_values={
            "completed": True,
            "administered_date": str(vaccination.administered_date),
            "batch_number": vaccination.batch_number,
            "facility": vaccination.facility,
            "worker_name": vaccination.worker_name
        }
    )

    commit_vaccination_changes(db)
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
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db)
):
    child = get_authorized_child(
        child_id,
        current_user,
        db,
        allow_supervisor=False,
        for_update=True
    )

    if data.administered_date > date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Date cannot be in the future.")

    # Check for duplicate completed dose
    normalized_name = data.vaccine_name.strip()
    existing = db.query(Vaccination).filter(
        Vaccination.child_id == child_id,
        func.lower(func.trim(Vaccination.vaccine_name)) == normalized_name.casefold(),
        Vaccination.completed.is_(True)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Dose '{normalized_name}' has already been recorded as completed for this child."
        )

    # Check if an incomplete scheduled record exists, or create new
    scheduled = db.query(Vaccination).filter(
        Vaccination.child_id == child_id,
        func.lower(func.trim(Vaccination.vaccine_name)) == normalized_name.casefold(),
        Vaccination.completed.is_(False)
    ).first()

    if scheduled:
        vaccination = scheduled
        vaccination.administered_date = data.administered_date
        vaccination.completed = True
        vaccination.batch_number = data.batch
        vaccination.facility = data.facility
        vaccination.worker_name = current_user.name
        vaccination.site = data.site
        vaccination.notes = data.notes
    else:
        vaccination = Vaccination(
            child_id=child.id,
            vaccine_name=normalized_name,
            due_date=data.administered_date,
            administered_date=data.administered_date,
            completed=True,
            batch_number=data.batch,
            facility=data.facility,
            worker_name=current_user.name,
            site=data.site,
            notes=data.notes
        )
        db.add(vaccination)

    flush_vaccination_changes(db)
    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="ADMINISTER_VACCINE",
        record_type="vaccination",
        record_id=vaccination.id,
        child_id=child.id,
        fields_changed="vaccine_name,administered_date,completed,batch_number,facility,worker_name",
        new_values={
            "vaccine_name": vaccination.vaccine_name,
            "administered_date": str(vaccination.administered_date),
            "batch_number": vaccination.batch_number,
            "facility": vaccination.facility,
            "worker_name": vaccination.worker_name
        }
    )

    commit_vaccination_changes(db)
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
    child = get_authorized_child(child_id, current_user, db)

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
    child = get_authorized_child(
        child_id,
        current_user,
        db,
        allow_supervisor=False
    )

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
    db.flush()

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="RECORD_MILESTONE",
        record_type="milestone",
        record_id=milestone.id,
        child_id=child.id,
        fields_changed="observation_date,category,status",
        new_values={
            "observation_date": str(milestone.observation_date),
            "category": milestone.category,
            "status": milestone.status
        }
    )

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
    child = get_authorized_child(child_id, current_user, db)

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
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db)
):
    child = get_authorized_child(
        child_id,
        current_user,
        db,
        allow_supervisor=False
    )

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
    db.flush()

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="RECORD_GROWTH",
        record_type="growth",
        record_id=record.id,
        child_id=child.id,
        fields_changed="weight_kg,height_cm,measurement_date",
        new_values={
            "weight_kg": record.weight_kg,
            "height_cm": record.height_cm,
            "measurement_date": str(record.measurement_date)
        }
    )

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
    child = get_authorized_child(child_id, current_user, db)

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
    db.flush()

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="CREATE_APPOINTMENT",
        record_type="appointment",
        record_id=appointment.id,
        child_id=child.id,
        fields_changed="appointment_date,reason,status",
        new_values={
            "appointment_date": str(appointment.appointment_date),
            "reason": appointment.reason,
            "status": appointment.status
        }
    )

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
    child = get_authorized_child(child_id, current_user, db)

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
    elif current_user.role == "supervisor":
        jurisdiction = get_supervisor_jurisdiction(current_user)
        worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
        child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)
        query = query.filter(Appointment.child_id.in_(child_ids) if child_ids else False)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return query.order_by(Appointment.appointment_date).all()


@app.patch(
    "/worker/appointments/{appointment_id}",
    response_model=AppointmentResponse
)
def update_appointment_status(
    appointment_id: int,
    data: AppointmentUpdate,
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db)
):
    apt, _child = get_authorized_child_record(
        Appointment,
        appointment_id,
        "Appointment",
        current_user,
        db,
        allow_supervisor=False
    )

    if apt.status in ("completed", "cancelled"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Appointment is already finalized.")

    prev_status = apt.status
    if data.status == "rescheduled":
        if not data.appointment_date or data.appointment_date < date.today():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Valid future date required for rescheduling.")
        apt.appointment_date = data.appointment_date

    apt.status = data.status

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="UPDATE_APPOINTMENT",
        record_type="appointment",
        record_id=apt.id,
        child_id=apt.child_id,
        fields_changed="status,appointment_date",
        previous_values={"status": prev_status},
        new_values={"status": apt.status, "appointment_date": str(apt.appointment_date)}
    )

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

    if current_user.role == "parent":
        _child = get_authorized_child(apt.child_id, current_user, db, allow_supervisor=False)
        if apt.requested_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot cancel another user's appointment.")
    elif current_user.role == "worker":
        _child = get_authorized_child(apt.child_id, current_user, db, allow_supervisor=False)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requesting parent or assigned worker may cancel an appointment."
        )

    if apt.status in ("completed", "cancelled"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Appointment is already completed or cancelled.")

    prev_status = apt.status
    apt.status = "cancelled"

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="CANCEL_APPOINTMENT",
        record_type="appointment",
        record_id=apt.id,
        child_id=apt.child_id,
        fields_changed="status",
        previous_values={"status": prev_status},
        new_values={"status": "cancelled"}
    )

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
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db)
):
    child = get_authorized_child(
        child_id,
        current_user,
        db,
        allow_supervisor=False
    )

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
    db.flush()

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="CREATE_FOLLOWUP",
        record_type="follow_up",
        record_id=follow_up.id,
        child_id=child.id,
        fields_changed="due_date,reason,status",
        new_values={
            "due_date": str(follow_up.due_date),
            "reason": follow_up.reason,
            "status": follow_up.status
        }
    )

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
    child = get_authorized_child(child_id, current_user, db)

    return db.query(FollowUp).filter(FollowUp.child_id == child.id).order_by(FollowUp.due_date).all()


@app.patch(
    "/worker/follow-ups/{follow_up_id}",
    response_model=FollowUpResponse
)
def update_follow_up(
    follow_up_id: int,
    data: FollowUpUpdate,
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db)
):
    follow_up, _child = get_authorized_child_record(
        FollowUp,
        follow_up_id,
        "Follow-up",
        current_user,
        db,
        allow_supervisor=False
    )

    prev_status = follow_up.status
    follow_up.status = data.status

    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="UPDATE_FOLLOWUP",
        record_type="follow_up",
        record_id=follow_up.id,
        child_id=follow_up.child_id,
        fields_changed="status",
        previous_values={"status": prev_status},
        new_values={"status": follow_up.status}
    )

    db.commit()
    db.refresh(follow_up)
    return follow_up


# ==============================================================================
# PHASE 13: DEDICATED AUTHORITY (SUPERVISOR) PORTAL APIS
# ==============================================================================

@app.get("/supervisor/dashboard", response_model=SupervisorDashboardStats)
def get_supervisor_dashboard(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)

    today = date.today()
    total_workers = len(worker_ids)
    total_children = len(child_ids)

    vac_query = db.query(Vaccination).filter(Vaccination.child_id.in_(child_ids) if child_ids else False)
    total_vaccinations = vac_query.count()
    completed_vaccinations = vac_query.filter(Vaccination.completed.is_(True)).count()
    overdue_vaccinations = vac_query.filter(
        Vaccination.completed.is_(False),
        Vaccination.due_date < today
    ).count()

    fu_query = db.query(FollowUp).filter(FollowUp.child_id.in_(child_ids) if child_ids else False)
    pending_followups = fu_query.filter(FollowUp.status == "pending").count()
    overdue_followups = fu_query.filter(
        FollowUp.status == "pending",
        FollowUp.due_date < today
    ).count()

    upcoming_appointments = db.query(Appointment).filter(
        Appointment.child_id.in_(child_ids) if child_ids else False,
        Appointment.appointment_date >= today,
        Appointment.status.in_(["requested", "approved", "rescheduled"])
    ).count()

    audit_query = db.query(AuditLog).filter(
        (AuditLog.user_id.in_(worker_ids) if worker_ids else False) |
        (AuditLog.child_id.in_(child_ids) if child_ids else False)
    ).order_by(AuditLog.timestamp.desc()).limit(10)

    recent_logs = audit_query.all()
    recent_activity = []
    for log in recent_logs:
        w_user = db.query(User).filter(User.id == log.user_id).first()
        c_record = db.query(Child).filter(Child.id == log.child_id).first() if log.child_id else None
        recent_activity.append(AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            worker_name=w_user.name if w_user else f"Worker #{log.user_id}",
            worker_id_code=w_user.worker_id if w_user else None,
            child_id=log.child_id,
            child_name=c_record.name if c_record else None,
            action_type=log.action_type,
            record_type=log.record_type,
            record_id=log.record_id,
            fields_changed=log.fields_changed,
            previous_values=log.previous_values,
            new_values=log.new_values,
            timestamp=log.timestamp
        ))

    vaccination_trends = []
    for m_offset in range(5, -1, -1):
        target_month = (today.replace(day=1) - timedelta(days=m_offset * 30)).replace(day=1)
        next_month = (target_month + timedelta(days=32)).replace(day=1)
        count = db.query(Vaccination).filter(
            Vaccination.child_id.in_(child_ids) if child_ids else False,
            Vaccination.completed.is_(True),
            Vaccination.administered_date >= target_month,
            Vaccination.administered_date < next_month
        ).count()
        vaccination_trends.append({
            "month": target_month.strftime("%b %Y"),
            "completed": count
        })

    resolved_followups = fu_query.filter(FollowUp.status.in_(["completed", "resolved"])).count()
    cancelled_followups = fu_query.filter(FollowUp.status == "cancelled").count()
    followup_status_breakdown = {
        "pending": pending_followups - overdue_followups,
        "overdue": overdue_followups,
        "completed": resolved_followups,
        "cancelled": cancelled_followups
    }

    return SupervisorDashboardStats(
        jurisdiction=jurisdiction,
        total_workers=total_workers,
        total_children=total_children,
        total_vaccinations=total_vaccinations,
        completed_vaccinations=completed_vaccinations,
        pending_followups=pending_followups,
        overdue_followups=overdue_followups,
        upcoming_appointments=upcoming_appointments,
        overdue_vaccinations=overdue_vaccinations,
        recent_activity=recent_activity,
        vaccination_trends=vaccination_trends,
        followup_status_breakdown=followup_status_breakdown
    )


@app.get("/supervisor/workers", response_model=List[SupervisorWorkerSummary])
def get_supervisor_workers(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)

    workers = db.query(User).filter(User.id.in_(worker_ids)).all() if worker_ids else []
    result = []
    for w in workers:
        assigned_count = db.query(func.count(Child.id)).filter(Child.assigned_worker_id == w.id).scalar() or 0
        vac_count = db.query(func.count(Vaccination.id)).filter(
            Vaccination.completed.is_(True),
            (Vaccination.worker_name == w.name) | (Vaccination.child_id.in_(
                db.query(Child.id).filter(Child.assigned_worker_id == w.id)
            ))
        ).scalar() or 0
        pending_fu = db.query(func.count(FollowUp.id)).filter(
            FollowUp.created_by == w.id,
            FollowUp.status == "pending"
        ).scalar() or 0
        last_log = db.query(AuditLog.timestamp).filter(AuditLog.user_id == w.id).order_by(AuditLog.timestamp.desc()).first()

        result.append(SupervisorWorkerSummary(
            id=w.id,
            name=w.name,
            email=w.email,
            worker_id=w.worker_id,
            village=w.village,
            jurisdiction=w.jurisdiction,
            assigned_children_count=assigned_count,
            vaccinations_recorded_count=vac_count,
            pending_followups_count=pending_fu,
            last_activity=last_log[0] if last_log else None
        ))
    return result


@app.get("/supervisor/workers/{worker_id}", response_model=SupervisorWorkerDetail)
def get_supervisor_worker_detail(
    worker_id: int,
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    allowed_worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    if worker_id not in allowed_worker_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Worker outside assigned jurisdiction.")

    w = db.query(User).filter(User.id == worker_id, User.role == "worker").first()
    if not w:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found.")

    children = db.query(Child).filter(Child.assigned_worker_id == w.id).all()
    assigned_children = [
        {
            "id": c.id,
            "name": c.name,
            "date_of_birth": c.date_of_birth.isoformat(),
            "gender": c.gender,
            "village": c.village,
            "priority_level": c.priority_level
        }
        for c in children
    ]

    vacs = db.query(Vaccination).filter(
        (Vaccination.worker_name == w.name) |
        (Vaccination.child_id.in_([c.id for c in children]) if children else False)
    ).order_by(Vaccination.due_date.desc()).limit(50).all()
    vaccination_activities = [
        {
            "id": v.id,
            "child_id": v.child_id,
            "vaccine_name": v.vaccine_name,
            "administered_date": v.administered_date.isoformat() if v.administered_date else None,
            "completed": v.completed,
            "batch_number": v.batch_number,
            "facility": v.facility
        }
        for v in vacs
    ]

    fus = db.query(FollowUp).filter(FollowUp.created_by == w.id).order_by(FollowUp.due_date.desc()).limit(50).all()
    follow_ups = [
        {
            "id": f.id,
            "child_id": f.child_id,
            "due_date": f.due_date.isoformat(),
            "reason": f.reason,
            "status": f.status
        }
        for f in fus
    ]

    apts = db.query(Appointment).filter(
        Appointment.child_id.in_([c.id for c in children]) if children else False
    ).order_by(Appointment.appointment_date.desc()).limit(50).all()
    appointments = [
        {
            "id": a.id,
            "child_id": a.child_id,
            "appointment_date": a.appointment_date.isoformat(),
            "reason": a.reason,
            "status": a.status
        }
        for a in apts
    ]

    logs = db.query(AuditLog).filter(AuditLog.user_id == w.id).order_by(AuditLog.timestamp.desc()).limit(50).all()
    recent_record_updates = [
        AuditLogResponse(
            id=l.id,
            user_id=l.user_id,
            worker_name=w.name,
            worker_id_code=w.worker_id,
            child_id=l.child_id,
            child_name=db.query(Child.name).filter(Child.id == l.child_id).scalar() if l.child_id else None,
            action_type=l.action_type,
            record_type=l.record_type,
            record_id=l.record_id,
            fields_changed=l.fields_changed,
            previous_values=l.previous_values,
            new_values=l.new_values,
            timestamp=l.timestamp
        )
        for l in logs
    ]

    return SupervisorWorkerDetail(
        id=w.id,
        name=w.name,
        email=w.email,
        phone=w.phone,
        worker_id=w.worker_id,
        village=w.village,
        jurisdiction=w.jurisdiction,
        assigned_children=assigned_children,
        vaccination_activities=vaccination_activities,
        follow_ups=follow_ups,
        appointments=appointments,
        recent_record_updates=recent_record_updates
    )


@app.get("/supervisor/children", response_model=List[SupervisorChildOverview])
def get_supervisor_children(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)

    children = db.query(Child).filter(Child.id.in_(child_ids)).all() if child_ids else []
    today = date.today()
    result = []
    for c in children:
        days = (today - c.date_of_birth).days
        if days < 60:
            age_str = f"{days // 7} weeks"
        elif days < 365:
            age_str = f"{days // 30} months"
        else:
            age_str = f"{days // 365} yr, {(days % 365) // 30} mo"

        w_name = None
        if c.assigned_worker_id:
            w_user = db.query(User).filter(User.id == c.assigned_worker_id).first()
            if w_user:
                w_name = w_user.name

        total_doses = db.query(func.count(Vaccination.id)).filter(Vaccination.child_id == c.id).scalar() or 0
        comp_doses = db.query(func.count(Vaccination.id)).filter(
            Vaccination.child_id == c.id,
            Vaccination.completed.is_(True)
        ).scalar() or 0
        has_overdue = db.query(Vaccination.id).filter(
            Vaccination.child_id == c.id,
            Vaccination.completed.is_(False),
            Vaccination.due_date < today
        ).first() is not None

        if comp_doses == total_doses and total_doses > 0:
            vac_status = "Up to Date"
        elif has_overdue:
            vac_status = "Overdue"
        else:
            vac_status = "Pending"

        pending_fus = db.query(func.count(FollowUp.id)).filter(
            FollowUp.child_id == c.id,
            FollowUp.status == "pending"
        ).scalar() or 0

        result.append(SupervisorChildOverview(
            id=c.id,
            name=c.name,
            date_of_birth=c.date_of_birth,
            age_display=age_str,
            gender=c.gender,
            village=c.village,
            assigned_worker_id=c.assigned_worker_id,
            assigned_worker_name=w_name,
            vaccination_status=vac_status,
            completed_doses=comp_doses,
            total_doses=total_doses,
            pending_followups_count=pending_fus,
            migration_status=c.migration_status,
            priority_level=c.priority_level
        ))
    return result


@app.get("/supervisor/children/{child_id}", response_model=SupervisorChildDetail)
def get_supervisor_child_detail(
    child_id: int,
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)
    if child_id not in child_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Child record outside assigned jurisdiction.")

    c = db.query(Child).filter(Child.id == child_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child record not found.")

    today = date.today()
    days = (today - c.date_of_birth).days
    age_str = f"{days // 30} months" if days < 365 else f"{days // 365} years"

    parent_user = db.query(User).filter(User.id == c.parent_id).first()
    worker_user = db.query(User).filter(User.id == c.assigned_worker_id).first() if c.assigned_worker_id else None

    vaccinations = db.query(Vaccination).filter(Vaccination.child_id == c.id).order_by(Vaccination.due_date).all()
    follow_ups = db.query(FollowUp).filter(FollowUp.child_id == c.id).order_by(FollowUp.due_date).all()
    growth_records = db.query(GrowthRecord).filter(GrowthRecord.child_id == c.id).order_by(GrowthRecord.measurement_date.desc()).all()
    appointments = db.query(Appointment).filter(Appointment.child_id == c.id).order_by(Appointment.appointment_date.desc()).all()
    audit_logs = db.query(AuditLog).filter(AuditLog.child_id == c.id).order_by(AuditLog.timestamp.desc()).all()

    audit_responses = []
    for l in audit_logs:
        u = db.query(User).filter(User.id == l.user_id).first()
        audit_responses.append(AuditLogResponse(
            id=l.id,
            user_id=l.user_id,
            worker_name=u.name if u else f"User #{l.user_id}",
            worker_id_code=u.worker_id if u else None,
            child_id=l.child_id,
            child_name=c.name,
            action_type=l.action_type,
            record_type=l.record_type,
            record_id=l.record_id,
            fields_changed=l.fields_changed,
            previous_values=l.previous_values,
            new_values=l.new_values,
            timestamp=l.timestamp
        ))

    return SupervisorChildDetail(
        id=c.id,
        name=c.name,
        date_of_birth=c.date_of_birth,
        age_display=age_str,
        gender=c.gender,
        village=c.village,
        blood_group=c.blood_group,
        birth_weight_kg=c.birth_weight_kg,
        migration_status=c.migration_status,
        priority_level=c.priority_level,
        parent_name=parent_user.name if parent_user else None,
        assigned_worker_name=worker_user.name if worker_user else None,
        vaccinations=vaccinations,
        follow_ups=follow_ups,
        growth_records=growth_records,
        appointments=appointments,
        audit_trail=audit_responses
    )


@app.get("/supervisor/vaccinations", response_model=SupervisorVaccinationMonitoring)
def get_supervisor_vaccinations(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)

    today = date.today()
    vac_query = db.query(Vaccination).filter(Vaccination.child_id.in_(child_ids) if child_ids else False)
    total_scheduled = vac_query.count()
    completed = vac_query.filter(Vaccination.completed.is_(True)).count()
    overdue = vac_query.filter(Vaccination.completed.is_(False), Vaccination.due_date < today).count()
    pending = total_scheduled - completed - overdue

    workers = db.query(User).filter(User.id.in_(worker_ids)).all() if worker_ids else []
    worker_breakdown = []
    for w in workers:
        w_doses = db.query(func.count(Vaccination.id)).filter(
            Vaccination.completed.is_(True),
            (Vaccination.worker_name == w.name) | (Vaccination.child_id.in_(
                db.query(Child.id).filter(Child.assigned_worker_id == w.id)
            ))
        ).scalar() or 0
        worker_breakdown.append({
            "worker_id": w.id,
            "worker_name": w.name,
            "worker_id_code": w.worker_id,
            "village": w.village,
            "completed_doses": w_doses
        })

    timeline = []
    for m in range(5, -1, -1):
        target_month = (today.replace(day=1) - timedelta(days=m * 30)).replace(day=1)
        next_month = (target_month + timedelta(days=32)).replace(day=1)
        c_count = vac_query.filter(
            Vaccination.completed.is_(True),
            Vaccination.administered_date >= target_month,
            Vaccination.administered_date < next_month
        ).count()
        timeline.append({
            "month": target_month.strftime("%b %Y"),
            "doses_administered": c_count
        })

    overdue_vacs = vac_query.filter(Vaccination.completed.is_(False), Vaccination.due_date < today).all()
    overdue_child_ids = list({v.child_id for v in overdue_vacs})
    children_req_followup = []
    for cid in overdue_child_ids[:20]:
        ch = db.query(Child).filter(Child.id == cid).first()
        if ch:
            ch_overdues = [v.vaccine_name for v in overdue_vacs if v.child_id == cid]
            w_u = db.query(User).filter(User.id == ch.assigned_worker_id).first() if ch.assigned_worker_id else None
            children_req_followup.append({
                "child_id": ch.id,
                "child_name": ch.name,
                "village": ch.village,
                "assigned_worker_name": w_u.name if w_u else None,
                "overdue_vaccines": ch_overdues
            })

    return SupervisorVaccinationMonitoring(
        total_scheduled=total_scheduled,
        completed=completed,
        pending=pending,
        overdue=overdue,
        worker_breakdown=worker_breakdown,
        timeline=timeline,
        children_requiring_followup=children_req_followup
    )


@app.get("/supervisor/follow-ups", response_model=List[SupervisorFollowUpOverview])
def get_supervisor_followups(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)

    today = date.today()
    fus = db.query(FollowUp).filter(
        FollowUp.child_id.in_(child_ids) if child_ids else False
    ).order_by(FollowUp.due_date.asc()).all()

    result = []
    for f in fus:
        ch = db.query(Child).filter(Child.id == f.child_id).first()
        w = db.query(User).filter(User.id == ch.assigned_worker_id).first() if ch and ch.assigned_worker_id else None
        creator = db.query(User).filter(User.id == f.created_by).first()
        is_ov = (f.status == "pending" and f.due_date < today)

        result.append(SupervisorFollowUpOverview(
            id=f.id,
            child_id=f.child_id,
            child_name=ch.name if ch else f"Child #{f.child_id}",
            village=ch.village if ch else None,
            assigned_worker_name=w.name if w else None,
            due_date=f.due_date,
            reason=f.reason,
            status=f.status,
            is_overdue=is_ov,
            created_by_worker=creator.name if creator else None
        ))
    return result


@app.get("/supervisor/audit-logs", response_model=List[AuditLogResponse])
def get_supervisor_audit_logs(
    worker_id: Optional[int] = None,
    child_id: Optional[int] = None,
    action_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)

    query = db.query(AuditLog).filter(
        (AuditLog.user_id.in_(worker_ids) if worker_ids else False) |
        (AuditLog.child_id.in_(child_ids) if child_ids else False)
    )

    if worker_id is not None:
        if worker_id not in worker_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Worker outside jurisdiction.")
        query = query.filter(AuditLog.user_id == worker_id)

    if child_id is not None:
        if child_id not in child_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Child outside jurisdiction.")
        query = query.filter(AuditLog.child_id == child_id)

    if action_type:
        query = query.filter(AuditLog.action_type == action_type.strip())

    if start_date:
        query = query.filter(AuditLog.timestamp >= datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc))

    if end_date:
        query = query.filter(AuditLog.timestamp <= datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc))

    logs = query.order_by(AuditLog.timestamp.desc()).limit(200).all()

    result = []
    for l in logs:
        u = db.query(User).filter(User.id == l.user_id).first()
        ch = db.query(Child).filter(Child.id == l.child_id).first() if l.child_id else None
        result.append(AuditLogResponse(
            id=l.id,
            user_id=l.user_id,
            worker_name=u.name if u else f"User #{l.user_id}",
            worker_id_code=u.worker_id if u else None,
            child_id=l.child_id,
            child_name=ch.name if ch else None,
            action_type=l.action_type,
            record_type=l.record_type,
            record_id=l.record_id,
            fields_changed=l.fields_changed,
            previous_values=l.previous_values,
            new_values=l.new_values,
            timestamp=l.timestamp
        ))
    return result


@app.get("/supervisor/reports", response_model=SupervisorReportSummary)
def get_supervisor_reports(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)

    today = date.today()
    total_workers = len(worker_ids)
    total_children = len(child_ids)

    vac_query = db.query(Vaccination).filter(Vaccination.child_id.in_(child_ids) if child_ids else False)
    total_vacs = vac_query.count()
    completed_vacs = vac_query.filter(Vaccination.completed.is_(True)).count()
    overdue_vacs = vac_query.filter(Vaccination.completed.is_(False), Vaccination.due_date < today).count()

    pending_fu = db.query(FollowUp).filter(
        FollowUp.child_id.in_(child_ids) if child_ids else False,
        FollowUp.status == "pending"
    ).count()

    workers = db.query(User).filter(User.id.in_(worker_ids)).all() if worker_ids else []
    worker_perf = []
    for w in workers:
        assigned = db.query(func.count(Child.id)).filter(Child.assigned_worker_id == w.id).scalar() or 0
        comp_doses = db.query(func.count(Vaccination.id)).filter(
            Vaccination.completed.is_(True),
            (Vaccination.worker_name == w.name) | (Vaccination.child_id.in_(
                db.query(Child.id).filter(Child.assigned_worker_id == w.id)
            ))
        ).scalar() or 0
        pending_f = db.query(func.count(FollowUp.id)).filter(FollowUp.created_by == w.id, FollowUp.status == "pending").scalar() or 0
        worker_perf.append({
            "worker_id": w.id,
            "worker_name": w.name,
            "worker_id_code": w.worker_id,
            "assigned_children": assigned,
            "completed_vaccinations": comp_doses,
            "pending_followups": pending_f
        })

    trends = []
    for m in range(5, -1, -1):
        target_month = (today.replace(day=1) - timedelta(days=m * 30)).replace(day=1)
        next_month = (target_month + timedelta(days=32)).replace(day=1)
        c_count = vac_query.filter(
            Vaccination.completed.is_(True),
            Vaccination.administered_date >= target_month,
            Vaccination.administered_date < next_month
        ).count()
        trends.append({
            "month": target_month.strftime("%b %Y"),
            "completed_doses": c_count
        })

    return SupervisorReportSummary(
        generated_at=datetime.now(timezone.utc),
        jurisdiction=jurisdiction,
        total_workers=total_workers,
        total_children=total_children,
        total_vaccinations=total_vacs,
        completed_vaccinations=completed_vacs,
        overdue_vaccinations=overdue_vacs,
        pending_followups=pending_fu,
        worker_performance=worker_perf,
        trends=trends
    )


@app.get("/supervisor/reports/export-csv")
def export_supervisor_reports_csv(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)

    today = date.today()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["NavJyoti Healthcare Authority Operations Report"])
    writer.writerow(["Jurisdiction", jurisdiction])
    writer.writerow(["Generated Date (UTC)", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")])
    writer.writerow(["Total Supervised Workers", len(worker_ids)])
    writer.writerow(["Total Supervised Children", len(child_ids)])
    writer.writerow([])

    writer.writerow(["Worker ID", "Name", "Worker Code", "Village/Area", "Assigned Children", "Vaccinations Recorded", "Pending Follow-ups"])
    workers = db.query(User).filter(User.id.in_(worker_ids)).all() if worker_ids else []
    for w in workers:
        assigned = db.query(func.count(Child.id)).filter(Child.assigned_worker_id == w.id).scalar() or 0
        comp_doses = db.query(func.count(Vaccination.id)).filter(
            Vaccination.completed.is_(True),
            (Vaccination.worker_name == w.name) | (Vaccination.child_id.in_(
                db.query(Child.id).filter(Child.assigned_worker_id == w.id)
            ))
        ).scalar() or 0
        p_fu = db.query(func.count(FollowUp.id)).filter(FollowUp.created_by == w.id, FollowUp.status == "pending").scalar() or 0
        writer.writerow([w.id, w.name, w.worker_id or "N/A", w.village or "N/A", assigned, comp_doses, p_fu])

    output.seek(0)
    filename = f"navjyoti_authority_report_{jurisdiction.lower().replace(' ', '_')}_{today.isoformat()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/supervisor/alerts", response_model=List[SupervisorAlert])
def get_supervisor_alerts(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)

    today = date.today()
    alerts = []

    # 1. Overdue follow-ups
    overdue_fus = db.query(FollowUp).filter(
        FollowUp.child_id.in_(child_ids) if child_ids else False,
        FollowUp.status == "pending",
        FollowUp.due_date < today
    ).order_by(FollowUp.due_date.asc()).limit(20).all()

    for fu in overdue_fus:
        ch = db.query(Child).filter(Child.id == fu.child_id).first()
        days_overdue = (today - fu.due_date).days
        alerts.append(SupervisorAlert(
            id=f"fu-overdue-{fu.id}",
            alert_type="overdue_followup",
            severity="high",
            title=f"Overdue Follow-up ({days_overdue} days)",
            description=f"Follow-up for {ch.name if ch else 'child'} is overdue since {fu.due_date.isoformat()}. Reason: {fu.reason}",
            child_id=fu.child_id,
            worker_id=fu.created_by,
            due_date=fu.due_date,
            created_at=datetime.combine(fu.due_date, datetime.min.time(), tzinfo=timezone.utc)
        ))

    # 2. High priority child cases
    high_priority_children = db.query(Child).filter(
        Child.id.in_(child_ids) if child_ids else False,
        Child.priority_level.in_(["red", "high", "critical"])
    ).limit(10).all()

    for ch in high_priority_children:
        alerts.append(SupervisorAlert(
            id=f"priority-child-{ch.id}",
            alert_type="high_priority",
            severity="high",
            title=f"High Priority Child Flagged: {ch.name}",
            description=f"Child {ch.name} in {ch.village or 'jurisdiction'} is marked with priority level '{ch.priority_level}'. Review clinical record.",
            child_id=ch.id,
            worker_id=ch.assigned_worker_id,
            due_date=today,
            created_at=datetime.now(timezone.utc)
        ))

    # 3. Unresolved appointments
    missed_apts = db.query(Appointment).filter(
        Appointment.child_id.in_(child_ids) if child_ids else False,
        Appointment.status == "requested",
        Appointment.appointment_date < today
    ).limit(15).all()

    for apt in missed_apts:
        ch = db.query(Child).filter(Child.id == apt.child_id).first()
        alerts.append(SupervisorAlert(
            id=f"apt-missed-{apt.id}",
            alert_type="unresolved_appointment",
            severity="medium",
            title=f"Unresolved Appointment on {apt.appointment_date.isoformat()}",
            description=f"Appointment requested for {ch.name if ch else 'child'} was not confirmed or marked completed. Reason: {apt.reason}",
            child_id=apt.child_id,
            worker_id=ch.assigned_worker_id if ch else None,
            due_date=apt.appointment_date,
            created_at=datetime.combine(apt.appointment_date, datetime.min.time(), tzinfo=timezone.utc)
        ))

    # 4. Incomplete clinical records
    incomplete_children = db.query(Child).filter(
        Child.id.in_(child_ids) if child_ids else False,
        (Child.birth_weight_kg.is_(None)) | (Child.blood_group.is_(None))
    ).limit(10).all()

    for ch in incomplete_children:
        missing = []
        if ch.birth_weight_kg is None: missing.append("birth weight")
        if ch.blood_group is None: missing.append("blood group")
        alerts.append(SupervisorAlert(
            id=f"incomplete-child-{ch.id}",
            alert_type="incomplete_record",
            severity="low",
            title=f"Incomplete Health Profile: {ch.name}",
            description=f"Record is missing {' and '.join(missing)}. Frontline worker update required.",
            child_id=ch.id,
            worker_id=ch.assigned_worker_id,
            due_date=today,
            created_at=datetime.now(timezone.utc)
        ))

    return alerts


@app.get("/supervisor/profile", response_model=SupervisorProfileResponse)
def get_supervisor_profile(
    current_user: User = Depends(require_role("supervisor")),
    db: Session = Depends(get_db)
):
    jurisdiction = get_supervisor_jurisdiction(current_user)
    worker_ids = get_jurisdiction_worker_ids(db, jurisdiction)
    child_ids = get_jurisdiction_child_ids(db, jurisdiction, worker_ids)

    return SupervisorProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        jurisdiction=current_user.jurisdiction or jurisdiction,
        village=current_user.village,
        supervised_workers_count=len(worker_ids),
        supervised_children_count=len(child_ids)
    )


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
    child = get_authorized_child(
        child_id,
        current_user,
        db,
        allow_supervisor=False
    )

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
    db.flush()
    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="GENERATE_QR_PASS",
        record_type="qr_token",
        record_id=qr_record.id,
        child_id=child.id,
        fields_changed="expires_at",
        new_values={"expires_at": expires_at.isoformat()}
    )
    db.commit()

    return {
        "qr_token": raw_token,
        "expires_at": expires_at,
        "child_id": child.id,
        "lookup_url": f"/records/lookup/{raw_token}"
    }


def add_api_v1_aliases(app: FastAPI) -> None:
    for route in list(app.router.routes):
        path = getattr(route, "path", None)
        if not path or path.startswith("/api/v1"):
            continue

        methods = list(getattr(route, "methods", []) or ["GET"])
        if not methods:
            continue

        app.router.add_api_route(
            path=f"/api/v1{path}",
            endpoint=route.endpoint,
            methods=methods,
            response_model=getattr(route, "response_model", None),
            status_code=getattr(route, "status_code", None),
        )
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
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db)
):
    if data.child_id is not None:
        get_authorized_child(data.child_id, current_user, db, allow_supervisor=False)

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
    db.flush()
    record_audit_event(
        db=db,
        user_id=current_user.id,
        action_type="SEND_COMMUNICATION",
        record_type="communication",
        record_id=comm.id,
        child_id=comm.child_id,
        fields_changed="message_type,channel,status",
        new_values={
            "message_type": comm.message_type,
            "channel": comm.channel,
            "status": comm.status
        }
    )
    db.commit()
    db.refresh(comm)
    return comm


@app.get(
    "/communications",
    response_model=List[CommunicationResponse]
)
def get_communications(
    current_user: User = Depends(require_role("worker")),
    db: Session = Depends(get_db)
):
    assigned_child_ids = db.query(Child.id).filter(
        Child.assigned_worker_id == current_user.id
    )
    return db.query(Communication).filter(
        Communication.sender_id == current_user.id,
        (Communication.child_id.is_(None) | Communication.child_id.in_(assigned_child_ids))
    ).order_by(Communication.sent_at.desc()).limit(100).all()


add_api_v1_aliases(app)
