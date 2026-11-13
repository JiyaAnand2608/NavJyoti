
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
    FollowUpUpdate
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)


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
