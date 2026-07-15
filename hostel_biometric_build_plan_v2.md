# 📱 Hostel Biometric App — Step by Step Build Guide (v2)
## Same Plan · VS Code + Android Emulator · Claude Design Integration · 33 Steps

---

## 🗺️ OVERVIEW MAP

```
SETUP         BACKEND          DESIGN           ADMIN APP        GUARD APP        DEPLOY
Steps 1–6  →  Steps 7–14  →  Steps 15–17  →  Steps 18–24  →  Steps 25–29  →  Steps 30–33
(2 days)      (3 days)        (2 days)         (5 days)         (4 days)         (3 days)
```

---

## 🟦 BLOCK 1 — SETUP
### Steps 1 to 6 · Days 1–2

---

### STEP 1 — Install Required Tools on Your Computer
*(Modified: Expo Go removed → Android Studio added)*

**What you're doing:** Making sure your computer has everything installed before writing a single line of code.

Install these (if not already installed):

```bash
# 1. Node.js (for React Native / Expo)
# Download from: https://nodejs.org → Install LTS version
node --version   # Should print v18+ or v20+

# 2. Python
# Download from: https://python.org → Install 3.11+
python --version   # Should print 3.11+

# 3. Expo CLI and EAS CLI
npm install -g expo-cli eas-cli

# 4. VS Code
# Download from: https://code.visualstudio.com
# Recommended extensions to install inside VS Code:
#   - React Native Tools (by Microsoft)
#   - Prettier
#   - ESLint

# 5. Android Studio (for running the emulator)
# Download from: https://developer.android.com/studio
# During setup:
#   → Install Android SDK (API Level 34 recommended)
#   → Open AVD Manager → Create Virtual Device
#   → Recommended device: Pixel 6, API Level 34
#   → Start the emulator once to confirm it works
```

> **Note:** You do NOT need Expo Go. The app will run directly on the Android Emulator (or a physical Android device via USB).

✅ **Checkpoint:** `node --version` and `python --version` print without error. Android Studio opens and emulator boots to Android home screen.

---

### STEP 2 — Create the Project Folder Structure

**What you're doing:** Setting up the folders for the entire project in one go.

```bash
mkdir hostel-biometric
cd hostel-biometric

mkdir backend
mkdir mobile

# Inside backend folder
cd backend
mkdir routes
mkdir services
mkdir models
touch main.py
touch requirements.txt
touch .env
cd routes
touch auth.py students.py face.py outpass.py
cd ../services
touch face_engine.py supabase_client.py
cd ../models
touch schemas.py

# Go back to root
cd ../..
```

✅ **Checkpoint:** Your folder looks like this:

```
hostel-biometric/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   ├── routes/       (auth, students, face, outpass)
│   ├── services/     (face_engine, supabase_client)
│   └── models/       (schemas)
└── mobile/           (empty for now)
```

---

### STEP 3 — Set Up Python Backend Environment

**What you're doing:** Creating an isolated Python environment and installing all backend libraries.

```bash
cd hostel-biometric/backend

# Create virtual environment
python -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# (venv) should now appear before your terminal prompt

# Install all libraries
pip install fastapi uvicorn face_recognition numpy Pillow supabase python-dotenv python-jose[cryptography] python-multipart

# Save them to requirements.txt
pip freeze > requirements.txt
```

Test the install:

```bash
python -c "import face_recognition; print('face_recognition OK')"
python -c "import fastapi; print('fastapi OK')"
```

✅ **Checkpoint:** Both print OK without any error.

---

### STEP 4 — Set Up Expo Mobile App
*(Modified: Expo Go removed → Android Emulator run)*

**What you're doing:** Creating the React Native mobile app using Expo, and verifying it runs on the Android Emulator.

```bash
cd hostel-biometric

# Create Expo app
npx create-expo-app mobile --template blank

cd mobile

# Install all needed libraries
npx expo install expo-camera expo-secure-store expo-image-picker expo-file-system

npm install axios zustand nativewind react-native-svg
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
```

**Run on Android Emulator:**

```bash
# Step 1: Start your Android Emulator from Android Studio first
# (AVD Manager → Click the ▶ Play button on your virtual device)

# Step 2: Once emulator is booted, run:
npx expo run:android

# This compiles the app and installs it directly on the emulator
# First run takes 3-5 minutes to compile — this is normal
```

**Alternative — Run on a physical Android phone:**

```bash
# 1. Enable Developer Options on your phone:
#    Settings → About Phone → Tap "Build Number" 7 times
# 2. Enable USB Debugging under Developer Options
# 3. Connect phone to PC via USB cable
# 4. Run: npx expo run:android
# It will detect your phone and install directly
```

✅ **Checkpoint:** App appears on Android Emulator (or your phone) showing "Open up App.js to start working on your app!" No Expo Go needed.

---

### STEP 5 — Set Up Supabase (Free Database)

**What you're doing:** Creating your free cloud database where all student data and face embeddings will be stored.

**Steps:**

