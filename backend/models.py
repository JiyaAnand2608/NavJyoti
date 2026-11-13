

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    ForeignKey,
    Boolean,
    CheckConstraint,
    Float
)

from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# ==========================
# USER MODEL
# ==========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "role IN ('parent', 'worker', 'supervisor')",
            name="valid_user_role"
        ),
    )

    children = relationship(
        "Child",
        back_populates="parent",
        foreign_keys="Child.parent_id"
    )

    assigned_children = relationship(
        "Child",
        back_populates="assigned_worker",
        foreign_keys="Child.assigned_worker_id"
    )


# ==========================
# CHILD MODEL
# ==========================

class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)

    parent_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    assigned_worker_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    parent = relationship(
        "User",
        back_populates="children",
        foreign_keys=[parent_id]
    )

    assigned_worker = relationship(
        "User",
        back_populates="assigned_children",
        foreign_keys=[assigned_worker_id]
    )

    vaccinations = relationship(
        "Vaccination",
        back_populates="child"
    )


# ==========================
# VACCINATION MODEL
# ==========================

class Vaccination(Base):
    __tablename__ = "vaccinations"

    id = Column(Integer, primary_key=True)

    child_id = Column(
        Integer,
        ForeignKey("children.id"),
        nullable=False
    )

    vaccine_name = Column(
        String(100),
        nullable=False
    )

    due_date = Column(
        Date,
        nullable=False
    )

    administered_date = Column(
        Date,
        nullable=True
    )

    completed = Column(
        Boolean,
        default=False,
        nullable=False
    )

    child = relationship(
        "Child",
        back_populates="vaccinations"
    )



class GrowthRecord(Base):
    __tablename__ = "growth_records"

    id = Column(Integer, primary_key=True)

    child_id = Column(
        Integer,
        ForeignKey("children.id"),
        nullable=False
    )

    recorded_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    measurement_date = Column(Date, nullable=False)

    weight_kg = Column(Float, nullable=False)

    height_cm = Column(Float, nullable=False)



class MilestoneRecord(Base):
    __tablename__ = "milestone_records"

    id = Column(Integer, primary_key=True)

    child_id = Column(
        Integer,
        ForeignKey("children.id"),
        nullable=False
    )

    recorded_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    observation_date = Column(Date, nullable=False)

    category = Column(String(50), nullable=False)

    description = Column(String(500), nullable=False)

    status = Column(String(30), nullable=False)



class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)

    child_id = Column(
        Integer,
        ForeignKey("children.id"),
        nullable=False
    )

    requested_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    appointment_date = Column(Date, nullable=False)

    reason = Column(String(300), nullable=False)

    status = Column(
        String(30),
        nullable=False,
        default="requested"
    )



class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True)

    child_id = Column(
        Integer,
        ForeignKey("children.id"),
        nullable=False
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    due_date = Column(Date, nullable=False)

    reason = Column(String(300), nullable=False)

    status = Column(
        String(30),
        nullable=False,
        default="pending"
    )
