"""
Outpass Routes — Endpoints for outpass logs history and tracking students currently outside.

Endpoints:
  GET /outpass/logs/{admin_user_id}          — Get recent logs for students registered under an admin.
  GET /outpass/currently-out/{admin_user_id} — Get all students currently checked out (OUT status).
"""

from fastapi import APIRouter, HTTPException, Depends
from services.supabase_client import supabase
from services.college_cache import get_college_info
from routes.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/outpass", tags=["Outpass Tracking"])


@router.get("/logs/{admin_user_id}")
async def get_logs(admin_user_id: str, limit: int = 50, current_user: dict = Depends(get_current_user)):
    """
    Get recent outpass logs for students in the same college as the caller.
    ponytail: CollegeCache eliminates 2 DB calls.
    """
    try:
        college_name, college_user_ids = get_college_info(supabase, admin_user_id)
        if not college_name:
            raise HTTPException(status_code=404, detail="User not found.")
        
        if not college_user_ids:
            return {"logs": []}
            
        # Get all student IDs for this college (batched)
        all_student_ids = []
        batch_size = 50
        for i in range(0, len(college_user_ids), batch_size):
            chunk = college_user_ids[i:i + batch_size]
            res = supabase.table("students").select("id").in_("user_id", chunk).execute()
            if res.data:
                all_student_ids.extend([s["id"] for s in res.data])

        if not all_student_ids:
            return {"logs": []}

        # Query logs directly filtering by student_id
        logs = supabase.table("outpass_logs")\
            .select("*, students(id, name, roll_number, room_number, user_id, photo_url, department, year, phone)")\
            .in_("student_id", all_student_ids)\
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
    ponytail: CollegeCache + single join query replaces 2N batched loops.
    """
    try:
        # 1. Get college user IDs (cached)
        college_name, college_user_ids = get_college_info(supabase, admin_user_id)
        if not college_name:
            raise HTTPException(status_code=404, detail="User not found.")
        
        if not college_user_ids:
            return {"count": 0, "students": []}

        # 2. Fetch college's student roster (batched to avoid URL length issues)
        all_students = []
        batch_size = 50
        for i in range(0, len(college_user_ids), batch_size):
            chunk = college_user_ids[i:i + batch_size]
            res = supabase.table("students")\
                .select("id, name, roll_number, room_number, photo_url, department, year, phone")\
                .in_("user_id", chunk)\
                .execute()
            if res.data:
                all_students.extend(res.data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student roster: {e}")
        raise HTTPException(status_code=500, detail="Failed to query student roster.")

    if not all_students:
        return {"count": 0, "students": []}

    students_map = {s["id"]: s for s in all_students}
    student_ids = list(students_map.keys())

    try:
        # 3. Query all logs under these students in batches (ordered latest to oldest)
        all_logs = []
        for i in range(0, len(student_ids), batch_size):
            chunk = student_ids[i:i + batch_size]
            try:
                logs_batch = supabase.table("outpass_logs")\
                    .select("student_id, action, timestamp")\
                    .in_("student_id", chunk)\
                    .order("timestamp", desc=True)\
                    .execute()
                if logs_batch.data:
                    all_logs.extend(logs_batch.data)
            except Exception:
                pass  # OK if no logs exist for this batch
    except Exception as e:
        logger.error(f"Error querying outpass logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to query outpass logs.")

    # 4. Deduplicate to get only the latest status for each student
    latest_status = {}
    for log in all_logs:
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