1. Go to [supabase.com](https://supabase.com) → Sign up free (no credit card)
2. Click **New Project** → Name it: `hostel-biometric`
3. Set a database password (save it somewhere)
4. Wait ~2 minutes for it to set up
5. Go to **SQL Editor** (left sidebar)
6. Paste and run this SQL:

```sql
-- Run this in Supabase SQL Editor

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guard')),
  college_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  department TEXT,
  year INT,
  room_number TEXT,
  phone TEXT,
  photo_url TEXT,
  is_enrolled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE face_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  embedding JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE outpass_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  action TEXT NOT NULL CHECK (action IN ('OUT', 'IN')),
  timestamp TIMESTAMP DEFAULT NOW(),
  confidence FLOAT,
  logged_by UUID REFERENCES users(id),
  gate TEXT DEFAULT 'MAIN_GATE'
);
```

7. Go to **Settings → API** (left sidebar)
8. Copy these two values:
   - **Project URL** (looks like: `https://xxxx.supabase.co`)
   - **anon public key** (long string)

9. Paste them in your `backend/.env` file:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
SECRET_KEY=any-random-string-you-make-up-for-jwt
```

✅ **Checkpoint:** 4 tables visible in Supabase → Table Editor. `.env` file has 3 values filled in.

---

### STEP 6 — Create a Railway.app Account (Free Hosting)

**What you're doing:** Setting up the free hosting where your backend will live. You don't deploy yet — just create the account.

1. Go to [railway.app](https://railway.app) → Sign up with GitHub (free)
2. You'll see a dashboard — don't do anything else yet

> Railway gives $5 free credit/month — your small FastAPI app will use about $1–2/month, so it runs for months free.

✅ **Checkpoint:** Railway account created. Dashboard visible.

---

## 🟩 BLOCK 2 — BACKEND + AI ENGINE
### Steps 7 to 14 · Days 3–5

---

### STEP 7 — Test the Face AI Library First (Most Important Step)

**What you're doing:** Before writing any API or app, prove the face recognition actually works by itself in a simple Python script.

```bash
cd hostel-biometric/backend
source venv/bin/activate

touch test_face.py
```

Paste this into `test_face.py`:

```python
import face_recognition

print("=== FACE RECOGNITION TEST ===")

# STEP 1: Load your first photo (take 2 selfies and save as photo1.jpg, photo2.jpg)
img1 = face_recognition.load_image_file("photo1.jpg")
encoding1 = face_recognition.face_encodings(img1)

if not encoding1:
    print("❌ No face found in photo1.jpg")
else:
    encoding1 = encoding1[0]
    print(f"✅ Embedding extracted: {len(encoding1)} numbers")

# STEP 2: Load your second photo (should be same person)
img2 = face_recognition.load_image_file("photo2.jpg")
encoding2 = face_recognition.face_encodings(img2)

if not encoding2:
    print("❌ No face found in photo2.jpg")
else:
    encoding2 = encoding2[0]

# STEP 3: Compare them
match = face_recognition.compare_faces([encoding1], encoding2, tolerance=0.5)
distance = face_recognition.face_distance([encoding1], encoding2)
confidence = round((1 - distance[0]) * 100, 2)

print(f"Match: {match[0]}")            # Should be True
print(f"Confidence: {confidence}%")    # Should be above 70%
print("✅ Face recognition is working!" if match[0] else "❌ No match")
```

Run it:

```bash
# Put two photos of yourself (photo1.jpg, photo2.jpg) in the backend folder first
python test_face.py
```

✅ **Checkpoint:** Terminal prints `Match: True` and `Confidence: 75%+`. This is your proof of concept. Everything else is built around this moment.

---

### STEP 8 — Write the Supabase Connection File

**What you're doing:** Writing the file that connects your backend to the Supabase database.

Paste into `backend/services/supabase_client.py`:

```python
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
```

Test it:

```bash
python -c "from services.supabase_client import supabase; print('Supabase connected ✅')"
```

✅ **Checkpoint:** Prints "Supabase connected ✅" without error.

---

### STEP 9 — Write the Face Engine (Core AI File)

**What you're doing:** Writing the AI engine that handles all face operations — extract embedding from an image, compare against stored embeddings.

Paste into `backend/services/face_engine.py`:

```python
import face_recognition
import numpy as np
from PIL import Image
import io
import base64

def decode_image(base64_string: str) -> np.ndarray:
    """Convert base64 image from mobile app to numpy array"""
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    image_bytes = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return np.array(image)

def extract_embedding(base64_image: str) -> dict:
    """Extract 128-D face embedding from a base64 image"""
    img_array = decode_image(base64_image)
    face_locations = face_recognition.face_locations(img_array)

    if len(face_locations) == 0:
        return {"success": False, "error": "NO_FACE_DETECTED"}
    if len(face_locations) > 1:
        return {"success": False, "error": "MULTIPLE_FACES_DETECTED"}

    embeddings = face_recognition.face_encodings(img_array, face_locations)
    embedding = embeddings[0]

    return {
        "success": True,
        "embedding": embedding.tolist()
    }

def identify_student(query_base64: str, all_embeddings: list, tolerance: float = 0.5) -> dict:
    """Compare live face against all stored embeddings. Return best match."""
    img_array = decode_image(query_base64)
    face_locations = face_recognition.face_locations(img_array)

    if not face_locations:
        return {"matched": False, "reason": "NO_FACE_IN_FRAME"}

    query_encoding = face_recognition.face_encodings(img_array, face_locations)[0]

    known_encodings = [np.array(e["embedding"]) for e in all_embeddings]
    known_ids = [e["student_id"] for e in all_embeddings]

    if not known_encodings:
        return {"matched": False, "reason": "NO_STUDENTS_ENROLLED"}

    matches = face_recognition.compare_faces(known_encodings, query_encoding, tolerance=tolerance)
    face_distances = face_recognition.face_distance(known_encodings, query_encoding)

    if True not in matches:
        return {"matched": False, "reason": "NO_MATCH_FOUND"}

    best_index = np.argmin(face_distances)

    if not matches[best_index]:
        return {"matched": False, "reason": "BELOW_THRESHOLD"}

    confidence = round((1 - face_distances[best_index]) * 100, 2)

    return {
        "matched": True,
        "student_id": known_ids[best_index],
        "confidence": confidence
    }
```

✅ **Checkpoint:** File saved. No syntax errors (`python -c "from services.face_engine import extract_embedding; print('OK')"`)

---

### STEP 10 — Write the Auth Routes

**What you're doing:** Building the login API so admin and guard can get a JWT token.

Paste into `backend/routes/auth.py`:

```python
from fastapi import APIRouter, HTTPException
from services.supabase_client import supabase
from jose import jwt
import os
from datetime import datetime, timedelta

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

@router.post("/login")
async def login(payload: dict):
    email = payload.get("email")

    result = supabase.table("users").select("*").eq("email", email).execute()

    if not result.data:
        raise HTTPException(404, "User not found")

    user = result.data[0]
    token = create_token(user["id"], user["role"])

    return {
        "token": token,
        "user_id": user["id"],
        "role": user["role"],
        "college_name": user.get("college_name")
    }
```

✅ **Checkpoint:** File saved without syntax errors.

---

### STEP 11 — Write the Student Routes

**What you're doing:** Building APIs for registering, listing, and getting students.

Paste into `backend/routes/students.py`:

```python
from fastapi import APIRouter
from services.supabase_client import supabase

router = APIRouter()

@router.post("/register")
async def register_student(payload: dict):
    """Register a new student"""
    result = supabase.table("students").insert({
        "user_id": payload["user_id"],
        "name": payload["name"],
        "roll_number": payload["roll_number"],
        "department": payload.get("department"),
        "year": payload.get("year"),
        "room_number": payload.get("room_number"),
        "phone": payload.get("phone"),
        "photo_url": payload.get("photo_url")
    }).execute()

    return {"success": True, "student": result.data[0]}

@router.get("/list/{user_id}")
async def list_students(user_id: str):
    """Get all students for an admin"""
    result = supabase.table("students").select("*").eq("user_id", user_id).execute()
    return {"students": result.data}

@router.get("/{student_id}")
async def get_student(student_id: str):
    """Get one student's full details"""
    result = supabase.table("students").select("*").eq("id", student_id).single().execute()
    return result.data

@router.get("/{student_id}/status")
async def get_student_status(student_id: str):
    """Get last IN/OUT log for a student"""
    log = supabase.table("outpass_logs")\
        .select("action, timestamp")\
        .eq("student_id", student_id)\
        .order("timestamp", desc=True)\
        .limit(1)\
        .execute()

    if not log.data:
        return {"status": "IN", "last_seen": None}

    return {"status": log.data[0]["action"], "last_seen": log.data[0]["timestamp"]}
```

✅ **Checkpoint:** File saved without syntax errors.

---

### STEP 12 — Write the Face Routes

**What you're doing:** Building the two most important API endpoints — enroll a face and identify a face.

Paste into `backend/routes/face.py`:

```python
from fastapi import APIRouter, HTTPException
from services.face_engine import extract_embedding, identify_student
from services.supabase_client import supabase

router = APIRouter()

@router.post("/enroll")
async def enroll_face(payload: dict):
    """Enroll a student's face. Send student_id + base64_image."""
    student_id = payload["student_id"]
    base64_image = payload["base64_image"]

    result = extract_embedding(base64_image)

    if not result["success"]:
        raise HTTPException(400, detail=result["error"])

    supabase.table("face_embeddings").insert({
        "student_id": student_id,
        "embedding": result["embedding"]
    }).execute()

    supabase.table("students").update({"is_enrolled": True}).eq("id", student_id).execute()

    return {"success": True, "message": "Face enrolled successfully"}

@router.post("/identify")
async def identify_face(payload: dict):
    """Identify a person from live camera frame."""
    base64_image = payload["base64_image"]
    admin_user_id = payload["admin_user_id"]

    embeddings_data = supabase.table("face_embeddings")\
        .select("student_id, embedding, students!inner(user_id)")\
        .eq("students.user_id", admin_user_id)\
        .execute()

    all_embeddings = [
        {"student_id": e["student_id"], "embedding": e["embedding"]}
        for e in embeddings_data.data
    ]

    result = identify_student(base64_image, all_embeddings)

    if not result["matched"]:
        return {"matched": False, "reason": result["reason"]}

    student = supabase.table("students").select("*").eq("id", result["student_id"]).single().execute()

    last_log = supabase.table("outpass_logs")\
        .select("action")\
        .eq("student_id", result["student_id"])\
        .order("timestamp", desc=True)\
        .limit(1)\
        .execute()

    last_action = last_log.data[0]["action"] if last_log.data else "IN"
    next_action = "OUT" if last_action == "IN" else "IN"

    return {
        "matched": True,
        "student": student.data,
        "confidence": result["confidence"],
        "next_action": next_action
    }

@router.post("/log-action")
async def log_action(payload: dict):
    """Log an IN or OUT action after guard confirms."""
    supabase.table("outpass_logs").insert({
        "student_id": payload["student_id"],
        "action": payload["action"],
        "confidence": payload["confidence"],
        "logged_by": payload.get("logged_by"),
        "gate": payload.get("gate", "MAIN_GATE")
    }).execute()

    return {"success": True, "logged": payload["action"]}
```

✅ **Checkpoint:** File saved without syntax errors.

---

### STEP 13 — Write the Outpass Routes + main.py

**What you're doing:** Adding log history endpoint and wiring everything together in `main.py`.

Paste into `backend/routes/outpass.py`:

```python
from fastapi import APIRouter
from services.supabase_client import supabase

router = APIRouter()

@router.get("/logs/{admin_user_id}")
async def get_logs(admin_user_id: str, limit: int = 20):
    """Get recent outpass logs for this college"""
    logs = supabase.table("outpass_logs")\
        .select("*, students!inner(name, roll_number, room_number, user_id)")\
        .eq("students.user_id", admin_user_id)\
        .order("timestamp", desc=True)\
        .limit(limit)\
        .execute()
    return {"logs": logs.data}

@router.get("/currently-out/{admin_user_id}")
async def currently_out(admin_user_id: str):
    """Get all students who are currently outside"""
    students = supabase.table("students").select("id, name, roll_number, room_number").eq("user_id", admin_user_id).execute()

    outside = []
    for student in students.data:
        last_log = supabase.table("outpass_logs")\
            .select("action, timestamp")\
            .eq("student_id", student["id"])\
            .order("timestamp", desc=True)\
            .limit(1)\
            .execute()

        if last_log.data and last_log.data[0]["action"] == "OUT":
            student["out_since"] = last_log.data[0]["timestamp"]
            outside.append(student)

    return {"count": len(outside), "students": outside}
```

Paste into `backend/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, students, face, outpass

app = FastAPI(title="Hostel Biometric API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(students.router, prefix="/api/students")
app.include_router(face.router, prefix="/api/face")
app.include_router(outpass.router, prefix="/api/outpass")

@app.get("/")
def health():
    return {"status": "running ✅", "project": "Hostel Biometric"}
```

✅ **Checkpoint:** File saved.

---

### STEP 14 — Start the Backend and Test All Endpoints

**What you're doing:** Starting the server and testing every endpoint using the built-in Swagger docs.

```bash
cd hostel-biometric/backend
uvicorn main:app --reload
```

Open in browser: `http://localhost:8000/docs`

You'll see auto-generated API docs. Test in this order:

```
TEST 1 → POST /api/auth/login
  Body: { "email": "admin@test.com", "password": "123" }
  (First add a test user directly in Supabase Table Editor)

TEST 2 → POST /api/students/register
  Body: { "user_id": "...", "name": "Test Student", "roll_number": "21CS001" }

TEST 3 → POST /api/face/enroll
  Body: { "student_id": "...", "base64_image": "..." }
  (Use a base64 converter site to convert your photo)

TEST 4 → POST /api/face/identify
  Same base64 image → should return the student name back
```

✅ **Checkpoint:** Test 4 returns `"matched": true` with the student's name. Backend is 100% working.

---

## 🎨 BLOCK 3 — DESIGN PHASE (NEW)
### Steps 15 to 17 · Days 6–7

> **Why this block exists:** Before writing a single frontend component, you'll design every screen visually using Claude Design. This gives you a professional-looking UI and a clear visual target to code against — rather than making design decisions while coding.

---

### STEP 15 — Generate Claude Design Prompts for All 8 Screens

**What you're doing:** This step gives you ready-to-paste prompts for Claude Design, one per screen. You'll use these in Step 16.

---

**PROMPT 1 — Login Screen**

```
Design a clean, professional mobile login screen for a hostel biometric security app called "Hostel Biometric".
Primary color: deep blue (#2563EB). Background: white.

Layout (top to bottom):
- A subtle shield or fingerprint icon (48px) in blue at the top center
- App name "Hostel Biometric" in bold, large text (28px)
- Subtitle: "Hostel Management System" in gray (#6B7280), smaller text
- 40px spacing
- Email input field with label "Email" above it — rounded corners, light border (#D1D5DB)
- Password input field with label "Password" above it — same style, with a small eye icon on the right
- 24px spacing
- Full-width blue button labeled "Login" — rounded corners, white bold text
- Footer note at very bottom: "Powered by Biometric AI" in light gray

Minimal, secure, institutional look. No gradients. Flat design.
```

---

**PROMPT 2 — Admin Dashboard Screen**

```
Design a mobile dashboard screen for a hostel admin portal. Light gray background (#F5F5F5).

Layout (top to bottom):
- Header: "Welcome 👋" in bold, and below it a smaller gray line for college name
- 4 stat cards arranged in a 2x2 grid, each card with rounded corners (12px), no shadow:
  Card 1 (blue #2563EB): large white number, label "Total Students"
  Card 2 (green #16A34A): large white number, label "Enrolled"
  Card 3 (red #DC2626): large white number, label "Currently OUT"
  Card 4 (purple #9333EA): large white number, label "Currently IN"
- 24px spacing after cards
- Full-width solid blue button: "+ Register New Student"
- Full-width outlined white button (blue border): "View All Students"

Clean data dashboard feel. Card numbers should look large and prominent.
```

---

**PROMPT 3 — Register Student Form Screen**

```
Design a mobile form screen for registering a hostel student. White background.

Layout (top to bottom):
- Screen title: "Register Student" in bold (22px)
- 6 form fields stacked vertically, each with:
  - Label text above in dark gray (#374151), semi-bold
  - Input box below with rounded corners (8px), light border (#D1D5DB), inner padding 12px
  Fields: Full Name, Roll Number, Department, Year, Room Number, Phone Number
- Spacing of 16px between each field
- At the bottom: a full-width green (#16A34A) button labeled "Register & Enroll Face →" with rounded corners (12px) and white bold text

Clean, structured form. No decorative elements. Label and field are tightly paired.
```

---

**PROMPT 4 — Face Enrollment Camera Screen**

```
Design a mobile camera screen for capturing student face photos for biometric enrollment. Dark overlay on camera background.

Layout:
- Full-screen camera view as the background
- Centered on the screen: a dashed green (#00FF00) oval outline (~220px wide, ~280px tall) to guide face positioning
- Top overlay (semi-transparent dark pill): instruction text in white, e.g. "Look straight at the camera"
- Just below the pill: a smaller progress indicator "Photo 1/3 captured" in white on a dark background
- Bottom of screen: a large circular green button (80px diameter) centered — this is the capture button, with a camera emoji or icon in white
- Very subtle dark vignette around the edges of the camera view

Biometric, professional feel. The green oval is the visual centerpiece.
```

---

**PROMPT 5 — Student List Screen**

```
Design a mobile list screen showing all registered students for an admin. Light gray background (#F5F5F5).

Layout (top to bottom):
- Search bar at the top: white background, rounded (10px), border (#E5E7EB), placeholder "Search by name or roll number..." with a search icon on the left
- Scrollable list below, each list item is a white card with rounded corners (12px), padding 16px:
  - Left side: student name in bold (16px), below it roll number and room number in gray (#6B7280, 13px)
  - Right side: a status badge pill
    - If enrolled: green background (#DCFCE7), green text "Enrolled ✅"
    - If not enrolled: red background (#FEE2E2), red text "Not Enrolled"
- Cards have 8px spacing between them

Functional, data-focused list view. No avatars needed.
```

---

**PROMPT 6 — Guard Scan Screen**

```
Design a mobile camera screen for a hostel guard to scan and identify student faces. Full screen camera view.

Layout:
- Full-screen camera view as the background
- Centered: a dashed green (#00FF00) oval outline, slightly larger than enrollment oval (~240px wide, ~310px tall)
- Top center overlay on semi-transparent dark background: white text "👤 Center face in oval" (18px bold)
- Bottom of screen: a large pill-shaped blue (#2563EB) button with white bold text "SCAN FACE" — wide (60% screen width), tall (56px), with very rounded corners (50px border radius)

State variation to show:
- Default state: green oval, blue button "SCAN FACE"
- Scanning state: orange oval (solid not dashed), gray button "Scanning..." with disabled look

Action-focused, simple. The scan button is the most dominant element.
```

---

**PROMPT 7 — Student Found Bottom Sheet Modal**

```
Design a mobile bottom sheet modal that slides up from the bottom after a face scan. Dark overlay behind it covers the top portion.

The modal itself (white, rounded top corners 24px) has two states:

STATE 1 — Match Found:
- Circular student profile photo (90px) at top center
- Student name in bold (22px)
- Gray text below: roll number · room number
- A blue pill badge: "Match Confidence: 87%" in blue text on light blue background
- 20px spacing
- Large red button (full width, 18px bold white text) for "🔴 CONFIRM OUT"
  OR large green button for "🟢 CONFIRM IN" (only one shows based on student's current status)
- Below it: a gray outlined button "Cancel / Scan Again"

STATE 2 — Unknown Person:
- Large ⚠️ emoji centered
- "Unknown Person" in bold (20px)
- Gray description text: "This person is not registered."
- Gray "Close" button

Design both states side by side or stacked for reference.
```

---

**PROMPT 8 — Recent Logs Screen**

```
Design a mobile list screen showing recent hostel IN/OUT activity logs. Light gray background (#F5F5F5).

Layout (top to bottom):
- Header row: "Recent Logs" in bold (20px) on the left, "Refresh" in blue on the right, same line
- Scrollable list of log entries, each as a white card (rounded 12px, padding 14px):
  - Far left: a colored filled circle (red for OUT, green for IN) — 12px diameter
  - Center: student name in bold, below it roll number · room number in gray (13px)
  - Far right: action label (OUT in red, IN in green, 600 weight) and below it timestamp in light gray (12px)
- Cards spaced 8px apart

Clean, minimal log view. Color-coded status is the key visual signal.
```

---

✅ **Checkpoint:** You have all 8 prompts saved. Ready to paste into Claude Design one by one.

---

### STEP 16 — Create Screen Designs in Claude Design *(User Action)*

**What you're doing:** Using the prompts from Step 15 to generate professional screen mockups in Claude Design, then saving each one.

**Steps:**

1. Go to [claude.ai](https://claude.ai) → Open **Claude Design**
2. For each screen, paste the corresponding prompt from Step 15
3. Review the generated design — if something doesn't look right, refine the prompt with more specific instructions
4. Once satisfied, **export/save each design as a PNG image**
5. Name each file clearly:

```
login.png
dashboard.png
register-student.png
face-enrollment.png
student-list.png
guard-scan.png
student-found-modal.png
recent-logs.png
```

> **Tip:** For screens with two states (like the modal), export both states as separate images or get one combined reference image.

✅ **Checkpoint:** You have 8 design PNG files saved on your computer, one per screen.

---

### STEP 17 — Import and Organize Designs into Project

**What you're doing:** Storing the Claude Design exports inside the project folder so you can reference them side-by-side in VS Code while building each screen.

```bash
# Create a designs folder inside mobile
mkdir hostel-biometric/mobile/designs

# Copy all 8 PNGs from wherever you saved them into this folder
# (Do this manually in File Explorer / Finder)
```

Your folder should now look like:

```
mobile/
└── designs/
    ├── login.png
    ├── dashboard.png
    ├── register-student.png
    ├── face-enrollment.png
    ├── student-list.png
    ├── guard-scan.png
    ├── student-found-modal.png
    └── recent-logs.png
```

**How to use these in VS Code while coding:**

- Open VS Code
- Split your editor: code file on the left, design image on the right
- In VS Code: right-click any `.png` file in the Explorer → **Open to the Side**
- Code the screen to match the design visually

✅ **Checkpoint:** `mobile/designs/` folder has all 8 PNG files. VS Code can open and display them alongside your code files.

---

## 🟨 BLOCK 4 — ADMIN PORTAL (Mobile)
### Steps 18 to 24 · Days 8–12

---

### STEP 18 — Set Up Navigation and Global State

**What you're doing:** Setting up the skeleton of the app — navigation between screens and global data storage.

Create `mobile/store/useStore.js`:

```js
import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth state
  token: null,
  user: null,
  role: null,

  setAuth: (token, user, role) => set({ token, user, role }),
  logout: () => set({ token: null, user: null, role: null }),
}));

export default useStore;
```

Create `mobile/services/api.js`:

```js
import axios from 'axios';

// Change this URL when you deploy to Railway
const API_URL = 'http://YOUR_LOCAL_IP:8000'; // e.g. http://192.168.1.5:8000

const api = axios.create({ baseURL: API_URL });

// Auth
export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

// Students
export const registerStudent = (data) =>
  api.post('/api/students/register', data);

export const getStudents = (user_id) =>
  api.get(`/api/students/list/${user_id}`);

// Face
export const enrollFace = (student_id, base64_image) =>
  api.post('/api/face/enroll', { student_id, base64_image });

export const identifyFace = (base64_image, admin_user_id, logged_by) =>
  api.post('/api/face/identify', { base64_image, admin_user_id, logged_by });

export const logAction = (student_id, action, confidence, logged_by) =>
  api.post('/api/face/log-action', { student_id, action, confidence, logged_by });

// Outpass
export const getRecentLogs = (admin_user_id) =>
  api.get(`/api/outpass/logs/${admin_user_id}`);

export const getCurrentlyOut = (admin_user_id) =>
  api.get(`/api/outpass/currently-out/${admin_user_id}`);
```

✅ **Checkpoint:** Files created. No import errors.

---

### STEP 19 — Build the Login Screen
> 🎨 **Reference design:** Open `mobile/designs/login.png` in VS Code side-by-side while coding this screen.

**What you're doing:** The first screen of the app. Both admin and guard use this. Role is returned from the backend.

Create `mobile/app/login.jsx`:

```jsx
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { login } from '../services/api';
import useStore from '../store/useStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useStore(s => s.setAuth);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await login(email, password);
      const { token, user_id, role, college_name } = res.data;

      setAuth(token, { id: user_id, college_name }, role);

      if (role === 'admin') router.replace('/admin/dashboard');
      if (role === 'guard') router.replace('/guard/scan');

    } catch (err) {
      Alert.alert('Login Failed', 'Check your email and password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
        🏫 Hostel Biometric
      </Text>
      <Text style={{ color: '#666', marginBottom: 32 }}>
        Login to continue
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 }}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 24 }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{ backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

✅ **Checkpoint:** App shows login form matching the Claude Design mockup. Correct credentials navigate to dashboard.

---

### STEP 20 — Build the Admin Dashboard Screen
> 🎨 **Reference design:** Open `mobile/designs/dashboard.png` in VS Code side-by-side while coding this screen.

**What you're doing:** The home screen for admin after login. Shows live stats.

Create `mobile/app/admin/dashboard.jsx`:

```jsx
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getStudents, getCurrentlyOut } from '../../services/api';
import useStore from '../../store/useStore';

export default function Dashboard() {
  const router = useRouter();
  const user = useStore(s => s.user);
  const [stats, setStats] = useState({ total: 0, enrolled: 0, out: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const students = await getStudents(user.id);
    const outside = await getCurrentlyOut(user.id);

    setStats({
      total: students.data.students.length,
      enrolled: students.data.students.filter(s => s.is_enrolled).length,
      out: outside.data.count
    });
  };

  const StatCard = ({ label, value, color }) => (
    <View style={{ flex: 1, backgroundColor: color, borderRadius: 12, padding: 16, margin: 4, alignItems: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>{value}</Text>
      <Text style={{ color: 'white', marginTop: 4 }}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>
        Welcome 👋
      </Text>
      <Text style={{ color: '#666', marginBottom: 20 }}>{user?.college_name}</Text>

      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        <StatCard label="Total Students" value={stats.total} color="#2563EB" />
        <StatCard label="Enrolled" value={stats.enrolled} color="#16A34A" />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <StatCard label="Currently OUT" value={stats.out} color="#DC2626" />
        <StatCard label="Currently IN" value={stats.total - stats.out} color="#9333EA" />
      </View>

      <TouchableOpacity onPress={() => router.push('/admin/register-student')}
        style={{ backgroundColor: '#2563EB', padding: 16, borderRadius: 12, marginBottom: 12 }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
          + Register New Student
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/admin/student-list')}
        style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
          View All Students
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

✅ **Checkpoint:** Dashboard shows 4 stat cards with real numbers from the database, matching the design mockup.

---

### STEP 21 — Build the Register Student Screen
> 🎨 **Reference design:** Open `mobile/designs/register-student.png` in VS Code side-by-side while coding this screen.

**What you're doing:** The form where admin fills in student info and saves to database.

Create `mobile/app/admin/register-student.jsx`:

```jsx
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { registerStudent } from '../../services/api';
import useStore from '../../store/useStore';

export default function RegisterStudent() {
  const router = useRouter();
  const user = useStore(s => s.user);
  const [form, setForm] = useState({
    name: '', roll_number: '', department: '',
    year: '', room_number: '', phone: ''
  });

  const Field = ({ label, fieldKey, ...props }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: '600', marginBottom: 6, color: '#374151' }}>{label}</Text>
      <TextInput
        value={form[fieldKey]}
        onChangeText={v => setForm(f => ({ ...f, [fieldKey]: v }))}
        style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 }}
        {...props}
      />
    </View>
  );

  const handleSubmit = async () => {
    if (!form.name || !form.roll_number) {
      Alert.alert('Error', 'Name and Roll Number are required');
      return;
    }

    const res = await registerStudent({ ...form, user_id: user.id });
    const newStudent = res.data.student;

    Alert.alert('Success ✅', `${form.name} registered!`, [
      { text: 'Enroll Face Now', onPress: () => router.push({ pathname: '/admin/enroll-face', params: { student_id: newStudent.id, student_name: newStudent.name } }) },
      { text: 'Register Another', onPress: () => setForm({ name: '', roll_number: '', department: '', year: '', room_number: '', phone: '' }) }
    ]);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>Register Student</Text>

      <Field label="Full Name *" fieldKey="name" placeholder="e.g. Rahul Sharma" />
      <Field label="Roll Number *" fieldKey="roll_number" placeholder="e.g. 21CS025" />
      <Field label="Department" fieldKey="department" placeholder="e.g. Computer Science" />
      <Field label="Year" fieldKey="year" placeholder="1 / 2 / 3 / 4" keyboardType="numeric" />
      <Field label="Room Number" fieldKey="room_number" placeholder="e.g. Block-A 302" />
      <Field label="Phone Number" fieldKey="phone" placeholder="e.g. 9876543210" keyboardType="phone-pad" />

      <TouchableOpacity onPress={handleSubmit}
        style={{ backgroundColor: '#16A34A', padding: 16, borderRadius: 12, marginTop: 8 }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
          Register & Enroll Face →
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

✅ **Checkpoint:** Filling the form and submitting creates a student in Supabase. Alert appears with "Enroll Face Now" button.

---

### STEP 22 — Build the Face Enrollment Screen (Key Screen)
> 🎨 **Reference design:** Open `mobile/designs/face-enrollment.png` in VS Code side-by-side while coding this screen.

**What you're doing:** The camera screen where admin captures 3 photos of a student to enroll their face.

Create `mobile/app/admin/enroll-face.jsx`:

```jsx
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { enrollFace } from '../../services/api';
import Svg, { Ellipse } from 'react-native-svg';

export default function EnrollFace() {
  const { student_id, student_name } = useLocalSearchParams();
  const cameraRef = useRef(null);
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState(0);
  const [loading, setLoading] = useState(false);

  const instructions = [
    "Look straight at the camera",
    "Turn slightly to your LEFT",
    "Turn slightly to your RIGHT"
  ];

  const captureAndEnroll = async () => {
    if (loading) return;
    setLoading(true);

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7,
      base64: true
    });

    const res = await enrollFace(student_id, photo.base64);

    if (res.data.success) {
      const newCount = captured + 1;
      setCaptured(newCount);

      if (newCount === 3) {
        Alert.alert('✅ Enrolled!', `${student_name}'s face is now enrolled.`, [
          { text: 'Done', onPress: () => router.replace('/admin/dashboard') }
        ]);
      }
    } else {
      Alert.alert('❌ Error', res.data.message || 'No face detected. Try again.');
    }

    setLoading(false);
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ marginBottom: 16 }}>Camera access is needed</Text>
        <TouchableOpacity onPress={requestPermission}
          style={{ backgroundColor: '#2563EB', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: 'white' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">

        {/* Face oval guide */}
        <Svg style={StyleSheet.absoluteFill}>
          <Ellipse cx="50%" cy="45%" rx="110" ry="140"
            fill="transparent" stroke="#00FF00"
            strokeWidth="3" strokeDasharray="10,5" />
        </Svg>

        {/* Instructions */}
        <View style={{ position: 'absolute', top: 60, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold',
            backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 }}>
            {instructions[captured] || "All done!"}
          </Text>
        </View>

        {/* Progress */}
        <View style={{ position: 'absolute', top: 110, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 6 }}>
            Photo {captured}/3 captured
          </Text>
        </View>

        {/* Capture button */}
        <View style={{ position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' }}>
          <TouchableOpacity onPress={captureAndEnroll} disabled={loading || captured >= 3}
            style={{ backgroundColor: captured >= 3 ? '#ccc' : '#16A34A',
              width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {loading ? '...' : '📸'}
            </Text>
          </TouchableOpacity>
        </View>

      </CameraView>
    </View>
  );
}
```

✅ **Checkpoint:** Admin can capture 3 photos. After 3rd photo, "Enrolled!" alert appears. Supabase shows 3 rows in `face_embeddings` table.

---

### STEP 23 — Build the Student List Screen
> 🎨 **Reference design:** Open `mobile/designs/student-list.png` in VS Code side-by-side while coding this screen.

**What you're doing:** A scrollable list of all registered students with their enrollment status.

Create `mobile/app/admin/student-list.jsx`:

```jsx
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getStudents } from '../../services/api';
import useStore from '../../store/useStore';

export default function StudentList() {
  const user = useStore(s => s.user);
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getStudents(user.id).then(res => setStudents(res.data.students));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/admin/enroll-face', params: { student_id: item.id, student_name: item.name } })}
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
        padding: 16, marginBottom: 8, borderRadius: 12 }}>

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
        <Text style={{ color: '#6b7280' }}>{item.roll_number} · Room {item.room_number}</Text>
      </View>

      <View style={{ backgroundColor: item.is_enrolled ? '#DCFCE7' : '#FEE2E2',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
        <Text style={{ color: item.is_enrolled ? '#16A34A' : '#DC2626', fontWeight: '600', fontSize: 12 }}>
          {item.is_enrolled ? 'Enrolled ✅' : 'Not Enrolled'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 16 }}>
      <TextInput
        placeholder="Search by name or roll number..."
        value={search}
        onChangeText={setSearch}
        style={{ backgroundColor: 'white', padding: 12, borderRadius: 10,
          marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb' }}
      />
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={renderItem} />
    </View>
  );
}
```

✅ **Checkpoint:** Student list shows with green "Enrolled" or red "Not Enrolled" badges. Search filters in real time.

---

### STEP 24 — Connect Admin Tabs (Navigation)

**What you're doing:** Wiring all admin screens into a bottom tab navigator.

Create `mobile/app/admin/_layout.jsx`:

```jsx
import { Tabs } from 'expo-router';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2563EB' }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarIcon: () => '🏠' }} />
      <Tabs.Screen name="student-list" options={{ title: 'Students', tabBarIcon: () => '👥' }} />
      <Tabs.Screen name="register-student" options={{ title: 'Register', tabBarIcon: () => '➕' }} />
      <Tabs.Screen name="enroll-face" options={{ href: null }} /> {/* hidden from tab bar */}
    </Tabs>
  );
}
```

✅ **Checkpoint:** Admin portal has a bottom tab bar with 3 tabs. All screens navigate correctly.

---

## 🟥 BLOCK 5 — GUARD / VERIFICATION PORTAL
### Steps 25 to 29 · Days 13–16

---

### STEP 25 — Build the Scan Screen (Core Guard Screen)
> 🎨 **Reference design:** Open `mobile/designs/guard-scan.png` in VS Code side-by-side while coding this screen.

**What you're doing:** The live camera screen where the guard scans a student's face. This is the most important screen of the entire app.

Create `mobile/app/guard/scan.jsx`:

```jsx
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { identifyFace } from '../../services/api';
import useStore from '../../store/useStore';
import Svg, { Ellipse } from 'react-native-svg';
import StudentFoundModal from '../../components/StudentFoundModal';

export default function ScanScreen() {
  const cameraRef = useRef(null);
  const user = useStore(s => s.user);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    if (scanning) return;
    setScanning(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true
      });

      const res = await identifyFace(photo.base64, user.id, user.id);
      setResult(res.data);

    } catch (err) {
      Alert.alert('Error', 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ marginBottom: 16 }}>Camera access needed</Text>
        <TouchableOpacity onPress={requestPermission}
          style={{ backgroundColor: '#2563EB', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: 'white' }}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">

        {/* Face oval guide */}
        <Svg style={StyleSheet.absoluteFill}>
          <Ellipse cx="50%" cy="42%" rx="120" ry="155"
            fill="transparent" stroke={scanning ? "#FFA500" : "#00FF00"}
            strokeWidth="3" strokeDasharray={scanning ? "0" : "10,5"} />
        </Svg>

        {/* Top label */}
        <View style={{ position: 'absolute', top: 60, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold',
            backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 }}>
            {scanning ? '🔍 Scanning...' : '👤 Center face in oval'}
          </Text>
        </View>

        {/* Scan button */}
        <View style={{ position: 'absolute', bottom: 60, width: '100%', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleScan} disabled={scanning}
            style={{ backgroundColor: scanning ? '#9CA3AF' : '#2563EB',
              paddingVertical: 18, paddingHorizontal: 60, borderRadius: 50 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
              {scanning ? 'Scanning...' : 'SCAN FACE'}
            </Text>
          </TouchableOpacity>
        </View>

      </CameraView>

      {/* Show result modal when scan completes */}
      {result && (
        <StudentFoundModal
          result={result}
          guardId={user.id}
          adminId={user.id}
          onClose={() => setResult(null)}
        />
      )}
    </View>
  );
}
```

✅ **Checkpoint:** Camera opens with green oval guide. Tapping SCAN sends photo to backend and gets result.

---

### STEP 26 — Build the Student Found Modal
> 🎨 **Reference design:** Open `mobile/designs/student-found-modal.png` in VS Code side-by-side while coding this screen.

**What you're doing:** The popup that appears after a successful scan, showing the student's details and the IN/OUT confirmation button.

Create `mobile/components/StudentFoundModal.jsx`:

```jsx
import { View, Text, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import { logAction } from '../services/api';

export default function StudentFoundModal({ result, guardId, adminId, onClose }) {

  const handleConfirm = async () => {
    if (!result.matched) return;

    await logAction(
      result.student.id,
      result.next_action,
      result.confidence,
      guardId
    );

    Alert.alert(
      result.next_action === 'OUT' ? '🔴 Marked OUT' : '🟢 Marked IN',
      `${result.student.name} marked ${result.next_action} at ${new Date().toLocaleTimeString()}`
    );
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={true}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24,
          borderTopRightRadius: 24, padding: 24 }}>

          {result.matched ? (
            <>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                {result.student.photo_url && (
                  <Image source={{ uri: result.student.photo_url }}
                    style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 12 }} />
                )}
                <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{result.student.name}</Text>
                <Text style={{ color: '#6B7280', marginTop: 4 }}>
                  {result.student.roll_number} · Room {result.student.room_number}
                </Text>
                <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 14,
                  paddingVertical: 6, borderRadius: 20, marginTop: 10 }}>
                  <Text style={{ color: '#1D4ED8', fontWeight: '600' }}>
                    Match Confidence: {result.confidence}%
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleConfirm}
                style={{ backgroundColor: result.next_action === 'OUT' ? '#DC2626' : '#16A34A',
                  padding: 18, borderRadius: 14, marginBottom: 12 }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>
                  {result.next_action === 'OUT' ? '🔴 CONFIRM OUT' : '🟢 CONFIRM IN'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 48 }}>⚠️</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>
                Unknown Person
              </Text>
              <Text style={{ color: '#6B7280', marginTop: 8 }}>
                {result.reason === 'NO_FACE_IN_FRAME'
                  ? 'No face detected. Try again.'
                  : 'This person is not registered.'}
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={onClose}
            style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text style={{ textAlign: 'center', color: '#6B7280', fontWeight: '600' }}>
              Cancel / Scan Again
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}
```

✅ **Checkpoint:** After scan, modal pops up from bottom with student name, room, confidence %. Red/green confirm button works. Log appears in Supabase.

---

### STEP 27 — Build the Recent Logs Screen
> 🎨 **Reference design:** Open `mobile/designs/recent-logs.png` in VS Code side-by-side while coding this screen.

**What you're doing:** A simple list showing the last 20 IN/OUT events at the gate.

Create `mobile/app/guard/recent-logs.jsx`:

```jsx
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { getRecentLogs } from '../../services/api';
import useStore from '../../store/useStore';

export default function RecentLogs() {
  const user = useStore(s => s.user);
  const [logs, setLogs] = useState([]);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    const res = await getRecentLogs(user.id);
    setLogs(res.data.logs);
  };

  const renderItem = ({ item }) => {
    const time = new Date(item.timestamp).toLocaleTimeString();
    const isOut = item.action === 'OUT';

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
        padding: 14, marginBottom: 8, borderRadius: 12 }}>
        <Text style={{ fontSize: 24, marginRight: 12 }}>{isOut ? '🔴' : '🟢'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.students?.name}</Text>
          <Text style={{ color: '#6b7280', fontSize: 13 }}>
            {item.students?.roll_number} · Room {item.students?.room_number}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontWeight: '600', color: isOut ? '#DC2626' : '#16A34A' }}>
            {item.action}
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Recent Logs</Text>
        <TouchableOpacity onPress={loadLogs}>
          <Text style={{ color: '#2563EB' }}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={logs} keyExtractor={i => i.id} renderItem={renderItem} />
    </View>
  );
}
```

✅ **Checkpoint:** Recent logs screen shows list of IN/OUT events with timestamps, matching the design mockup.

---

### STEP 28 — Connect Guard Tabs (Navigation)

**What you're doing:** Wiring both guard screens into a tab navigator.

Create `mobile/app/guard/_layout.jsx`:

```jsx
import { Tabs } from 'expo-router';

