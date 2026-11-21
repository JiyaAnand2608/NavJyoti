
from datetime import date
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

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func

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
    FollowUp
)

from schemas import (
    UserRegister,
    UserResponse,
    UserLogin,
    TokenResponse,
    ChildCreate,
    ChildResponse,
    VaccinationResponse,
    VaccinationScheduleCreate,
    VaccinationComplete,
    GrowthCreate,
    GrowthResponse,
    MilestoneCreate,
    MilestoneResponse,
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    FollowUpCreate,
    FollowUpResponse,
    FollowUpUpdate,
    ChatRequest,
    ChatResponse
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

import os
import re
import time
from collections import defaultdict, deque
from groq import Groq, APIConnectionError, APIStatusError, RateLimitError


app = FastAPI(title="NavJyoti API")



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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    data: UserRegister,
    db: Session = Depends(get_db)
):
    email = str(data.email).lower()

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    new_user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role="parent"
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    return new_user


@app.post("/auth/login", response_model=TokenResponse)
def login_user(
    data: UserLogin,
    db: Session = Depends(get_db)
):
    email = str(data.email).lower()

    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user or not verify_password(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }



security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = decode_access_token(credentials.credentials)

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


@app.get("/auth/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user


chat_windows = defaultdict(lambda: deque())


def reject_sensitive_chat_text(text: str):
    patterns = [
        r"\b(?:\+?91[\s-]?)?[6-9]\d{9}\b",
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        r"\b\d{12}\b",
        r"\b\d{10,16}\b",
    ]
    for pattern in patterns:
        if re.search(pattern, text):
            raise HTTPException(
                status_code=400,
                detail="Please remove private information or identifiers and try again.",
            )

    personal_child_reference = re.search(
        r"\b(?:my|our)\s+(?:child|baby|infant|son|daughter|kid)\b",
        text,
        re.IGNORECASE,
    )
    child_health_detail = re.search(
        r"\b(?:vaccin\w*|immuni[sz]\w*|dose|medical|health|symptom\w*|"
        r"diagnos\w*|medicin\w*|fever|rash|cough|vomit\w*|diarrh\w*|"
        r"weight|height|growth|allerg\w*|missed|received|taking|"
        r"has|had|is sick)\b",
        text,
        re.IGNORECASE,
    )
    if personal_child_reference and child_health_detail:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please ask a general educational question without sharing "
                "personal child-health details."
            ),
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
    reject_sensitive_chat_text(data.message)
    for item in data.history:
        reject_sensitive_chat_text(item.content)

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
    }.get(data.role, "parent/caregiver")
    language_name = "Hindi" if data.language == "hi" else "English"
    system_prompt = (
        "You are Kidzy AI, a friendly child-health companion for NavJyoti in India. "
        "Tagline: Little Steps, Brighter Futures. "
        f"The current NavJyoti interface language is {language_name}; respond primarily in that language. "
        "English and Hindi/Hinglish queries are supported; switch language only to match the user's wording. "
        f"Adapt your explanation to a {role_name}. "
        f"The user is currently on the NavJyoti page {data.page or '/'}; "
        "mention the current page naturally only when it helps navigation. "
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
        "or chat history; answer using only the current general question."
    )

    messages = [
        {"role": "system", "content": system_prompt},
    ]
    messages.extend(
        {"role": item.role, "content": item.content}
        for item in data.history[-12:]
    )
    messages.append({"role": "user", "content": data.message})

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

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Kidzy AI could not complete the request. Please try again.",
        )


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
    if current_user.role != "parent":
        raise HTTPException(
            status_code=403,
            detail="Only parents can register children"
        )

    if data.date_of_birth > date.today():
        raise HTTPException(
            status_code=422,
            detail="Date of birth cannot be in the future"
        )

    child = Child(
        name=data.name.strip(),
        date_of_birth=data.date_of_birth,
        parent_id=current_user.id
    )

    db.add(child)
    db.commit()
    db.refresh(child)

    return child



