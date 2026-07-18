import sys
import os

from services.supabase_client import supabase

def reset_database():
    print("WARNING: This will delete ALL student profiles, face embeddings, and outpass activity logs.")
    print("Seeded administrative and guard user accounts will NOT be deleted.")
    
    confirm = input("Are you sure you want to proceed? (yes/no): ").strip().lower()
    if confirm != "yes":
        print("Database reset cancelled.")
        return

    try:
        # 1. Delete all outpass logs
        logs_res = supabase.table("outpass_logs").select("id").execute()
        logs_data = logs_res.data or []
        logs_deleted = 0
        for log in logs_data:
            supabase.table("outpass_logs").delete().eq("id", log["id"]).execute()
            logs_deleted += 1
        print(f"Deleted {logs_deleted} outpass logs.")

        # 2. Delete all face embeddings
        emb_res = supabase.table("face_embeddings").select("id").execute()
        emb_data = emb_res.data or []
        emb_deleted = 0
        for emb in emb_data:
            supabase.table("face_embeddings").delete().eq("id", emb["id"]).execute()
            emb_deleted += 1
        print(f"Deleted {emb_deleted} face embeddings.")

        # 3. Delete all students
        std_res = supabase.table("students").select("id").execute()
        std_data = std_res.data or []
        std_deleted = 0
        for std in std_data:
            supabase.table("students").delete().eq("id", std["id"]).execute()
            std_deleted += 1
        print(f"Deleted {std_deleted} student profiles.")

        print("\nDatabase reset complete! Your hostel biometric roster is now fresh and empty.")
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_database()