export default function GuardLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#DC2626' }}>
      <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: () => '📷' }} />
      <Tabs.Screen name="recent-logs" options={{ title: 'Logs', tabBarIcon: () => '📋' }} />
    </Tabs>
  );
}
```

✅ **Checkpoint:** Guard portal has 2 tabs — Scan and Logs. Full app navigation works end to end.

---

### STEP 29 — Full End-to-End Test

**What you're doing:** Testing the complete flow from registration to verification on the Android Emulator.

Run through this exact test sequence on your emulator:

```
TEST 1 — Full Admin Flow:
  ① Login as admin
  ② Register a new student (fill all fields)
  ③ Enroll face: capture 3 photos (your own face via emulator camera)
  ④ Check Student List → should show "Enrolled ✅"
  ⑤ Dashboard → Total should be 1, Enrolled should be 1

TEST 2 — Full Guard Flow:
  ① Logout, login as guard
  ② Tap SCAN → look at camera
  ③ Should identify you → shows your name + room
  ④ Tap CONFIRM OUT
  ⑤ Check Recent Logs → should show your name with OUT 🔴

TEST 3 — Repeat scan:
  ① Scan again
  ② Should show CONFIRM IN this time (auto-toggled)
  ③ Confirm IN → Recent Logs shows 🟢 IN

