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
    Get recent outpass logs for students in the same college as the caller.
    Requires authentication.
    """
    try:
        # Look up the caller's college
        caller = supabase.table("users").select("college_name").eq("id", admin_user_id).execute()
        if not caller.data:
            raise HTTPException(status_code=404, detail="User not found.")
        
        college_name = caller.data[0].get("college_name")
        
        # Get all users in this college
        college_users = supabase.table("users").select("id").eq("college_name", college_name).execute()
        college_user_ids = [u["id"] for u in college_users.data] if college_users.data else []
        
        if not college_user_ids:
            return {"logs": []}
            
        logs = supabase.table("outpass_logs")\
            .select("*, students!inner(name, roll_number, room_number, user_id, photo_url)")\
            .in_("students.user_id", college_user_ids)\
            .order("timestamp", desc=True)\
            .limit(limit)\
            .execute()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching outpass logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch log history from database.")

    return {"logs": logs.data}


@router.get("/currently-out/{admin_user_id}")
async def currently_out(admin_user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get all students in the same college who are currently OUT of the hostel.
    Requires authentication.
    """
    try:
        # 1. Look up the caller's college
        caller = supabase.table("users").select("college_name").eq("id", admin_user_id).execute()
        if not caller.data:
            raise HTTPException(status_code=404, detail="User not found.")
        
        college_name = caller.data[0].get("college_name")
        
        # Get all users in this college
        college_users = supabase.table("users").select("id").eq("college_name", college_name).execute()
        college_user_ids = [u["id"] for u in college_users.data] if college_users.data else []
        
        if not college_user_ids:
            return {"count": 0, "students": []}

        # 2. Fetch college's student roster
        students_res = supabase.table("students")\
            .select("id, name, roll_number, room_number, photo_url")\
            .in_("user_id", college_user_ids)\
            .execute()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student roster: {e}")
        raise HTTPException(status_code=500, detail="Failed to query student roster.")

    if not students_res.data:
        return {"count": 0, "students": []}

    students_map = {s["id"]: s for s in students_res.data}
    student_ids = list(students_map.keys())

    try:
        # 3. Query all logs under these students (ordered latest to oldest)
        logs_res = supabase.table("outpass_logs")\
            .select("student_id, action, timestamp")\
            .in_("student_id", student_ids)\
            .order("timestamp", desc=True)\
            .execute()
    except Exception as e:
        logger.error(f"Error querying outpass logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to query outpass logs.")

    # 4. Deduplicate to get only the latest status for each student
    latest_status = {}
    for log in logs_res.data:
        sid = log["student_id"]
        if sid not in latest_status:
            latest_status[sid] = {
                "action": log["action"],
                "timestamp": log["timestamp"]
            }

    # 5. Filter to find who is OUT
    outside_students = []
    for sid, status in latest_status.items():
        if status["action"] == "OUT" and sid in students_map:
            student = students_map[sid]
            student["out_since"] = status["timestamp"]
            outside_students.append(student)

    return {"count": len(outside_students), "students": outside_students}
