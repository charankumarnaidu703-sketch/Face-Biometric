"""
Automated End-to-End API Test Script using built-in urllib.

Validates all endpoints in the Hostel Biometric API:
  1. Creates or verifies a test admin user in Supabase.
  2. Authenticates via /api/auth/login to retrieve a JWT token.
  3. Registers a test student profile via /api/students/register (under JWT protection).
  4. Enrolls the student's face via /api/face/enroll using a base64 selfie.
  5. Identifies the student via /api/face/identify from a different selfie.
  6. Simulates guard confirmation and writes check-out/check-in logs via /api/face/log-action.
  7. Queries college check-out dashboard statistics via /api/outpass/currently-out.
  8. Queries historical college outpass logs via /api/outpass/logs.
"""

import sys
import base64
import urllib.request
import urllib.parse
import json
import time
import uvicorn
from multiprocessing import Process
from services.supabase_client import supabase

BASE_URL = "http://127.0.0.1:8000/api"
TEST_ADMIN_EMAIL = "test_admin@college.edu"


def get_base64_image(filename: str) -> str:
    """Read a local image file and encode it as base64."""
    with open(filename, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def seed_test_admin():
    """Ensure a test admin user exists in the Supabase database."""
    print("Seeding test admin user...")
    # Check if user already exists
    existing = supabase.table("users").select("*").eq("email", TEST_ADMIN_EMAIL).execute()
    if existing.data:
        print(f"✅ Test admin already exists (ID: {existing.data[0]['id']})")
        return existing.data[0]

    # Insert test admin
    res = supabase.table("users").insert({
        "email": TEST_ADMIN_EMAIL,
        "role": "admin",
        "college_name": "Test Engineering College"
    }).execute()

    if not res.data:
        print("❌ Failed to seed test admin in database")
        sys.exit(1)

    print(f"✅ Created test admin: {res.data[0]['id']}")
    return res.data[0]


def make_request(url: str, method: str = "GET", data: dict = None, headers: dict = None) -> tuple:
    """Helper using urllib to make HTTP requests and return (status_code, body_dict)."""
    headers = headers or {}
    req_data = None
    
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            return response.status, res_body
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            error_json = json.loads(error_body)
        except json.JSONDecodeError:
            error_json = error_body
        return e.code, error_json


def run_tests():
    """Executes the test suite against the local running FastAPI server."""
    # Ensure photos exist
    try:
        b64_photo1 = get_base64_image("photo1.jpg")
        b64_photo2 = get_base64_image("photo2.jpg")
        b64_photo3 = get_base64_image("photo3.jpg")
    except FileNotFoundError:
        print("❌ Test photo files not found. Please run Step 7 first.")
        return

    admin = seed_test_admin()
    admin_id = admin["id"]

    print("\n--- STARTING API ENDPOINT TESTS ---")

    # 1. Login
    print("\n[TEST 1] Logging in via POST /auth/login...")
    status, login_data = make_request(
        f"{BASE_URL}/auth/login",
        method="POST",
        data={"email": TEST_ADMIN_EMAIL}
    )
    if status != 200:
        print(f"❌ Login failed: {login_data}")
        return

    token = login_data["token"]
    print(f"✅ Login successful. Received token: {token[:30]}...")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register Student
    print("\n[TEST 2] Registering student via POST /students/register...")
    roll_number = f"ROLL-{int(time.time())}"  # Make unique to avoid conflict errors
    student_payload = {
        "user_id": admin_id,
        "name": "Alex Mercer",
        "roll_number": roll_number,
        "department": "Computer Science",
        "year": "3rd Year",
        "room_number": "D-304",
        "phone": "+919876543210"
    }
    status, reg_res = make_request(
        f"{BASE_URL}/students/register",
        method="POST",
        data=student_payload,
        headers=headers
    )
    if status != 200:
        print(f"❌ Student registration failed: {reg_res}")
        return

    student_data = reg_res["student"]
    student_id = student_data["id"]
    print(f"✅ Student registered successfully (ID: {student_id}, Roll: {roll_number})")

    # 3. Enroll Face
    print("\n[TEST 3] Enrolling student face via POST /face/enroll...")
    enroll_payload = {
        "student_id": student_id,
        "base64_image": b64_photo1
    }
    status, enroll_res = make_request(
        f"{BASE_URL}/face/enroll",
        method="POST",
        data=enroll_payload,
        headers=headers
    )
    if status != 200:
        print(f"❌ Face enrollment failed: {enroll_res}")
        return
    print(f"✅ Face enrolled successfully: {enroll_res}")

    # 4. Identify Face (Positive Match)
    print("\n[TEST 4] Identifying face (Positive Match - photo2) via POST /face/identify...")
    id_payload = {
        "base64_image": b64_photo2,
        "admin_user_id": admin_id
    }
    status, id_data = make_request(
        f"{BASE_URL}/face/identify",
        method="POST",
        data=id_payload,
        headers=headers
    )
    if status != 200:
        print(f"❌ Face identification request failed: {id_data}")
        return

    if not id_data.get("matched"):
        print(f"❌ Face identification positive match failed: {id_data}")
        return

    print(f"✅ Student identified successfully! Confidence: {id_data['confidence']}%")
    print(f"   Name: {id_data['student']['name']}, Predicted Next Action: {id_data['next_action']}")

    # 5. Identify Face (Negative Match - photo3)
    print("\n[TEST 5] Identifying face (Negative Match - photo3) via POST /face/identify...")
    neg_payload = {
        "base64_image": b64_photo3,
        "admin_user_id": admin_id
    }
    status, neg_data = make_request(
        f"{BASE_URL}/face/identify",
        method="POST",
        data=neg_payload,
        headers=headers
    )
    if neg_data.get("matched"):
        print(f"⚠️ Face identification false positive match! Matched student: {neg_data}")
        return
    print(f"✅ Correctly rejected different person. Reason: {neg_data.get('reason')}")

    # 6. Log check-out action (OUT)
    print("\n[TEST 6] Logging check-out transaction via POST /face/log-action...")
    log_payload = {
        "student_id": student_id,
        "action": "OUT",
        "confidence": id_data["confidence"],
        "gate": "MAIN_GATE"
    }
    status, log_res = make_request(
        f"{BASE_URL}/face/log-action",
        method="POST",
        data=log_payload,
        headers=headers
    )
    if status != 200:
        print(f"❌ Failed to log outpass action: {log_res}")
        return
    print(f"✅ Log action logged successfully: {log_res}")

    # 7. Check currently outside status
    print("\n[TEST 7] Querying currently outside students via GET /outpass/currently-out/...")
    status, out_data = make_request(
        f"{BASE_URL}/outpass/currently-out/{admin_id}",
        method="GET",
        headers=headers
    )
    if status != 200:
        print(f"❌ Currently out query failed: {out_data}")
        return

    print(f"✅ Currently OUT count: {out_data['count']}")
    for s in out_data["students"]:
        print(f"   - {s['name']} (Room {s['room_number']}) out since {s['out_since']}")

    # 8. Check log history
    print("\n[TEST 8] Querying outpass log history via GET /outpass/logs/...")
    status, history_data = make_request(
        f"{BASE_URL}/outpass/logs/{admin_id}",
        method="GET",
        headers=headers
    )
    if status != 200:
        print(f"❌ Log history query failed: {history_data}")
        return

    print(f"✅ Found {len(history_data['logs'])} outpass logs in history")

    print("\n🎉 ALL API ENDPOINT TESTS COMPLETED SUCCESSFULLY!")


def start_server_and_test():
    """Starts the FastAPI server as a background process and triggers tests."""
    print("Starting FastAPI development server...")
    server_process = Process(
        target=uvicorn.run,
        args=("main:app",),
        kwargs={"host": "127.0.0.1", "port": 8000, "log_level": "warning"}
    )
    server_process.start()

    # Give server time to bind port
    time.sleep(3)

    try:
        run_tests()
    finally:
        print("\nStopping FastAPI server...")
        server_process.terminate()
        server_process.join()
        print("Server stopped.")


if __name__ == "__main__":
    start_server_and_test()