TEST 4 — Unknown person:
  ① Use a different photo not in the database
  ② Should show "Unknown Person ⚠️"

TEST 5 — Bad lighting:
  ① Try scanning with low emulator camera quality
  ② Scan should still work (may need lower tolerance)
```

> **Emulator camera tip:** Android Emulator has a virtual camera. Go to AVD Manager → Edit → Camera → set Front to "Emulated" or "Webcam" (uses your laptop webcam) for realistic face testing.

✅ **Checkpoint:** All 5 tests pass. App is working end to end.

---

## 🟪 BLOCK 6 — DEPLOY
### Steps 30 to 33 · Days 17–20

---

### STEP 30 — Deploy Backend to Railway.app

**What you're doing:** Putting your FastAPI server online so the mobile app can access it from anywhere.

```bash
# In backend folder, create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port $PORT" > Procfile

# Push to GitHub first
cd hostel-biometric
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/hostel-biometric.git
git push -u origin main
```

**On Railway.app:**

1. Click **New Project → Deploy from GitHub**
2. Select your repo → select the `backend` folder as root
3. Go to **Variables** tab → Add your `.env` variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SECRET_KEY`
4. Wait for deploy (2–3 minutes)
5. Click **Settings → Domains → Copy your URL** (e.g. `https://hostel-bio.up.railway.app`)

