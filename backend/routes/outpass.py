"""
Outpass Routes — Endpoints for outpass logs history and tracking students currently outside.

Endpoints:
  GET /outpass/logs/{admin_user_id}          — Get recent logs for students registered under an admin.
  GET /outpass/currently-out/{admin_user_id} — Get all students currently checked out (OUT status).
"""

from fastapi import APIRouter, HTTPException, Depends
from services.supabase_client import supabase
from routes.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/outpass", tags=["Outpass Tracking"])


@router.get("/logs/{admin_user_id}")
async def get_logs(admin_user_id: str, limit: int = 20, current_user: dict = Depends(get_current_user)):
    """
    Get recent outpass logs for students registered under a specific admin ID.
    Requires authentication.
    """
    try:
        logs = supabase.table("outpass_logs")\
            .select("*, students!inner(name, roll_number, room_number, user_id)")\
            .eq("students.user_id", admin_user_id)\
            .order("timestamp", desc=True)\
            .limit(limit)\
            .execute()
    except Exception as e:
        logger.error(f"Error fetching outpass logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch log history from database.")

    return {"logs": logs.data}


@router.get("/currently-out/{admin_user_id}")
async def currently_out(admin_user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get all students under this admin who are currently OUT of the hostel.
    
    Optimized:
      1. Fetch all student profiles registered under this admin.
      2. Fetch all outpass logs under this admin's students sorted by timestamp.
      3. Compute latest state in a single pass (O(N) execution time, 2 DB queries total).
      4. Avoids the N+1 query loop.
    """
    try:
        # 1. Fetch admin's student roster
        students_res = supabase.table("students")\
            .select("id, name, roll_number, room_number")\
            .eq("user_id", admin_user_id)\
            .execute()
    except Exception as e:
        logger.error(f"Error fetching student roster: {e}")
        raise HTTPException(status_code=500, detail="Failed to query student roster.")

    if not students_res.data:
        return {"count": 0, "students": []}

    students_map = {s["id"]: s for s in students_res.data}

    try:
        # 2. Query all logs under these students (ordered latest to oldest)
        logs_res = supabase.table("outpass_logs")\
            .select("student_id, action, timestamp, students!inner(user_id)")\
            .eq("students.user_id", admin_user_id)\
            .order("timestamp", desc=True)\
            .execute()
    except Exception as e:
        logger.error(f"Error querying outpass logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to query outpass logs.")

    # 3. Deduplicate to get only the latest status for each student
    latest_status = {}
    for log in logs_res.data:
        sid = log["student_id"]
        if sid not in latest_status:
            latest_status[sid] = {
                "action": log["action"],
                "timestamp": log["timestamp"]
            }

    # 4. Filter to find who is OUT
    outside_students = []
    for sid, status in latest_status.items():
        if status["action"] == "OUT" and sid in students_map:
            student = students_map[sid]
            student["out_since"] = status["timestamp"]
            outside_students.append(student)

    return {"count": len(outside_students), "students": outside_students}
