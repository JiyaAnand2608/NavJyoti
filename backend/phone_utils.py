import re
from typing import Optional


def normalize_indian_phone(raw_phone: str) -> str:
    """
    Validate and normalize Indian mobile numbers to canonical format '+91XXXXXXXXXX'.
    Accepts:
      - '9876543210'
      - '+91 98765 43210'
      - '+91-9876543210'
      - '09876543210'
      - '919876543210'
    Rejects:
      - Numbers not starting with 6, 7, 8, 9
      - Numbers with invalid digit counts
      - Letters or non-numeric characters (after cleaning punctuation)
    """
    if not raw_phone or not isinstance(raw_phone, str):
        raise ValueError("Mobile number is required.")

    # Remove all whitespace, hyphens, dots, parentheses
    cleaned = re.sub(r"[\s\-\.\(\)]+", "", raw_phone.strip())

    # Handle prefixes
    if cleaned.startswith("+91"):
        cleaned = cleaned[3:]
    elif cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]

    # Validate remaining 10 digits
    if not re.match(r"^[6-9]\d{9}$", cleaned):
        raise ValueError(
            "Invalid Indian mobile number. Must be a 10-digit number starting with 6, 7, 8, or 9."
        )

    return f"+91{cleaned}"


def is_valid_indian_phone(raw_phone: Optional[str]) -> bool:
    """Safe check for Indian phone number validity."""
    if not raw_phone:
        return False
    try:
        normalize_indian_phone(raw_phone)
        return True
    except ValueError:
        return False