✅ **Checkpoint:** Opening `https://your-url.railway.app` in browser shows `{"status": "running ✅"}`

---

### STEP 31 — Update Mobile App to Use Live URL

**What you're doing:** Pointing the mobile app to the deployed backend instead of localhost.

In `mobile/services/api.js`:

```js
// Change this line:
const API_URL = 'http://YOUR_LOCAL_IP:8000';

// To this:
const API_URL = 'https://your-app-name.up.railway.app';
```

Rebuild and test on emulator:

```bash
cd mobile
npx expo run:android
# App now hits the live server — test login, register, scan
```

✅ **Checkpoint:** App works with live Railway backend. All features still functioning.

---

### STEP 32 — Generate APK for Download

**What you're doing:** Building a real `.apk` file someone can install on any Android phone to demo your project.

```bash
cd mobile

# Login to Expo account (create one free at expo.dev)
eas login

# Initialize EAS build config
eas build:configure

# Build APK (free, takes 10–15 mins on Expo's servers)
eas build -p android --profile preview

# When done, you'll get a download link like:
# https://expo.dev/artifacts/eas/xxxx.apk
```

Share that link with interviewers. They can install it directly on their Android phone.

✅ **Checkpoint:** You have a working `.apk` download link that anyone can install.

---

### STEP 33 — Write Your README (Important for Resume)

