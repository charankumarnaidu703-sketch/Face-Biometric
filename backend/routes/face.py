"""
Face Routes — API endpoints for enrolling faces, identifying students from live frames, and logging IN/OUT actions.

Endpoints:
  POST /face/enroll     — Extract and store face embedding for a student (admin-only).
  POST /face/identify   — Run 1:N face identification against enrolled students (guard/admin).
  POST /face/log-action — Write check-in/check-out outpass logs to the database (guard/admin).
"""

from fastapi import APIRouter, HTTPException, Depends
from services.face_engine import extract_embedding, identify_student_fast, get_cache
from services.supabase_client import supabase
from services.college_cache import get_college_info
from routes.auth import get_current_user
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
import time

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/face", tags=["Face Operations"])


# --- Pydantic Models ---

class EnrollRequest(BaseModel):
    student_id: str = Field(..., description="UUID of the student")
    base64_image: str = Field(..., description="Base64-encoded facial portrait photo")


class IdentifyRequest(BaseModel):
    base64_image: str = Field(..., description="Base64-encoded frame from live camera")
    admin_user_id: str = Field(..., description="User ID of the admin who enrolled the students to match against")
    is_front_camera: bool = Field(False, description="True if captured from front camera (image will be mirrored)")


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

    # Verify student profile exists — only fetch lightweight columns (NOT the large photo_url blob)
    student_check = supabase.table("students").select("id, is_enrolled").eq("id", payload.student_id).execute()
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
        update_data = {"is_enrolled": True}

        # Only store the photo on the FIRST enrollment call.
        # We use the already-fetched is_enrolled flag: if it's False/None,
        # this is the first call so we save the photo. On subsequent calls
        # (is_enrolled==True), the photo is already stored so we skip it.
        # This avoids fetching the massive base64 photo_url column from the DB.
        is_already_enrolled = student_check.data[0].get("is_enrolled", False)
        if not is_already_enrolled:
            update_data["photo_url"] = f"data:image/jpeg;base64,{payload.base64_image}"

        supabase.table("students").update(update_data).eq("id", payload.student_id).execute()
    except Exception as e:
        logger.error(f"Failed to save face enrollment: {e}")
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {str(e)}")

    logger.info(f"Student face enrolled: {payload.student_id}")
    return {"success": True, "message": "Face enrolled successfully"}


@router.post("/identify")
async def identify_face(payload: IdentifyRequest, current_user: dict = Depends(get_current_user)):
    """
    Match a live camera feed frame against all enrolled students in the same college.
    
    ponytail: CollegeCache eliminates 2 DB calls (~200-400ms) on every scan.
    EmbeddingCache eliminates embedding re-fetch. Net: 2-3x faster.
    """
    t0 = time.time()
    
    # Step 1: Get college user IDs (cached — 0ms warm, ~200ms cold)
    college_name, college_user_ids = get_college_info(supabase, payload.admin_user_id)
    if not college_name:
        raise HTTPException(status_code=404, detail="Calling user not found in database.")
    if not college_user_ids:
        return {"matched": False, "reason": "NO_STUDENTS_ENROLLED"}

    # Step 2: Refresh the embedding cache if stale (auto-refreshes every 60s)
    cache = get_cache()
    if cache.is_stale():
        logger.info("Embedding cache is stale, refreshing from database...")
        count = cache.refresh(supabase, college_user_ids)
        logger.info(f"Cache refreshed with {count} face embeddings")
    
    t1 = time.time()

    # Step 3: Run vectorized face identification (the fast path)
    result = identify_student_fast(payload.base64_image, cache, is_front_camera=payload.is_front_camera)
    
    t2 = time.time()
    logger.info(f"Identify pipeline: setup={int((t1-t0)*1000)}ms, identify={int((t2-t1)*1000)}ms, total={int((t2-t0)*1000)}ms")

    if not result["matched"]:
        return {"matched": False, "reason": result["reason"]}

    # Match found: Retrieve student profile + last log in parallel-ish (2 queries, but lean)
    student_id = result["student_id"]
    
    # ponytail: fetch only the columns the mobile app actually uses (skip photo_url blob if heavy)
    student_result = supabase.table("students")\
        .select("id, name, roll_number, room_number, department, year, photo_url, phone")\
        .eq("id", student_id).execute()
    if not student_result.data:
        raise HTTPException(status_code=404, detail="Student matched by face but profile missing in database.")
    
    student = student_result.data[0]

    # Predict Next Action
    last_log = supabase.table("outpass_logs")\
        .select("action")\
        .eq("student_id", student_id)\
        .order("timestamp", desc=True)\
        .limit(1)\
        .execute()

    last_action = last_log.data[0]["action"] if last_log.data else "IN"
    next_action = "OUT" if last_action == "IN" else "IN"

    t3 = time.time()
    logger.info(f"Identify total with DB fetch: {int((t3-t0)*1000)}ms")

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
    ponytail: removed the 24h auto-cleanup from the hot path — logs are cheap, latency is not.
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
