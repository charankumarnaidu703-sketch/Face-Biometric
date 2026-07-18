import os
import sys
import json
import random
import io
import urllib.request
import time
from PIL import Image
import numpy as np
import face_recognition

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.supabase_client import supabase

DEPARTMENTS = [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Electronics & Communication"
]

HOSTEL_BLOCKS = ["A", "B", "C", "D", "E"]

def download_url(url):
    """Download bytes from URL with user-agent headers"""
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read()
    except Exception as e:
        return None

def process_user(user, admin_id):
    """Downloads image and extracts the real face embedding"""
    name = f"{user['name']['first']} {user['name']['last']}"
    photo_url = user["picture"]["large"]
    
    img_bytes = download_url(photo_url)
    if not img_bytes:
        return None
        
    try:
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_array = np.array(img)
        
        # Extract face location and embedding
        face_locations = face_recognition.face_locations(img_array)
        if len(face_locations) != 1:
            return None  # Skip if there isn't exactly one face
            
        embeddings = face_recognition.face_encodings(img_array, face_locations)
        if not embeddings:
            return None
            
        embedding_vector = embeddings[0].tolist()
        
        # Clean phone number
        phone = user["phone"].replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
        if len(phone) > 15:
            phone = phone[:15]
            
        return {
            "name": name,
            "photo_url": photo_url,
            "phone": phone,
            "embedding": embedding_vector,
            "user_id": admin_id
        }
    except Exception as e:
        return None

