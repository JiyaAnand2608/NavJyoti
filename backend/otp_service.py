import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models import OTPRecord, User
from email_service import EmailProvider, get_email_provider
from auth import get_jwt_secret_key

OTP_EXPIRE_MINUTES = int(os.getenv("OTP_EXPIRE_MINUTES", "5"))
OTP_COOLDOWN_SECONDS = int(os.getenv("OTP_COOLDOWN_SECONDS", "60"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))


def _hash_otp(otp_code: str, email: str) -> str:
    """
    Generate HMAC-SHA256 keyed digest for secure OTP verification.
    Uses the application secret key to prevent offline dictionary attacks.
    """
    key = get_jwt_secret_key().encode("utf-8")
    msg = f"{email.lower().strip()}:{otp_code.strip()}".encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000:06d}"


def request_otp(
    db: Session,
    email: str,
    role: str,
    provider: Optional[EmailProvider] = None
) -> Tuple[bool, str, int]:
    """
    Handle OTP generation, rate limiting, and dispatch.
    Returns (success, message, cooldown_seconds).
    Prevents account enumeration with generic messaging.
    """
    clean_email = email.lower().strip()
    now_utc = datetime.now(timezone.utc)

    # 1. Verify that user exists with the requested authorized role
    user = db.query(User).filter(
        User.email == clean_email,
        User.role == role
    ).first()

    # Generic response message to prevent account enumeration
    generic_msg = (
        f"If {clean_email} is registered as an authorized {role}, "
        "a 6-digit verification code has been dispatched."
    )

    if not user:
        return True, generic_msg, OTP_COOLDOWN_SECONDS

    # 2. Check for recent active OTP within cooldown (locking record where possible)
    latest_otp = (
        db.query(OTPRecord)
        .filter(
            OTPRecord.email == clean_email,
            OTPRecord.role == role,
            OTPRecord.is_used.is_(False)
        )
        .order_by(OTPRecord.created_at.desc())
        .first()
    )

    if latest_otp:
        last_sent = latest_otp.last_sent_at
        if last_sent.tzinfo is None:
            last_sent = last_sent.replace(tzinfo=timezone.utc)
        elapsed = (now_utc - last_sent).total_seconds()
        if elapsed < OTP_COOLDOWN_SECONDS:
            remaining = int(OTP_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting another code."
            )

        # Invalidate previous unused codes
        latest_otp.is_used = True

    # 3. Generate new OTP and store keyed HMAC hash
    raw_otp = generate_otp()
    otp_hash = _hash_otp(raw_otp, clean_email)
    expires_at = now_utc + timedelta(minutes=OTP_EXPIRE_MINUTES)

    new_otp_record = OTPRecord(
        email=clean_email,
        role=role,
        otp_hash=otp_hash,
        created_at=now_utc,
        expires_at=expires_at,
        last_sent_at=now_utc,
        attempts=0,
        is_used=False
    )
    db.add(new_otp_record)
    db.commit()

    # 4. Dispatch OTP via Email Provider
    email_prov = provider or get_email_provider()
    subject = "Your NavJyoti Verification Code"
    text_content = (
        f"Hello,\n\n"
        f"Your verification code for the NavJyoti {role.capitalize()} Portal is: {raw_otp}\n\n"
        f"This code will expire in {OTP_EXPIRE_MINUTES} minutes.\n"
        "If you did not request this code, please ignore this email or contact support.\n\n"
        "NavJyoti Healthcare Support Platform"
    )
    email_prov.send_email(clean_email, subject, text_content)

    return True, generic_msg, OTP_COOLDOWN_SECONDS


def verify_otp(
    db: Session,
    email: str,
    role: str,
    submitted_otp: str
) -> User:
    """
    Verify submitted OTP code against stored keyed HMAC hash.
    Enforces expiration, attempt limits, and atomic single-use invalidation.
    Returns authorized User on success.
    """
    clean_email = email.lower().strip()
    now_utc = datetime.now(timezone.utc)

    # 1. Retrieve the latest active OTP record
    record = (
        db.query(OTPRecord)
        .filter(
            OTPRecord.email == clean_email,
            OTPRecord.role == role,
            OTPRecord.is_used.is_(False)
        )
        .order_by(OTPRecord.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )

    # 2. Check expiration
    record_expires = record.expires_at
    if record_expires.tzinfo is None:
        record_expires = record_expires.replace(tzinfo=timezone.utc)

    if now_utc > record_expires:
        record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    # 3. Check attempt limit
    if record.attempts >= OTP_MAX_ATTEMPTS:
        record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. Please request a new code."
        )

    # 4. Compare keyed HMAC using constant-time comparison
    submitted_hash = _hash_otp(submitted_otp, clean_email)
    if not secrets.compare_digest(submitted_hash, record.otp_hash):
        record.attempts += 1
        db.commit()
        remaining_attempts = max(0, OTP_MAX_ATTEMPTS - record.attempts)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining_attempts} attempts remaining."
        )

    # 5. ATOMIC SINGLE-USE CONSUMPTION
    # Update is_used = True ONLY IF is_used is still False and attempts < MAX
    affected = db.query(OTPRecord).filter(
        OTPRecord.id == record.id,
        OTPRecord.is_used.is_(False),
        OTPRecord.attempts < OTP_MAX_ATTEMPTS
    ).update({"is_used": True}, synchronize_session="fetch")
    db.commit()

    if affected == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has already been consumed or invalidated."
        )

    # 6. Retrieve verified user
    user = db.query(User).filter(
        User.email == clean_email,
        User.role == role
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authorized account not found."
        )

    return user
