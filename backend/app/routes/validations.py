from datetime import datetime
import re
import validators

def validate_email(user_email):
    return True if validators.email(user_email) else False


def validate_phone(phone):
    if phone is None:
        return True
    return True if re.match(r"^03[0-9]{2}-[0-9]{7}$", phone) else False


def parse_dob(date_of_birth=None):
    if date_of_birth is None:
        return None
    try:
        return datetime.strptime(date_of_birth, "%Y-%m-%d").date()
    except ValueError:
        return False
    

def clean_str(value):
    """Convert empty strings to None before storing in DB."""
    if isinstance(value, str):
        stripped = value.strip()
        return stripped if stripped else None
    return value


def extract_sp_error(exception) -> str:
    """
    Pull the human-readable message out of a MySQL SIGNAL / SQLSTATE 45000
    exception string. Falls back to a generic message if parsing fails.
    """
    msg = str(exception)
    match = re.search(r'"(.+?)"', msg)
    return match.group(1) if match else None