**What you're doing:** Writing a clear README that explains the project to interviewers on GitHub.

Create `hostel-biometric/README.md`:

```markdown
# 🏫 Hostel Biometric Outpass System

AI-powered face recognition app for automating hostel student entry/exit tracking.

## Demo APK
[Download and install on Android →](https://expo.dev/artifacts/eas/YOUR_LINK)

## What It Does
- Admin registers students and enrolls their face via mobile camera
- Guard scans a student's face at the hostel gate
- System identifies the student in <2 seconds and logs IN/OUT automatically
- Replaces manual paper sign-in registers used in college hostels

## Tech Stack
React Native (Expo) · FastAPI (Python) · face_recognition (dlib ResNet) · PostgreSQL (Supabase) · Railway.app

## How Face Recognition Works
1. Student's face is captured (3 photos at enrollment)
2. Each photo → 128-D embedding vector generated by dlib ResNet model
3. Embeddings stored in PostgreSQL as JSONB
4. At verification: live face → new embedding → cosine distance compared against all stored embeddings
5. Best match below tolerance threshold → student identified

## Running Locally
[... setup instructions ...]
```

✅ **Final Checkpoint:** GitHub repo has README with APK link. Project is live, testable, and presentable.

---

## 🎯 COMPLETE STEP SUMMARY

