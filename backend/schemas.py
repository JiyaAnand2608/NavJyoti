from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, EmailStr, Field


# ==============================================================================
# AUTHENTICATION & USER SCHEMAS
# ==============================================================================

class ParentRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=10, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    email: Optional[EmailStr] = None
    village: Optional[str] = Field(default="Rampur", max_length=100)
    preferred_language: Optional[str] = Field(default="hi", max_length=10)
    consent: bool = Field(default=True)


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    village: Optional[str] = Field(default=None, max_length=100)
    preferred_language: Optional[str] = Field(default="hi", max_length=10)
    consent: Optional[bool] = True


class UserResponse(BaseModel):
    id: int
    name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    village: Optional[str] = None
    jurisdiction: Optional[str] = None
    preferred_language: Optional[str] = "hi"
    worker_id: Optional[str] = None
    consent: Optional[bool] = True

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Optional[str] = None
    user: Optional[UserResponse] = None


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatHistoryItem] = Field(default_factory=list, max_length=12)
    language: Literal["en", "hi"] = "en"
    role: Literal["parent", "worker", "supervisor"] = "parent"
    page: str = Field(default="", max_length=300)


class ChatResponse(BaseModel):
    reply: str


# ==============================================================================
# OTP AUTHENTICATION SCHEMAS (WORKER & SUPERVISOR)
# ==============================================================================

class OTPRequest(BaseModel):
    email: EmailStr
    role: Literal["worker", "supervisor"]


class OTPRequestResponse(BaseModel):
    message: str
    cooldown_seconds: int = 60


class OTPVerify(BaseModel):
    email: EmailStr
    role: Literal["worker", "supervisor"]
    otp: str = Field(min_length=6, max_length=6, pattern="^[0-9]{6}$")


# ==============================================================================
# CHILD SCHEMAS
# ==============================================================================

class ChildCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    date_of_birth: date
    gender: Optional[str] = "Male"
    village: Optional[str] = None
    blood_group: Optional[str] = None
    birth_weight_kg: Optional[float] = Field(default=None, gt=0, le=15)
    migration_status: Optional[str] = "resident"
    assigned_worker_id: Optional[int] = None


class ChildUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    village: Optional[str] = None
    blood_group: Optional[str] = None
    birth_weight_kg: Optional[float] = Field(default=None, gt=0, le=15)
    migration_status: Optional[str] = None
    assigned_worker_id: Optional[int] = None
    priority_level: Optional[str] = None


class ChildResponse(BaseModel):
    id: int
    name: str
    date_of_birth: date
    parent_id: int
    assigned_worker_id: Optional[int] = None
    gender: Optional[str] = "Male"
    village: Optional[str] = None
    blood_group: Optional[str] = None
    birth_weight_kg: Optional[float] = None
    migration_status: Optional[str] = "resident"
    priority_level: Optional[str] = "green"

    model_config = {"from_attributes": True}


# ==============================================================================
# VACCINATION SCHEMAS
# ==============================================================================

class VaccinationScheduleCreate(BaseModel):
    vaccine_name: str = Field(min_length=2, max_length=100)
    due_date: date


class VaccinationComplete(BaseModel):
    administered_date: date
    batch_number: Optional[str] = Field(default=None, max_length=50)
    facility: Optional[str] = Field(default=None, max_length=150)
    worker_name: Optional[str] = Field(default=None, max_length=100)
    site: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=300)


class VaccinationAdminister(BaseModel):
    vaccine_name: str = Field(min_length=2, max_length=100)
    administered_date: date
    batch: Optional[str] = Field(default=None, max_length=50)
    facility: Optional[str] = Field(default=None, max_length=150)
    worker_name: Optional[str] = Field(default=None, max_length=100)
    site: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=300)


class VaccinationResponse(BaseModel):
    id: int
    child_id: int
    vaccine_name: str
    due_date: date
    administered_date: Optional[date] = None
    completed: bool
    batch_number: Optional[str] = None
    facility: Optional[str] = None
    worker_name: Optional[str] = None
    site: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class UIPScheduleItem(BaseModel):
    id: str
    name: str
    target_age_weeks: int
    target_age_label: str
    category: str
    description: str


# ==============================================================================
# GROWTH SCHEMAS
# ==============================================================================

class GrowthCreate(BaseModel):
    measurement_date: date
    weight_kg: float = Field(gt=0, le=100)
    height_cm: float = Field(gt=0, le=250)


class GrowthResponse(BaseModel):
    id: int
    child_id: int
    recorded_by: int
    measurement_date: date
    weight_kg: float
    height_cm: float

    model_config = {"from_attributes": True}


# ==============================================================================
# MILESTONE SCHEMAS
# ==============================================================================

class MilestoneCreate(BaseModel):
    observation_date: date
    category: Literal["motor", "language", "social", "cognitive"]
    description: str = Field(min_length=3, max_length=500)
    status: Literal["observed", "not_yet_observed", "needs_follow_up"]


class MilestoneResponse(BaseModel):
    id: int
    child_id: int
    recorded_by: int
    observation_date: date
    category: str
    description: str
    status: str

    model_config = {"from_attributes": True}


# ==============================================================================
# APPOINTMENT SCHEMAS
# ==============================================================================

class AppointmentCreate(BaseModel):
    appointment_date: date
    reason: str = Field(min_length=3, max_length=300)


class AppointmentUpdate(BaseModel):
    status: Literal["approved", "rescheduled", "completed", "cancelled"]
    appointment_date: Optional[date] = None


class AppointmentCancel(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=300)


class AppointmentResponse(BaseModel):
    id: int
    child_id: int
    requested_by: int
    appointment_date: date
    reason: str
    status: str

    model_config = {"from_attributes": True}