@app.get(
    "/children",
    response_model=list[ChildResponse]
)
def get_my_children(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "parent":
        raise HTTPException(
            status_code=403,
            detail="Only parents can view this list"
        )

    children = db.query(Child).filter(
        Child.parent_id == current_user.id
    ).all()

    return children


@app.get(
    "/children/{child_id}/vaccinations",
    response_model=list[VaccinationResponse]
)

def get_child_vaccinations(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "parent":
        child = db.query(Child).filter(
            Child.id == child_id,
            Child.parent_id == current_user.id
        ).first()

    elif current_user.role == "worker":
        child = db.query(Child).filter(
            Child.id == child_id,
            Child.assigned_worker_id == current_user.id
        ).first()

    else:
        raise HTTPException(
            status_code=403,
            detail="You cannot access these vaccination records"
        )

    if not child:
        raise HTTPException(
            status_code=404,
            detail="Child not found or access denied"
        )

    vaccinations = db.query(Vaccination).filter(
        Vaccination.child_id == child.id
    ).order_by(Vaccination.due_date).all()

    return vaccinations



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
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()

    if not child:
        raise HTTPException(
            status_code=404,
            detail="Child not found"
        )

    if current_user.role != "parent":
        raise HTTPException(
            status_code=403,
            detail="Only parents can use this endpoint"
        )

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



@app.get(
    "/worker/children",
    response_model=list[ChildResponse]
)
def get_assigned_children(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "worker":
        raise HTTPException(
            status_code=403,
            detail="Only health workers can access this endpoint"
        )

    children = db.query(Child).filter(
        Child.assigned_worker_id == current_user.id
    ).all()

    return children



@app.patch(
    "/worker/vaccinations/{vaccination_id}/complete",
    response_model=VaccinationResponse
)
def complete_vaccination(
    vaccination_id: int,
    data: VaccinationComplete,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "worker":
        raise HTTPException(
            status_code=403,
            detail="Only health workers can record vaccinations"
        )

    vaccination = (
        db.query(Vaccination)
        .join(Child, Vaccination.child_id == Child.id)
        .filter(
            Vaccination.id == vaccination_id,
            Child.assigned_worker_id == current_user.id
        )
        .first()
    )

    if vaccination is None:
        raise HTTPException(
            status_code=404,
            detail="Vaccination not found"
        )

    if vaccination.completed:
        raise HTTPException(
            status_code=409,
            detail="Vaccination already recorded"
        )

    today = date.today()

    if not (
        vaccination.child.date_of_birth
        <= data.administered_date
        <= today
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid administration date"
        )

    vaccination.administered_date = data.administered_date
    vaccination.completed = True

    db.commit()
    db.refresh(vaccination)

    return vaccination



@app.post(
    "/children/{child_id}/growth",
    response_model=GrowthResponse,
    status_code=status.HTTP_201_CREATED
)
def add_growth_record(
    child_id: int,
    data: GrowthCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "worker":
        raise HTTPException(
            status_code=403,
            detail="Only health workers can record growth"
        )

    child = db.query(Child).filter(
        Child.id == child_id,
        Child.assigned_worker_id == current_user.id
    ).first()

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Assigned child not found"
        )

    if not (
        child.date_of_birth
        <= data.measurement_date
        <= date.today()
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid measurement date"
        )

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


@app.get(
    "/children/{child_id}/growth",
    response_model=list[GrowthResponse]
)
def get_growth_records(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.id == child_id
    ).first()

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Child not found"
        )

    is_parent = (
        current_user.role == "parent"
        and child.parent_id == current_user.id
    )

    is_worker = (
        current_user.role == "worker"
        and child.assigned_worker_id == current_user.id
    )

    if not (is_parent or is_worker):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view growth records"
        )

    return db.query(GrowthRecord).filter(
        GrowthRecord.child_id == child.id
    ).order_by(
        GrowthRecord.measurement_date
    ).all()



@app.post(
    "/children/{child_id}/milestones",
    response_model=MilestoneResponse,
    status_code=status.HTTP_201_CREATED
)
def add_milestone(
    child_id: int,
    data: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "worker":
        raise HTTPException(
            status_code=403,
            detail="Only health workers can record milestones"
        )

    child = db.query(Child).filter(
        Child.id == child_id,
        Child.assigned_worker_id == current_user.id
    ).first()

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Assigned child not found"
        )

    if not (
        child.date_of_birth
        <= data.observation_date
        <= date.today()
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid observation date"
        )

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
    "/children/{child_id}/milestones",
    response_model=list[MilestoneResponse]
)
def get_milestones(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.id == child_id
    ).first()

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Child not found"
        )

    is_parent = (
        current_user.role == "parent"
        and child.parent_id == current_user.id
    )

    is_worker = (
        current_user.role == "worker"
        and child.assigned_worker_id == current_user.id
    )

    if not (is_parent or is_worker):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view milestones"
        )

    return db.query(MilestoneRecord).filter(
        MilestoneRecord.child_id == child.id
    ).order_by(
        MilestoneRecord.observation_date
    ).all()




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
    if current_user.role != "parent":
        raise HTTPException(
            status_code=403,
            detail="Only parents can request appointments"
        )

    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Child not found"
        )

    if data.appointment_date < date.today():
        raise HTTPException(
            status_code=422,
            detail="Appointment date cannot be in the past"
        )

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
    response_model=list[AppointmentResponse]
)
def get_child_appointments(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.id == child_id
    ).first()

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Child not found"
        )

    is_parent = (
        current_user.role == "parent"
        and child.parent_id == current_user.id
    )

    is_worker = (
        current_user.role == "worker"
        and child.assigned_worker_id == current_user.id
    )

    if not (is_parent or is_worker):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view appointments"
        )

    return db.query(Appointment).filter(
        Appointment.child_id == child.id
    ).order_by(
        Appointment.appointment_date
    ).all()


