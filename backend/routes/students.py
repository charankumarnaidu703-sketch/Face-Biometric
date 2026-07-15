"""
Student Routes — Student registration, details retrieval, and status tracking.

Endpoints:
  POST /students/register        — Register a new student (admin-only).
  GET  /students/list/{user_id}  — List all students associated with an admin.
  GET  /students/{student_id}    — Retrieve details of a single student.
  GET  /students/{student_id}/status — Retrieve the current IN/OUT status of a student.
"""

from fastapi import APIRouter, HTTPException, Depends
from services.supabase_client import supabase
from routes.auth import get_current_user
from pydantic import BaseModel, Field
from typing import Optional, List

router = APIRouter(prefix="/students", tags=["Students"])


# --- Pydantic Models ---

class StudentRegisterRequest(BaseModel):
    user_id: str = Field(..., description="ID of the admin registering the student")
    name: str = Field(..., min_length=1, description="Student's full name")
    roll_number: str = Field(..., min_length=1, description="Unique registration/roll number")
    department: Optional[str] = None
    year: Optional[int | str] = None
    room_number: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None


# --- Routes ---

@router.post("/register")
async def register_student(payload: StudentRegisterRequest, current_user: dict = Depends(get_current_user)):
    """
    Register a new student profile in the system.
    Restricted to users with the 'admin' role.
    """
    # Authorization guard: Only admin can register students
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Only administrators can register students")

    # Clean and validate unique roll number
    clean_roll = payload.roll_number.strip().upper()
    existing = supabase.table("students").select("id").eq("roll_number", clean_roll).execute()
    if existing.data:
        raise HTTPException(
            status_code=400, 
            detail=f"Conflict: A student with roll number '{clean_roll}' is already registered."
        )

    # Parse year value to integer if sent as string (e.g. "3rd Year" -> 3)
    year_val = None
    if payload.year is not None:
        if isinstance(payload.year, int):
            year_val = payload.year
        else:
            digits = "".join(filter(str.isdigit, payload.year))
            if digits:
                year_val = int(digits)

    try:
        result = supabase.table("students").insert({
            "user_id": payload.user_id,
            "name": payload.name.strip(),
            "roll_number": clean_roll,
            "department": payload.department.strip() if payload.department else None,
            "year": year_val,
            "room_number": payload.room_number.strip() if payload.room_number else None,
            "phone": payload.phone.strip() if payload.phone else None,
            "photo_url": payload.photo_url
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {str(e)}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Database insertion returned empty result.")

    return {"success": True, "student": result.data[0]}


@router.get("/list/{user_id}")
async def list_students(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get all students registered under a specific admin ID.
    Requires authentication.
    """
    result = supabase.table("students").select("*").eq("user_id", user_id).execute()
    return {"students": result.data}


@router.get("/{student_id}")
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get details of a single student by their database ID.
    Requires authentication.
    """
    result = supabase.table("students").select("*").eq("id", student_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return result.data[0]


@router.get("/{student_id}/status")
async def get_student_status(student_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get the current status (IN or OUT) and the last activity timestamp of a student.
    Requires authentication.
    """
    # Fetch student to verify they exist first
    student = supabase.table("students").select("id").eq("id", student_id).execute()
    if not student.data:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    log = supabase.table("outpass_logs")\
        .select("action, timestamp")\
        .eq("student_id", student_id)\
        .order("timestamp", desc=True)\
        .limit(1)\
        .execute()

    if not log.data:
        # Default behavior: If no logs exist, the student is assumed to be inside (IN)
        return {"status": "IN", "last_seen": None}

    return {"status": log.data[0]["action"], "last_seen": log.data[0]["timestamp"]}
