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
from services.college_cache import get_college_info
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


@router.get("/stats/{user_id}")
async def get_student_stats(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get aggregate statistics for the admin dashboard: total students and enrolled faces count.
    ponytail: CollegeCache eliminates 2 DB calls. Down from 5+ queries to 2.
    """
    try:
        # Get college user IDs (cached — 0ms warm)
        college_name, college_user_ids = get_college_info(supabase, user_id)
        if not college_name:
            raise HTTPException(status_code=404, detail="User not found.")
        
        if not college_user_ids:
            return {"total_students": 0, "enrolled_faces": 0}
        
        # Count total students (batched)
        total_students = 0
        all_student_ids = []
        batch_size = 50
        for i in range(0, len(college_user_ids), batch_size):
            chunk = college_user_ids[i:i + batch_size]
            res = supabase.table("students").select("id").in_("user_id", chunk).execute()
            if res.data:
                total_students += len(res.data)
                all_student_ids.extend([s["id"] for s in res.data])
        
        # Count enrolled faces (batched)
        enrolled_faces = 0
        for i in range(0, len(all_student_ids), batch_size):
            chunk = all_student_ids[i:i + batch_size]
            try:
                emb_res = supabase.table("face_embeddings").select("student_id").in_("student_id", chunk).execute()
                if emb_res.data:
                    enrolled_faces += len(emb_res.data)
            except Exception:
                pass
        
        return {"total_students": total_students, "enrolled_faces": enrolled_faces}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.get("/list/{user_id}")
async def list_students(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get all students registered under a specific admin ID.
    Includes face enrollment status by joining with face_embeddings table.
    Requires authentication.
    """
    result = supabase.table("students")\
        .select("*, face_embeddings(student_id)")\
        .eq("user_id", user_id)\
        .execute()
    
    # Transform: add 'is_enrolled' flag based on whether face_embeddings join returned data
    students = []
    for s in (result.data or []):
        embeddings = s.pop("face_embeddings", None)
        s["is_enrolled"] = bool(embeddings)
        students.append(s)
    
    return {"students": students}


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
