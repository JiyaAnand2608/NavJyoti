from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    Boolean,
    CheckConstraint,
    Float,
    Index,
    Text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# ==========================
# USER MODEL
# ==========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)

    # Phone number identification for Parents (unique across parents)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    village = Column(String(100), nullable=True)
    preferred_language = Column(String(10), default="hi", nullable=True)
    worker_id = Column(String(50), nullable=True)
    consent = Column(Boolean, default=True, nullable=False)
    jurisdiction = Column(String(100), nullable=True, index=True)

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

    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# ==========================
# CHILD MODEL
# ==========================

class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)

    parent_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    assigned_worker_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    # Optional clinical & demographic tracking for parity with frontend
    gender = Column(String(20), default="Male", nullable=True)
    village = Column(String(100), nullable=True)
    blood_group = Column(String(10), nullable=True)
    birth_weight_kg = Column(Float, nullable=True)
    migration_status = Column(String(30), default="resident", nullable=True)
    priority_level = Column(String(20), default="green", nullable=True)

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
        back_populates="child",
        cascade="all, delete-orphan"
    )

    growth_records = relationship(
        "GrowthRecord",
        back_populates="child",
        cascade="all, delete-orphan"
    )

    milestones = relationship(
        "MilestoneRecord",
        back_populates="child",
        cascade="all, delete-orphan"
    )

    appointments = relationship(
        "Appointment",
        back_populates="child",
        cascade="all, delete-orphan"
    )

    follow_ups = relationship(
        "FollowUp",
        back_populates="child",
        cascade="all, delete-orphan"
    )

    qr_tokens = relationship(
        "QRTokenRecord",
        back_populates="child",
        cascade="all, delete-orphan"
    )

    audit_logs = relationship(
        "AuditLog",
        back_populates="child",
        cascade="all, delete-orphan"
    )


# ==========================
# VACCINATION MODEL
# ==========================

class Vaccination(Base):
    __tablename__ = "vaccinations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False, index=True)
    vaccine_name = Column(String(100), nullable=False)
    due_date = Column(Date, nullable=False)
    administered_date = Column(Date, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)

    # Administration details
    batch_number = Column(String(50), nullable=True)
    facility = Column(String(150), nullable=True)
    worker_name = Column(String(100), nullable=True)
    site = Column(String(50), nullable=True)
    notes = Column(String(300), nullable=True)

    child = relationship("Child", back_populates="vaccinations")


# ==========================
# GROWTH RECORD MODEL
# ==========================

class GrowthRecord(Base):
    __tablename__ = "growth_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False, index=True)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    measurement_date = Column(Date, nullable=False)
    weight_kg = Column(Float, nullable=False)
    height_cm = Column(Float, nullable=False)

    child = relationship("Child", back_populates="growth_records")


# ==========================
# MILESTONE RECORD MODEL
# ==========================

class MilestoneRecord(Base):
    __tablename__ = "milestone_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False, index=True)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    observation_date = Column(Date, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(String(500), nullable=False)
    status = Column(String(30), nullable=False)

    child = relationship("Child", back_populates="milestones")


# ==========================
# APPOINTMENT MODEL
# ==========================

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False, index=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_date = Column(Date, nullable=False)
    reason = Column(String(300), nullable=False)
    status = Column(String(30), nullable=False, default="requested")

    child = relationship("Child", back_populates="appointments")


# ==========================
# FOLLOW-UP MODEL
# ==========================

class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    due_date = Column(Date, nullable=False)
    reason = Column(String(300), nullable=False)
    status = Column(String(30), nullable=False, default="pending")

    child = relationship("Child", back_populates="follow_ups")


# ==========================
# OTP RECORD MODEL (WORKER & SUPERVISOR LOGIN)
# ==========================

class OTPRecord(Base):
    __tablename__ = "otp_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(150), nullable=False, index=True)
    role = Column(String(30), nullable=False)
    otp_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_sent_at = Column(DateTime(timezone=True), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("idx_otp_email_role", "email", "role"),
    )


# ==========================
# NOTIFICATION MODEL (IN-APP ALERTS)
# ==========================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)
    type = Column(String(50), default="info", nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", back_populates="notifications")


# ==========================
# COMMUNICATION MODEL (OUTREACH & REMINDERS)
# ==========================

class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=True)
    recipient_name = Column(String(100), nullable=False)
    recipient_phone = Column(String(20), nullable=False)
    message_type = Column(String(50), default="reminder", nullable=False)
    message = Column(String(500), nullable=False)
    channel = Column(String(50), default="Simulated SMS", nullable=False)
    status = Column(String(50), default="Queued", nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=False)


# ==========================
# SECURE QR TOKEN RECORD (HANDOFF RESOLVER)
# ==========================

class QRTokenRecord(Base):
    __tablename__ = "qr_token_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)

    child = relationship("Child", back_populates="qr_tokens")


# ==========================
# AUDIT LOG MODEL (PATIENT RECORD AUDIT TRAIL)
# ==========================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(Integer, ForeignKey("children.id", ondelete="SET NULL"), nullable=True, index=True)
    action_type = Column(String(50), nullable=False, index=True)
    record_type = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=True)
    fields_changed = Column(String(500), nullable=True)
    previous_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")
    child = relationship("Child", back_populates="audit_logs")