# ==============================================================================
# FOLLOW-UP SCHEMAS
# ==============================================================================

class FollowUpCreate(BaseModel):
    due_date: date
    reason: str = Field(min_length=3, max_length=300)


class FollowUpUpdate(BaseModel):
    status: Literal["pending", "completed", "cancelled"]


class FollowUpResponse(BaseModel):
    id: int
    child_id: int
    created_by: int
    due_date: date
    reason: str
    status: str

    model_config = {"from_attributes": True}


# ==============================================================================
# NOTIFICATION SCHEMAS
# ==============================================================================

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    child_id: Optional[int] = None
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ==============================================================================
# COMMUNICATION SCHEMAS
# ==============================================================================

class CommunicationCreate(BaseModel):
    recipient_name: str = Field(min_length=2, max_length=100)
    recipient_phone: str = Field(min_length=10, max_length=20)
    message: str = Field(min_length=3, max_length=500)
    message_type: Optional[str] = "reminder"
    child_id: Optional[int] = None


class CommunicationResponse(BaseModel):
    id: int
    sender_id: int
    child_id: Optional[int] = None
    recipient_name: str
    recipient_phone: str
    message_type: str
    message: str
    channel: str
    status: str
    sent_at: datetime

    model_config = {"from_attributes": True}


# ==============================================================================
# QR TOKEN & RESOLVER SCHEMAS
# ==============================================================================

class QRPassResponse(BaseModel):
    qr_token: str
    expires_at: datetime
    child_id: int
    lookup_url: str


class QRPublicResolverResponse(BaseModel):
    valid: bool
    child_identifier: str
    age_months: int
    gender: str
    total_doses: int
    administered_doses: int
    verification_authority: str = "NavJyoti Health Record Platform"
    expires_at: datetime


# ==============================================================================
# AUTHORITY PORTAL & AUDIT TRAIL SCHEMAS
# ==============================================================================

class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    worker_name: Optional[str] = None
    worker_id_code: Optional[str] = None
    child_id: Optional[int] = None
    child_name: Optional[str] = None
    action_type: str
    record_type: str
    record_id: Optional[int] = None
    fields_changed: Optional[str] = None
    previous_values: Optional[str] = None
    new_values: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class SupervisorDashboardStats(BaseModel):
    jurisdiction: str
    total_workers: int
    total_children: int
    total_vaccinations: int
    completed_vaccinations: int
    pending_followups: int
    overdue_followups: int
    upcoming_appointments: int
    overdue_vaccinations: int
    recent_activity: List[AuditLogResponse]
    vaccination_trends: List[dict]
    followup_status_breakdown: dict


class SupervisorWorkerSummary(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    worker_id: Optional[str] = None
    village: Optional[str] = None
    jurisdiction: Optional[str] = None
    assigned_children_count: int
    vaccinations_recorded_count: int
    pending_followups_count: int
    last_activity: Optional[datetime] = None


class SupervisorWorkerDetail(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    worker_id: Optional[str] = None
    village: Optional[str] = None
    jurisdiction: Optional[str] = None
    assigned_children: List[dict]
    vaccination_activities: List[dict]
    follow_ups: List[dict]
    appointments: List[dict]
    recent_record_updates: List[AuditLogResponse]


class SupervisorChildOverview(BaseModel):
    id: int
    name: str
    date_of_birth: date
    age_display: str
    gender: Optional[str] = None
    village: Optional[str] = None
    assigned_worker_id: Optional[int] = None
    assigned_worker_name: Optional[str] = None
    vaccination_status: str
    completed_doses: int
    total_doses: int
    pending_followups_count: int
    migration_status: Optional[str] = None
    priority_level: Optional[str] = None


class SupervisorChildDetail(BaseModel):
    id: int
    name: str
    date_of_birth: date
    age_display: str
    gender: Optional[str] = None
    village: Optional[str] = None
    blood_group: Optional[str] = None
    birth_weight_kg: Optional[float] = None
    migration_status: Optional[str] = None
    priority_level: Optional[str] = None
    parent_name: Optional[str] = None
    assigned_worker_name: Optional[str] = None
    vaccinations: List[VaccinationResponse]
    follow_ups: List[FollowUpResponse]
    growth_records: List[GrowthResponse]
    appointments: List[AppointmentResponse]
    audit_trail: List[AuditLogResponse]


class SupervisorVaccinationMonitoring(BaseModel):
    total_scheduled: int
    completed: int
    pending: int
    overdue: int
    worker_breakdown: List[dict]
    timeline: List[dict]
    children_requiring_followup: List[dict]


class SupervisorFollowUpOverview(BaseModel):
    id: int
    child_id: int
    child_name: str
    village: Optional[str] = None
    assigned_worker_name: Optional[str] = None
    due_date: date
    reason: str
    status: str
    is_overdue: bool
    created_by_worker: Optional[str] = None


class SupervisorReportSummary(BaseModel):
    generated_at: datetime
    jurisdiction: str
    total_workers: int
    total_children: int
    total_vaccinations: int
    completed_vaccinations: int
    overdue_vaccinations: int
    pending_followups: int
    worker_performance: List[dict]
    trends: List[dict]


class SupervisorAlert(BaseModel):
    id: str
    alert_type: str
    severity: str
    title: str
    description: str
    child_id: Optional[int] = None
    worker_id: Optional[int] = None
    due_date: Optional[date] = None
    created_at: datetime


class SupervisorProfileResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    role: str
    jurisdiction: Optional[str] = None
    village: Optional[str] = None
    supervised_workers_count: int
    supervised_children_count: int
