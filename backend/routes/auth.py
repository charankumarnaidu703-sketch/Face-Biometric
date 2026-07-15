"""
Auth Routes — JWT-based authentication for Admin and Guard users.

Endpoints:
  POST /auth/login   — Authenticate by email, receive a JWT token.

The login flow:
  1. Client sends {"email": "admin@college.edu"} to /auth/login.
  2. Server looks up the email in the `users` table.
  3. If found, signs a JWT containing user_id and role (admin/guard).
  4. Client stores this token and sends it as `Authorization: Bearer <token>`
     on all subsequent requests.
"""

from fastapi import APIRouter, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from services.supabase_client import supabase
from jose import jwt, JWTError
import os
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
TOKEN_EXPIRY_DAYS = 7

# --- Security scheme for protected routes ---
security = HTTPBearer()


# --- Pydantic Request/Response Models ---

class LoginRequest(BaseModel):
    """Request body for the login endpoint."""
    email: str  # Using str instead of EmailStr to avoid extra dependency


class LoginResponse(BaseModel):
    """Response body returned after successful login."""
    token: str
    user_id: str
    role: str
    college_name: str | None = None


class TokenPayload(BaseModel):
    """Decoded JWT token payload."""
    sub: str       # user_id
    role: str      # "admin" or "guard"
    exp: datetime  # expiration timestamp


# --- Helper Functions ---

def create_token(user_id: str, role: str) -> str:
    """
    Create a signed JWT token with user_id and role.

    The token expires after TOKEN_EXPIRY_DAYS (default: 7 days).
    Uses timezone-aware UTC datetime to avoid deprecation warnings.
    """
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    """
    Decode and validate a JWT token.

    Returns the decoded payload dict on success.
    Raises HTTPException 401 on invalid/expired tokens.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    FastAPI dependency that extracts and validates the JWT from the
    Authorization header. Use this in any route that requires authentication:

        @router.get("/protected")
        async def my_route(user=Depends(get_current_user)):
            print(user["sub"], user["role"])
    """
    return verify_token(credentials.credentials)


# --- Routes ---

@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    """
    Authenticate a user by email and return a JWT token.

    The user must already exist in the `users` table (pre-registered by setup).
    """
    result = supabase.table("users").select("*").eq("email", payload.email).execute()

    if not result.data:
        logger.warning(f"Login attempt for unknown email: {payload.email}")
        raise HTTPException(status_code=404, detail="User not found. Contact your admin.")

    user = result.data[0]
    token = create_token(user["id"], user["role"])

    logger.info(f"User logged in: {user['email']} (role: {user['role']})")
    return LoginResponse(
        token=token,
        user_id=user["id"],
        role=user["role"],
        college_name=user.get("college_name")
    )
