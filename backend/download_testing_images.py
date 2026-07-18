import os
import sys
import urllib.request
import urllib.error

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.supabase_client import supabase

def main():
    print("Fetching enrolled students from database...")
    # Fetch all students with a roll_number starting with NITW2026
    # and limit to 1000 to get all of them
    response = supabase.table("students").select("roll_number, photo_url").like("roll_number", "NITW2026%").limit(1000).execute()
    
    students = response.data
    
    if not students:
        print("No students found.")
        return
        
    print(f"Found {len(students)} students. Downloading images...")
    
    # Create testing_images directory
    target_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "testing_images")
    os.makedirs(target_dir, exist_ok=True)
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    downloaded = 0
    failed = 0
    
    for student in students:
        roll_number = student.get("roll_number")
        photo_url = student.get("photo_url")
        
        if not roll_number or not photo_url:
            continue
            
        file_path = os.path.join(target_dir, f"{roll_number}.jpg")
        
        try:
            req = urllib.request.Request(photo_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response_http, open(file_path, 'wb') as out_file:
                out_file.write(response_http.read())
            downloaded += 1
            print(f"Downloaded: {roll_number}.jpg ({downloaded}/{len(students)})", end="\r")
        except Exception as e:
            print(f"\nFailed to download for {roll_number}: {e}")
            failed += 1
            
    print(f"\n\nDownload complete! Successfully saved {downloaded} images to 'testing_images' folder.")
    if failed > 0:
        print(f"Failed to download {failed} images.")

if __name__ == "__main__":
    main()