```
BLOCK 1 — SETUP (Steps 1–6)
  Step 1  → Install Node, Python, VS Code, Android Studio (for Emulator)
  Step 2  → Create folder structure
  Step 3  → Set up Python + install libraries
  Step 4  → Create Expo mobile app + run on Android Emulator
  Step 5  → Set up Supabase (DB + tables)
  Step 6  → Create Railway.app account

BLOCK 2 — BACKEND + AI (Steps 7–14)
  Step 7  → ⭐ Test face_recognition alone (MOST IMPORTANT)
  Step 8  → Write Supabase connection
  Step 9  → Write face_engine.py (AI core)
  Step 10 → Write auth routes
  Step 11 → Write student routes
  Step 12 → Write face routes (enroll + identify)
  Step 13 → Write outpass routes + main.py
  Step 14 → Test all endpoints at /docs

BLOCK 3 — DESIGN PHASE (Steps 15–17) ← NEW
  Step 15 → 🎨 Generate Claude Design prompts for all 8 screens
  Step 16 → 🎨 Create designs in Claude Design (user action)
  Step 17 → 🎨 Import and organize designs into project

BLOCK 4 — ADMIN PORTAL (Steps 18–24)
  Step 18 → Set up navigation + global store
  Step 19 → 🎨 Login screen (use login.png design)
  Step 20 → 🎨 Dashboard screen (use dashboard.png design)
  Step 21 → 🎨 Register student screen (use register-student.png design)
  Step 22 → 🎨 Face enrollment screen / camera (use face-enrollment.png design)
  Step 23 → 🎨 Student list screen (use student-list.png design)
  Step 24 → Connect admin tabs

BLOCK 5 — GUARD PORTAL (Steps 25–29)
  Step 25 → 🎨 Scan screen / live camera (use guard-scan.png design)
  Step 26 → 🎨 Student found modal (use student-found-modal.png design)
  Step 27 → 🎨 Recent logs screen (use recent-logs.png design)
  Step 28 → Connect guard tabs
  Step 29 → Full end-to-end test on emulator

BLOCK 6 — DEPLOY (Steps 30–33)
  Step 30 → Deploy backend to Railway.app
  Step 31 → Update app to use live URL + rebuild
  Step 32 → Generate APK with EAS Build
  Step 33 → Write README on GitHub

Total: 33 Steps · ~20 Days · $0 Cost · Resume-Ready
```
