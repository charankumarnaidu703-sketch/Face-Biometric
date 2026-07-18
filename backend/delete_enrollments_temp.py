import sys
import os

from services.supabase_client import supabase

def delete_enrollment_records():
    print("Deleting all face enrollment records from database...")
    
    # 1. Delete all rows in face_embeddings table
    res1 = supabase.table("face_embeddings").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    deleted_embeddings_count = len(res1.data) if res1.data else 0
    print(f"Successfully deleted {deleted_embeddings_count} face embeddings.")

    # 2. Reset student flags: is_enrolled = False, photo_url = None
    res2 = supabase.table("students").update({
        "is_enrolled": False,
        "photo_url": None
    }).neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    reset_students_count = len(res2.data) if res2.data else 0
    print(f"Successfully reset {reset_students_count} student profiles.")

    # 3. Optional: Delete outpass logs so logs are also clean for testing
    res3 = supabase.table("outpass_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    deleted_logs_count = len(res3.data) if res3.data else 0
    print(f"Successfully deleted {deleted_logs_count} outpass activity logs.")

    print("\nCleanup complete! You can now register and enroll students fresh.")

if __name__ == "__main__":
    delete_enrollment_records()
