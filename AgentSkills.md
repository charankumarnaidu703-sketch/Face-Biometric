# Agent Skills Mapping (AgentSkills.md)

This document lists the custom skills to be used throughout the **Hostel Biometric** project. It includes a Global Skills section and a Step-by-Step Skills section mapping each step in the master build plan to its required skills.

---

## 🌍 Global Skills
These skills represent domain-wide expertise that applies across the entire lifecycle of this project:

1. **`@python-pro`** (Category: Backend Software Engineering)
   * *Purpose*: Guide on writing clean, efficient, and production-ready Python 3.12+ code, using async/await patterns, standard packaging, and library imports.
2. **`@react-native-architecture`** (Category: Frontend UI/UX)
   * *Purpose*: Maintain high-quality structures for Expo and React Native, including folder organization, global state management, and offline support.
3. **`@postgres-best-practices`** (Category: Database Data Engineering)
   * *Purpose*: Provide guidance on writing optimal database queries, structuring table indexes, configuring authentication settings, and managing performance in PostgreSQL/Supabase.
4. **`@building-native-ui`** (Category: Frontend UI/UX)
   * *Purpose*: Serve as a reference guide for building responsive, premium UI components and navigation paths using Expo Router and Tailwind CSS (NativeWind).

---

## 🗺️ Step-by-Step Skills Map

Below is the mapping of all 33 steps from [hostel_biometric_build_plan_v2.md](file:///Users/charankumar/Documents/Personal-Projects/My%20Projects/Face%20Biometric/hostel_biometric_build_plan_v2.md) to their required skills:

### 🟦 BLOCK 1 — SETUP (Steps 1–6)
* **STEP 1 — Install Required Tools on Your Computer**
  * *Skills*: `@python-pro` (to verify version integrity), CLI tools
* **STEP 2 — Create the Project Folder Structure**
  * *Skills*: General utilities (file creation & scripting)
* **STEP 3 — Set Up Python Backend Environment**
  * *Skills*: `@python-pro` (virtual environments, requirements, `uv` if applicable)
* **STEP 4 — Set Up Expo Mobile App**
  * *Skills*: `@react-native-architecture`, `@building-native-ui` (Expo setup, camera/secure-store dependencies)
* **STEP 5 — Set Up Supabase (Free Database)**
  * *Skills*: `@postgres-best-practices` (SQL schema planning, user roles, relational table setup)
* **STEP 6 — Create a Railway.app Account (Free Hosting)**
  * *Skills*: DevOps general CLI setup

### 🟩 BLOCK 2 — BACKEND + AI ENGINE (Steps 7–14)
* **STEP 7 — Test the Face AI Library First**
  * *Skills*: `@python-pro` (interfacing with `face_recognition` library, image loading, numpy matrices)
* **STEP 8 — Write the Supabase Connection File**
  * *Skills*: `@python-fastapi-development`, `@postgres-best-practices`
* **STEP 9 — Write the Face Engine (Core AI File)**
  * *Skills*: `@python-pro` (Base64 decoding, face location algorithms, embedding calculations, distance/confidence scores)
* **STEP 10 — Write the Auth Routes**
  * *Skills*: `@fastapi-router-py`, `@python-fastapi-development` (JWT signing, login routes, response models)
* **STEP 11 — Write the Student Routes**
  * *Skills*: `@fastapi-router-py`, `@python-fastapi-development` (students CRUD endpoints)
* **STEP 12 — Write the Face Routes**
  * *Skills*: `@fastapi-router-py`, `@python-fastapi-development` (embedding enrollments, live identify, logs posting)
* **STEP 13 — Write the Outpass Routes + main.py**
  * *Skills*: `@fastapi-router-py`, `@python-fastapi-development` (currently-out logic, log counts, main FastAPI app assembly, CORS setup)
* **STEP 14 — Start the Backend and Test All Endpoints**
  * *Skills*: `@fastapi-pro`, `@python-fastapi-development` (Swagger test scripts, endpoint request-response audits)

### 🎨 BLOCK 3 — DESIGN PHASE (Steps 15–17)
* **STEP 15 — Generate Claude Design Prompts for All 8 Screens**
  * *Skills*: `@building-native-ui` (UI design definitions, style guides)
* **STEP 16 — Create Screen Designs in Claude Design**
  * *Skills*: *(User Action)* Supported by `@building-native-ui`
* **STEP 17 — Import and Organize Designs into Project**
  * *Skills*: `@react-native-architecture`, `@building-native-ui`

### 🟨 BLOCK 4 — ADMIN APP (Steps 18–24)
* **STEP 18 — Set Up Navigation and Global State**
  * *Skills*: `@react-native-architecture` (Zustand state store, Navigation stack structure)
* **STEP 19 — Build the Login Screen**
  * *Skills*: `@building-native-ui`, `@react-native-architecture` (forms validation, API integration)
* **STEP 20 — Build the Admin Dashboard Screen**
  * *Skills*: `@building-native-ui` (stat cards grid, dashboard widgets)
* **STEP 21 — Build the Register Student Screen**
  * *Skills*: `@building-native-ui` (profile forms, inputs)
* **STEP 22 — Build the Face Enrollment Screen**
  * *Skills*: `@react-native-architecture`, `@building-native-ui` (Expo Camera, base64 capture, sending photo payload)
* **STEP 23 — Build the Student List Screen**
  * *Skills*: `@building-native-ui` (search filter lists, detail cards)
* **STEP 24 — Connect Admin Tabs (Navigation)**
  * *Skills*: `@react-native-architecture`, `@building-native-ui` (tab navigation)

### 🟧 BLOCK 5 — GUARD APP (Steps 25–29)
* **STEP 25 — Build the Scan Screen (Core Guard Screen)**
  * *Skills*: `@react-native-architecture`, `@building-native-ui` (Camera frame captures, scanning interval timers, post to identity API)
* **STEP 26 — Build the Student Found Modal**
  * *Skills*: `@building-native-ui` (interactive overlays, modals, match confirmation logic)
* **STEP 27 — Build the Recent Logs Screen**
  * *Skills*: `@building-native-ui` (scrolling list of recent outpasses)
* **STEP 28 — Connect Guard Tabs (Navigation)**
  * *Skills*: `@react-native-architecture`, `@building-native-ui` (tab navigation integration)
* **STEP 29 — Full End-to-End Test**
  * *Skills*: `@react-native-architecture`, `@python-pro` (integration debugging)

### 🚀 BLOCK 6 — DEPLOY & FINALIZE (Steps 30–33)
* **STEP 30 — Deploy Backend to Railway.app**
  * *Skills*: `@production-audit` (GCP/Cloud production check, Railway deployment config, environment variables sync)
* **STEP 31 — Update Mobile App to Use Live URL**
  * *Skills*: `@react-native-architecture` (config management)
* **STEP 32 — Generate APK for Download**
  * *Skills*: `@react-native-architecture` (EAS build, credential profiles setup)
* **STEP 33 — Write Your README**
  * *Skills*: General utilities (documentation templates)
