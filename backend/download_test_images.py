import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from services.supabase_client import supabase

def download_image(student, dest_folder):
    roll_number = student["roll_number"]
    photo_url = student["photo_url"]
    if not photo_url:
        return False
        
    filepath = os.path.join(dest_folder, f"{roll_number}.jpg")
    
    try:
        req = urllib.request.Request(
            photo_url, 
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
        return True
    except Exception as e:
        print(f"Failed to download {roll_number}: {e}")
        return False

def main():
    # Create "testing folder" in the root directory
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dest_folder = os.path.join(root_dir, "testing folder")
    os.makedirs(dest_folder, exist_ok=True)
    
    print("Fetching student profiles from Supabase...")
    
    students = []
    offset = 0
    limit = 500
    
    while True:
        res = supabase.table("students")\
            .select("roll_number, photo_url")\
            .like("roll_number", "NITW2026%")\
            .range(offset, offset + limit - 1)\
            .execute()
            
        if not res.data:
            break
            
        students.extend(res.data)
        
        if len(res.data) < limit:
            break
            
        offset += limit
        
    if not students:
        print("No students found.")
        return
        
    print(f"Found {len(students)} students. Downloading images to '{dest_folder}'...")
    
    success_count = 0
    # Safe to use ThreadPoolExecutor here because we are just downloading images (I/O bound), 
    # not doing any dlib/C++ operations that caused the segfault earlier.
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(download_image, s, dest_folder): s for s in students}
        for i, future in enumerate(as_completed(futures), 1):
            if future.result():
                success_count += 1
            if i % 50 == 0 or i == len(students):
                print(f"  Processed {i}/{len(students)} images...")
                
    print(f"\n✅ Done! Successfully downloaded {success_count} images.")
    print(f"📂 You can find them in: {dest_folder}")

if __name__ == "__main__":
    main()
