from datetime import date
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChildCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    date_of_birth: date



class ChildResponse(BaseModel):
    id: int
    name: str
    date_of_birth: date
    parent_id: int
    assigned_worker_id: int | None = None

    model_config = {"from_attributes": True}



class VaccinationResponse(BaseModel):
    id: int
    child_id: int
    vaccine_name: str
    due_date: date
    administered_date: date | None
    completed: bool

    model_config = {"from_attributes": True}



class VaccinationScheduleCreate(BaseModel):
    vaccine_name: str = Field(
        min_length=2, max_length=100
    )
    due_date: date



class VaccinationComplete(BaseModel):
    administered_date: date



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



from typing import Literal

class MilestoneCreate(BaseModel):
    observation_date: date
    category: Literal[
        "motor",
        "language",
        "social",
        "cognitive"
    ]
    description: str = Field(
        min_length=3,
        max_length=500
    )
    status: Literal[
        "observed",
        "not_yet_observed",
        "needs_follow_up"
    ]


class MilestoneResponse(BaseModel):
    id: int
    child_id: int
    recorded_by: int
    observation_date: date
    category: str
    description: str
    status: str

    model_config = {"from_attributes": True}


from typing import Literal

class AppointmentCreate(BaseModel):
    appointment_date: date
    reason: str = Field(min_length=3, max_length=300)


class AppointmentResponse(BaseModel):
    id: int
    child_id: int
    requested_by: int
    appointment_date: date
    reason: str
    status: str

    model_config = {"from_attributes": True}


class AppointmentUpdate(BaseModel):
    status: Literal[
        "approved",
        "rescheduled",
        "completed",
        "cancelled"
    ]
    appointment_date: date | None = None



class FollowUpCreate(BaseModel):
    due_date: date
    reason: str = Field(min_length=3, max_length=300)


class FollowUpResponse(BaseModel):
    id: int
    child_id: int
    created_by: int
    due_date: date
    reason: str
    status: str

    model_config = {"from_attributes": True}


class FollowUpUpdate(BaseModel):
    status: Literal["pending", "completed", "cancelled"]