def seed_real_faces():
    print("=== Supabase Real Face Seeding Utility ===")
    
    # 1. Fetch the user ID of admin@college.edu
    print("Fetching admin user profile...")
    admin_res = supabase.table("users").select("id").eq("email", "admin@college.edu").execute()
    if not admin_res.data:
        print("ERROR: Admin user 'admin@college.edu' not found in database. Run insert_seed_users.py first.")
        return
    admin_id = admin_res.data[0]["id"]
    print(f"Found Admin ID: {admin_id}")

    # 2. Cleanup existing demo data to avoid conflicts and allow idempotency
    print("Checking for existing demo students (NITW2026xxxx)...")
    existing_students = supabase.table("students").select("id").like("roll_number", "NITW2026%").execute()
    existing_ids = [s["id"] for s in existing_students.data] if existing_students.data else []
    
    if existing_ids:
        print(f"Found {len(existing_ids)} existing demo students. Deleting them and their logs/embeddings...")
        # Batch deletes in chunks of 50 to avoid Supabase URL length limits
        batch_size = 50
        for i in range(0, len(existing_ids), batch_size):
            chunk = existing_ids[i:i + batch_size]
            try:
                supabase.table("outpass_logs").delete().in_("student_id", chunk).execute()
            except Exception:
                pass  # OK if no matching logs exist
            try:
                supabase.table("face_embeddings").delete().in_("student_id", chunk).execute()
            except Exception:
                pass  # OK if no matching embeddings exist
            supabase.table("students").delete().in_("id", chunk).execute()
            print(f"  Deleted batch {i // batch_size + 1}/{(len(existing_ids) + batch_size - 1) // batch_size}")
        print("Cleanup complete.")

    # 3. Fetch random user profiles
    # We fetch 2,000 profiles to make sure we get 1,000 successful, unique face encodings
    target_count = 1000
    fetch_count = 2000
    print(f"Fetching {fetch_count} random user profiles from randomuser.me...")
    
    try:
        url = f"https://randomuser.me/api/?results={fetch_count}&nat=us,gb,in"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            users_list = data.get("results", [])
    except Exception as e:
        print(f"ERROR fetching from randomuser.me: {e}")
        return

    print(f"Successfully fetched {len(users_list)} profiles. Extracting face embeddings (sequential — dlib is not thread-safe)...")

    processed_profiles = []
    skipped = 0
    seen_photo_urls = set()
    
    # Process images ONE AT A TIME — dlib segfaults under threading on macOS
    for i, user in enumerate(users_list):
        if len(processed_profiles) >= target_count:
            break
            
        photo_url = user["picture"]["large"]
        if photo_url in seen_photo_urls:
            skipped += 1
            continue
            
        result = process_user(user, admin_id)
        if result:
            seen_photo_urls.add(photo_url)
            processed_profiles.append(result)
            count = len(processed_profiles)
            if count % 25 == 0 or count == target_count:
                print(f"  ✓ Valid faces: {count}/{target_count}  (processed {i + 1}/{len(users_list)}, skipped {skipped})")
        else:
            skipped += 1
            
        # Show progress every 100 images even if no valid face
        if (i + 1) % 100 == 0 and len(processed_profiles) % 25 != 0:
            print(f"  ... processed {i + 1}/{len(users_list)}, valid: {len(processed_profiles)}, skipped: {skipped}")

    if len(processed_profiles) < target_count:
        print(f"WARNING: Only obtained {len(processed_profiles)} valid face embeddings. Proceeding with those...")
        target_count = len(processed_profiles)

    # 4. Prepare student insert payloads
    print("\nPreparing student profile database payloads...")
    students_to_insert = []
    
    for idx, profile in enumerate(processed_profiles[:target_count], start=1):
        roll_number = f"NITW2026{idx:04d}"
        dept = random.choice(DEPARTMENTS)
        year = random.choice([1, 2, 3, 4])
        room = f"{random.choice(HOSTEL_BLOCKS)}-{random.randint(1, 3)}{random.randint(0, 1)}{random.randint(1, 9)}"
        
        students_to_insert.append({
            "user_id": admin_id,
            "name": profile["name"],
            "roll_number": roll_number,
            "department": dept,
            "year": year,
            "room_number": room,
            "phone": profile["phone"],
            "photo_url": profile["photo_url"],
            "is_enrolled": True,
            "temp_embedding": profile["embedding"]  # Temporarily store to match with student ID later
        })

    # 5. Insert students into Supabase in batches of 50
    print("Inserting student profiles...")
    inserted_students = []
    batch_size = 50
    
    for i in range(0, len(students_to_insert), batch_size):
        # Remove embedding field before inserting to student table
        batch = students_to_insert[i:i + batch_size]
        clean_batch = []
        for s in batch:
            copy = s.copy()
            del copy["temp_embedding"]
            clean_batch.append(copy)
            
        res = supabase.table("students").insert(clean_batch).execute()
        if res.data:
            inserted_students.extend(res.data)
        print(f"  Inserted profiles: {len(inserted_students)} / {target_count}")

    # Create mapping from roll number to student ID
    student_id_map = {s["roll_number"]: s["id"] for s in inserted_students}

    # 6. Prepare and insert face embeddings in batches of 50
    print("Inserting face embeddings...")
    embeddings_to_insert = []
    for s in students_to_insert:
        s_id = student_id_map.get(s["roll_number"])
        if s_id:
            embeddings_to_insert.append({
                "student_id": s_id,
                "embedding": s["temp_embedding"]
            })

    inserted_embeddings_count = 0
    for i in range(0, len(embeddings_to_insert), batch_size):
        batch = embeddings_to_insert[i:i + batch_size]
        res = supabase.table("face_embeddings").insert(batch).execute()
        if res.data:
            inserted_embeddings_count += len(res.data)
        print(f"  Inserted embeddings: {inserted_embeddings_count} / {target_count}")

    print("\n=== Real Face Seeding Completed Successfully! ===")
    print(f"Total Profiles Registered: {len(inserted_students)}")
    print(f"Total Actual Face Embeddings Created: {inserted_embeddings_count}")
    print("\n💡 Verification instructions:")
    print("1. Open any student profile photo url in your browser (e.g. from the Admin Roster).")
    print("2. Point the Guard Scan Camera at your computer screen showing that photo.")
    print("3. The scanner will identify the face and display the matched student details!")

if __name__ == "__main__":
    seed_real_faces()
