from services.supabase_client import supabase

def seed_users():
    print("Connecting to Supabase to seed users...")
    
    # Check if admin already exists
    res = supabase.table("users").select("*").eq("email", "admin@college.edu").execute()
    if not res.data:
        print("Inserting admin@college.edu...")
        supabase.table("users").insert({
            "email": "admin@college.edu",
            "role": "admin",
            "college_name": "Hostel NIT"
        }).execute()
    else:
        print("admin@college.edu already exists.")

    # Check if guard already exists
    res = supabase.table("users").select("*").eq("email", "guard@college.edu").execute()
    if not res.data:
        print("Inserting guard@college.edu...")
        supabase.table("users").insert({
            "email": "guard@college.edu",
            "role": "guard",
            "college_name": "Hostel NIT"
        }).execute()
    else:
        print("guard@college.edu already exists.")
        
    print("Seeding complete! Current users:")
    all_users = supabase.table("users").select("*").execute()
    print(all_users.data)

if __name__ == "__main__":
    seed_users()