@app.patch(
    "/worker/appointments/{appointment_id}",
    response_model=AppointmentResponse
)
def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "worker":
        raise HTTPException(
            status_code=403,
            detail="Only health workers can update appointments"
        )

    appointment = (
        db.query(Appointment)
        .join(Child, Appointment.child_id == Child.id)
        .filter(
            Appointment.id == appointment_id,
            Child.assigned_worker_id == current_user.id
        )
        .first()
    )

    if appointment is None:
        raise HTTPException(
            status_code=404,
            detail="Assigned appointment not found"
        )

    if appointment.status in ("completed", "cancelled"):
        raise HTTPException(
            status_code=409,
            detail="Appointment already finalized"
        )

    if data.status == "rescheduled":
        if data.appointment_date is None:
            raise HTTPException(
                status_code=422,
                detail="New appointment date is required"
            )

        if data.appointment_date < date.today():
            raise HTTPException(
                status_code=422,
                detail="New date cannot be in the past"
            )

        appointment.appointment_date = data.appointment_date

    elif data.appointment_date is not None:
        raise HTTPException(
            status_code=422,
            detail="Date can only be changed when rescheduling"
        )

    appointment.status = data.status

    db.commit()
    db.refresh(appointment)

    return appointment



@app.get(
    "/appointments/upcoming",
    response_model=list[AppointmentResponse]
)
def get_upcoming_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()

    if current_user.role == "parent":
        appointments = (
            db.query(Appointment)
            .join(Child, Appointment.child_id == Child.id)
            .filter(
                Child.parent_id == current_user.id,
                Appointment.appointment_date >= today,
                Appointment.status.in_(
                    ["requested", "approved", "rescheduled"]
                )
            )
            .order_by(Appointment.appointment_date)
            .all()
        )

    elif current_user.role == "worker":
        appointments = (
            db.query(Appointment)
            .join(Child, Appointment.child_id == Child.id)
            .filter(
                Child.assigned_worker_id == current_user.id,
                Appointment.appointment_date >= today,
                Appointment.status.in_(
                    ["requested", "approved", "rescheduled"]
                )
            )
            .order_by(Appointment.appointment_date)
            .all()
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view upcoming appointments"
        )

    return appointments



@app.post(
    "/children/{child_id}/follow-ups",
    response_model=FollowUpResponse,
    status_code=status.HTTP_201_CREATED
)
def create_follow_up(
    child_id: int,
    data: FollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "worker":
        raise HTTPException(
            status_code=403,
            detail="Only health workers can create follow-ups"
        )

    child = db.query(Child).filter(
        Child.id == child_id,
        Child.assigned_worker_id == current_user.id
    ).first()

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Assigned child not found"
        )

    if data.due_date < date.today():
        raise HTTPException(
            status_code=422,
            detail="Due date cannot be in the past"
        )

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
    response_model=list[FollowUpResponse]
)
def get_follow_ups(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.id == child_id
    ).first()

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Child not found"
        )

    is_parent = (
        current_user.role == "parent"
        and child.parent_id == current_user.id
    )

    is_worker = (
        current_user.role == "worker"
        and child.assigned_worker_id == current_user.id
    )

    if not (is_parent or is_worker):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view follow-ups"
        )

    return db.query(FollowUp).filter(
        FollowUp.child_id == child.id
    ).order_by(FollowUp.due_date).all()


@app.patch(
    "/worker/follow-ups/{follow_up_id}",
    response_model=FollowUpResponse
)
def update_follow_up(
    follow_up_id: int,
    data: FollowUpUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "worker":
        raise HTTPException(
            status_code=403,
            detail="Only health workers can update follow-ups"
        )

    follow_up = (
        db.query(FollowUp)
        .join(Child, FollowUp.child_id == Child.id)
        .filter(
            FollowUp.id == follow_up_id,
            Child.assigned_worker_id == current_user.id
        )
        .first()
    )

    if follow_up is None:
        raise HTTPException(
            status_code=404,
            detail="Assigned follow-up not found"
        )

    if follow_up.status in ("completed", "cancelled"):
        raise HTTPException(
            status_code=409,
            detail="Follow-up already finalized"
        )

    follow_up.status = data.status

    db.commit()
    db.refresh(follow_up)

    return follow_up



@app.get("/supervisor/dashboard")
def supervisor_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "supervisor":
        raise HTTPException(
            status_code=403,
            detail="Only supervisors can access this dashboard"
        )

    total_children = db.query(
        func.count(Child.id)
    ).scalar()

    total_workers = db.query(
        func.count(User.id)
    ).filter(
        User.role == "worker"
    ).scalar()

    total_vaccinations = db.query(
        func.count(Vaccination.id)
    ).scalar()

    completed_vaccinations = db.query(
        func.count(Vaccination.id)
    ).filter(
        Vaccination.completed.is_(True)
    ).scalar()

    pending_followups = db.query(
        func.count(FollowUp.id)
    ).filter(
        FollowUp.status == "pending"
    ).scalar()

    upcoming_appointments = db.query(
        func.count(Appointment.id)
    ).filter(
        Appointment.appointment_date >= date.today(),
        Appointment.status.in_(
            ["requested", "approved", "rescheduled"]
        )
    ).scalar()

    return {
        "total_children": total_children,
        "total_workers": total_workers,
        "total_vaccinations": total_vaccinations,
        "completed_vaccinations": completed_vaccinations,
        "pending_followups": pending_followups,
        "upcoming_appointments": upcoming_appointments
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


add_api_v1_aliases(app)
