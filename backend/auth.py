import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, status
from pwdlib import PasswordHash

load_dotenv()

password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    """Hash password using Argon2."""
    return password_hash.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against Argon2 hash."""
    return password_hash.verify(password, hashed)

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
DEFAULT_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def get_jwt_secret_key() -> str:
    """
    Retrieve JWT Secret Key from environment.
    Fails safely with RuntimeError if not configured.
    Never uses hardcoded or predictable default secrets.
    """
    secret = os.getenv("JWT_SECRET_KEY")
    if not secret or not secret.strip():
        raise RuntimeError(
            "JWT_SECRET_KEY is not configured in the environment. "
            "For production, generate a secure 32+ byte secret. "
            "For isolated tests, inject an explicit isolated test secret into the environment."
        )
    return secret.strip()


def create_access_token(
    user_id: int,
    role: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a timezone-aware JWT access token.
    """
    secret_key = get_jwt_secret_key()
    now_utc = datetime.now(timezone.utc)
    expiration = now_utc + (expires_delta or timedelta(minutes=DEFAULT_EXPIRE_MINUTES))

    payload = {
        "sub": str(user_id),
        "iat": now_utc,
        "exp": expiration,
        "type": "access",
    }
    if role:
        payload["role"] = role

    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int:
    """
    Decode and validate JWT access token.
    Returns user_id (int) or raises HTTP 401.
    """
    secret_key = get_jwt_secret_key()
    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub", "type"]}
        )

        if payload.get("type") != "access":
            raise jwt.InvalidTokenError("Token type is not access")

        return int(payload["sub"])

    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
