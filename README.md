# Hostel Biometric Security & Outpass System

A high-performance biometric security and digital outpass management system designed for student hostels. Uses **1:N facial recognition** to automate student check-ins and check-outs at the gates.

---

## 📱 Project Overview

The system consists of three main components:
1. **Python FastAPI Backend**: Integrates a C++ based face recognition engine, generates JWT tokens, and writes outpass check-in/check-out logs.
2. **Supabase PostgreSQL Database**: Houses student profiles, encrypted auth credentials, facial embeddings (128-D vectors), and outpass transaction logs.
3. **React Native Mobile App**: A unified application featuring:
   - **Admin Portal**: Dashboard metrics, new student registration form, 3-angle biometric face enrollment, and student roster list.
   - **Guard Portal**: Full-screen front-facing scanner camera with elliptical face centering guide and real-time activity ledger.

---

## 🛠️ Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app configuration & CORS
│   ├── requirements.txt      # Python dependencies (dlib, face-recognition, supabase)
│   ├── Dockerfile            # Container config for Render deployment
│   ├── routes/               # FastAPI routers (auth, students, face, outpass)
│   └── services/             # Supabase client & C++ Face Recognition engine
└── mobile/
    ├── App.js                # React Navigation stack registry
    ├── package.json          # React Native dependencies
    ├── store/                # Zustand global auth session store
    ├── services/             # Axios API network bindings client
    └── screens/              # UI screens & Bottom Tab Navigators
```

---

## 🚀 Backend Deployment (Render.app)

Deploy the backend to Render's free tier using the included `Dockerfile` configuration:

1. Create a free account on **[Render.com](https://render.com)**.
2. Click **New + → Web Service**.
3. Link your GitHub account and select this repository.
4. Set the configuration parameters:
   - **Name**: `hostel-biometric-backend`
   - **Root Directory**: `backend`
   - **Language**: `Docker`
   - **Instance Type**: `Free`
5. Click **Advanced** and add the following **Environment Variables**:
   - `SUPABASE_URL`: Your Supabase project URL (e.g. `https://your-project.supabase.co`)
   - `SUPABASE_KEY`: Your Supabase Service Role API key
   - `SECRET_KEY`: A secure string for generating JWT tokens
6. Click **Create Web Service**. 

Once the deploy completes, copy your live Web Service URL (e.g. `https://hostel-biometric-backend.onrender.com`).

---

## 📱 Mobile App Setup & Connection

Configure the React Native app to point to your live backend URL:

1. Open `mobile/services/api.js`.
2. Update the `API_URL` variable to point to your live Render backend URL:
   ```javascript
   export const API_URL = 'https://your-render-url.onrender.com';
   ```
3. Navigate to the `mobile/` directory:
   ```bash
   cd mobile
   ```
4. Install npm dependencies:
   ```bash
   npm install
   ```
5. Start the Expo development server:
   ```bash
   npx expo start
   ```
6. Scan the QR code shown in the terminal using the Expo Go app on your physical iOS or Android device.

---

## 📝 User Flows & How to Use

### 1. Hostel Administrator Flow
- **Login**: Enter an admin email (e.g. `test_admin@college.edu`) to log in.
- **Register Student**: Fill out student details (Name, Roll Number, Room Number, Parent Phone, and Year of Study). Click register to submit.
- **Biometric Face Enrollment**: The app redirects to the camera view. Ask the student to center their face in the oval guide:
  - Phase 1: Look straight at the camera.
  - Phase 2: Turn slightly to the left.
  - Phase 3: Turn slightly to the right.
  - *The app encodes the captured frames to Base64 and uploads them to the server to save the 128-D face embeddings.*
- **Dashboard & Roster**: View metrics (total students, checked out count) and search the student directory to target students with pending enrollment.

### 2. Main Gate Guard Flow
- **Login**: Enter a guard email to log in.
- **Scan Face**: Center the incoming/outgoing student's face in the camera oval. Tap **SCAN FACE**.
- **Log Verification**: The app displays the identified student's name, room, and a match confidence percentage:
  - If they are currently inside, the button updates to **CONFIRM CHECK-OUT** (Mark Exit).
  - If they are currently outside, the button updates to **CONFIRM CHECK-IN** (Mark Entry).
  - *Tap the confirmation button to record the transaction.*
- **Activity Logs Feed**: Switch to the **Logs** tab to view a running feed of recent check-ins and check-outs grouped by date.

---

## 💾 Supabase Database Setup

To manually recreate the database tables, run the following SQL queries in your Supabase SQL Editor:

```sql
-- 1. Users Table (Hostel staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'guard')) NOT NULL,
    college_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Students Table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    roll_number TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    year INTEGER NOT NULL,
    room_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_enrolled BOOLEAN DEFAULT false NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Face Embeddings Table
CREATE TABLE face_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    embedding double precision[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Outpass Logs Table
CREATE TABLE outpass_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    action TEXT CHECK (action IN ('IN', 'OUT')) NOT NULL,
    confidence double precision NOT NULL,
    logged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    gate TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```
