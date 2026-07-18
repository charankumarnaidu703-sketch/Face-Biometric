"""
College Cache — In-memory cache for college user lookups.

Eliminates the "College Lookup Tax": every endpoint was making 2 DB calls
(user→college_name, users→college_user_ids) on every single request.
This cache reduces that to 0 DB calls for warm hits (TTL: 120s).

ponytail: minimum that works — dict + timestamp, no framework needed.
"""

import time
import logging
import threading

logger = logging.getLogger(__name__)

CACHE_TTL = 120  # seconds

# ponytail: single dict, single lock, no class needed
_lock = threading.Lock()
_cache = {}  # user_id -> {"college_name": str, "user_ids": [str], "ts": float}


def get_college_info(supabase_client, user_id: str) -> tuple:
    """
    Returns (college_name, college_user_ids) for the given user.
    Uses cache if fresh (< 120s old). Otherwise hits DB and caches result.
    """
    now = time.time()

    with _lock:
        entry = _cache.get(user_id)
        if entry and (now - entry["ts"]) < CACHE_TTL:
            return entry["college_name"], entry["user_ids"]

    # Cache miss or stale — hit DB (outside lock to avoid blocking)
    caller = supabase_client.table("users").select("college_name").eq("id", user_id).execute()
    if not caller.data:
        return None, []

    college_name = caller.data[0].get("college_name")

    college_users = supabase_client.table("users").select("id").eq("college_name", college_name).execute()
    user_ids = [u["id"] for u in college_users.data] if college_users.data else []

    # Store result for ALL user_ids in this college (they share the same answer)
    with _lock:
        result = {"college_name": college_name, "user_ids": user_ids, "ts": time.time()}
        for uid in user_ids:
            _cache[uid] = result
        # Also cache for the original requester in case they're not in the list
        _cache[user_id] = result

    logger.info(f"CollegeCache refreshed for '{college_name}': {len(user_ids)} users cached")
    return college_name, user_ids
