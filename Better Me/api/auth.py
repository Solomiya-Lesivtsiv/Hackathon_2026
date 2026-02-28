"""
Authentication utilities: JWT tokens + password hashing.
"""
import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, Request

# Secret key — in production use env var
SECRET_KEY = os.environ.get("JWT_SECRET", "betterme-hackathon-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${hashed}"


def verify_password(plain: str, stored: str) -> bool:
    if "$" not in stored:
        return False
    salt, hashed = stored.split("$", 1)
    return hashlib.sha256((salt + plain).encode()).hexdigest() == hashed


def create_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")


def get_current_user_id(request: Request) -> str:
    """Extract user ID from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = auth[7:]
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(401, "Invalid token")
    return user_id


def get_optional_user_id(request: Request) -> Optional[str]:
    """Extract user ID if present, otherwise None."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    try:
        token = auth[7:]
        payload = decode_token(token)
        return payload.get("sub")
    except:
        return None


def require_admin(request: Request) -> str:
    """Require admin role. Returns user_id."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = auth[7:]
    payload = decode_token(token)
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return payload["sub"]
