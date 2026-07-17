"""
Face Routes — API endpoints for enrolling faces, identifying students from live frames, and logging IN/OUT actions.

Endpoints:
  POST /face/enroll     — Extract and store face embedding for a student (admin-only).
  POST /face/identify   — Run 1:N face identification against enrolled students (guard/admin).
  POST /face/log-action — Write check-in/check-out outpass logs to the database (guard/admin).
"""

from fastapi import APIRouter, HTTPException, Depends
from services.face_engine import extract_embedding, identify_student
from services.supabase_client import supabase
from routes.auth import get_current_user
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/face", tags=["Face Operations"])


# --- Pydantic Models ---

class EnrollRequest(BaseModel):
    student_id: str = Field(..., description="UUID of the student")
    base64_image: str = Field(..., description="Base64-encoded facial portrait photo")


class IdentifyRequest(BaseModel):
    base64_image: str = Field(..., description="Base64-encoded frame from live camera")
    admin_user_id: str = Field(..., description="User ID of the admin who enrolled the students to match against")


class LogActionRequest(BaseModel):
    student_id: str = Field(..., description="UUID of the student")
    action: str = Field(..., pattern="^(IN|OUT|in|out)$", description="Activity type: must be 'IN' or 'OUT'")
    confidence: float = Field(..., description="Confidence percentage of the match (0.0 to 100.0)")
    logged_by: Optional[str] = Field(None, description="UUID of the guard/admin logging the action")
    gate: Optional[str] = Field("MAIN_GATE", description="Name of the campus gate where transaction occurred")


# --- Routes ---

@router.post("/enroll")
async def enroll_face(payload: EnrollRequest, current_user: dict = Depends(get_current_user)):
    """
    Extract a 128-dimensional embedding from a student selfie and register it in the database.
    Updates the student's enrollment flag. Restricted to admins.
    """
    # Guard: Only admin can enroll faces
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Only administrators can enroll student faces")

    # Verify student profile exists
    student_check = supabase.table("students").select("id").eq("id", payload.student_id).execute()
    if not student_check.data:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    # Extract 128-D vector
    result = extract_embedding(payload.base64_image)
    if not result["success"]:
        # result["error"] holds machine-readable code like "NO_FACE_DETECTED" or "MULTIPLE_FACES_DETECTED"
        raise HTTPException(status_code=400, detail=result["error"])

    try:
        # Save face embedding vector
        supabase.table("face_embeddings").insert({
            "student_id": payload.student_id,
            "embedding": result["embedding"]
        }).execute()

        # Update enrollment flag on student profile
        supabase.table("students").update({"is_enrolled": True}).eq("id", payload.student_id).execute()
    except Exception as e:
        logger.error(f"Failed to save face enrollment: {e}")
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {str(e)}")

    logger.info(f"Student face enrolled: {payload.student_id}")
    return {"success": True, "message": "Face enrolled successfully"}


@router.post("/identify")
async def identify_face(payload: IdentifyRequest, current_user: dict = Depends(get_current_user)):
    """
    Match a live camera feed frame (base64) against all students enrolled in the same college.
    Both admins and guards from the same college can identify the same set of students.
    Returns details of the student and predicts the next action (IN -> OUT, OUT -> IN).
    """
    # Step 1: Look up the calling user's college to find ALL users in the same institution
    try:
        caller = supabase.table("users").select("college_name").eq("id", payload.admin_user_id).execute()
        if not caller.data:
            raise HTTPException(status_code=404, detail="Calling user not found in database.")
        
        college_name = caller.data[0].get("college_name")
        
        # Find all user_ids (admin + guard) belonging to this college
        college_users = supabase.table("users").select("id").eq("college_name", college_name).execute()
        college_user_ids = [u["id"] for u in college_users.data] if college_users.data else []
        
        if not college_user_ids:
            return {"matched": False, "reason": "NO_STUDENTS_ENROLLED"}
        
        logger.info(f"Identify request from user in college '{college_name}', searching across {len(college_user_ids)} college users")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error looking up college users: {e}")
        raise HTTPException(status_code=500, detail="Failed to look up college information.")

    # Step 2: Get all student IDs registered by any user in this college
    try:
        students_data = supabase.table("students")\
            .select("id")\
            .in_("user_id", college_user_ids)\
            .eq("is_enrolled", True)\
            .execute()
        
        student_ids = [s["id"] for s in students_data.data] if students_data.data else []
        
        if not student_ids:
            return {"matched": False, "reason": "NO_STUDENTS_ENROLLED"}
        
        logger.info(f"Found {len(student_ids)} enrolled students in college '{college_name}'")
    except Exception as e:
        logger.error(f"Error fetching students: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student list from database.")

    # Step 3: Query face embeddings for those students
    try:
        embeddings_data = supabase.table("face_embeddings")\
            .select("student_id, embedding")\
            .in_("student_id", student_ids)\
            .execute()
    except Exception as e:
        logger.error(f"Error fetching face database: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student embeddings from database.")

    if not embeddings_data.data:
        return {"matched": False, "reason": "NO_STUDENTS_ENROLLED"}

    all_embeddings = [
        {"student_id": e["student_id"], "embedding": e["embedding"]}
        for e in embeddings_data.data
    ]

    # Perform facial recognition comparison
    result = identify_student(payload.base64_image, all_embeddings)

    if not result["matched"]:
        return {"matched": False, "reason": result["reason"]}

    # Match found: Retrieve full student profile details
    student_result = supabase.table("students").select("*").eq("id", result["student_id"]).execute()
    if not student_result.data:
        raise HTTPException(status_code=404, detail="Student matched by face but profile missing in database.")
    
    student = student_result.data[0]

    # Predict Next Action: Retrieve last outpass activity log to flip state
    last_log = supabase.table("outpass_logs")\
        .select("action")\
        .eq("student_id", result["student_id"])\
        .order("timestamp", desc=True)\
        .limit(1)\
        .execute()

    last_action = last_log.data[0]["action"] if last_log.data else "IN"
    next_action = "OUT" if last_action == "IN" else "IN"

    return {
        "matched": True,
        "student": student,
        "confidence": result["confidence"],
        "next_action": next_action
    }


@router.post("/log-action")
async def log_action(payload: LogActionRequest, current_user: dict = Depends(get_current_user)):
    """
    Create a check-in/check-out log entry. Called when the guard confirms a facial match.
    """
    # Enforce action text format to uppercase
    action_type = payload.action.upper()

    try:
        result = supabase.table("outpass_logs").insert({
            "student_id": payload.student_id,
            "action": action_type,
            "confidence": payload.confidence,
            "logged_by": payload.logged_by if payload.logged_by else current_user.get("sub"),
            "gate": payload.gate
        }).execute()
    except Exception as e:
        logger.error(f"Failed to write outpass activity: {e}")
        raise HTTPException(status_code=500, detail=f"Database logging failed: {str(e)}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Database insertion returned empty result.")

    logger.info(f"Student outpass log registered: Student {payload.student_id} marked {action_type}")
    return {"success": True, "log": result.data[0]}
