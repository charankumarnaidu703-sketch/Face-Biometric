# Student Learning Notes

Welcome to the **Hostel Biometric** learning log! This document will help you understand the core concepts, implementation details, best practices, and common mistakes to avoid for each step of the build process.

---

## Project Foundations & Initial Setup

### Core Architectural Decisions
* **FastAPI Backend**: Chosen for high performance, native support for async/await, and automatic OpenAPI/Swagger documentation.
* **face_recognition Library**: Uses dlib's state-of-the-art face recognition built with deep learning. It has an accuracy of 99.38% on the Labeled Faces in the Wild benchmark.
* **React Native (Expo)**: Allows building cross-platform native mobile applications in JavaScript/TypeScript. We target the Android Emulator directly rather than Expo Go to ensure support for advanced native features (e.g., Camera, SecureStore, FileSystem) and smooth integration.
* **Supabase**: A modern, free, open-source Firebase alternative based on PostgreSQL. PostgreSQL allows us to store student profiles, logs, and high-dimensional vector embeddings (stored as JSONB or via `pgvector` in postgres).

---

## Step-by-Step Learning Log

### Step 1: Tool Verification and CLI Setup
* **What was done**: Verified system environments for Node.js (v26.3.0) and Python (v3.14.4). Inspected local Android SDK paths (`~/Library/Android/sdk`) and verified `eas-cli` runs via `npx`.
* **Why**: To establish a solid development foundation. Verifying local configuration before coding prevents obscure toolchain errors during compilation, backend testing, or mobile emulator boot.
* **Concepts Used**:
  * *Global vs. Local Execution (`npx`)*: By running `npx eas-cli` rather than global installation (`npm install -g`), we execute the command dynamically. This keeps global package lists clean and avoids permissions errors when executing outside our home directory or in restricted developer sandboxes.
  * *Android SDK Pathing*: The compiler needs to find system images and build tools. On macOS, this is typically at `/Users/<username>/Library/Android/sdk`.
* **Best Practices**:
  * Always double-check node and python versions before installing heavy dependencies.
  * Avoid global packages (`-g`) where possible, relying instead on `npx` or local project dependencies (`devDependencies` in `package.json`).
* **Common Mistakes to Avoid**:
  * Running global installations using `sudo npm install -g`. This can corrupt directory ownership permissions and lead to build failures later.

### Step 2: Project Folder Structure & Architecture Design
* **What was done**: Created directories `backend` and `mobile` in the workspace root. Structured the backend with subdirectories `routes/`, `services/`, and `models/`, and created the initial files (e.g., `main.py`, `.env`, `requirements.txt`, route controllers, face engine, database client, and schemas).
* **Why**: Establishing a modular folder layout at the start enforces the design pattern of **Separation of Concerns (SoC)**. It ensures that data validation, API endpoints, and core business logic reside in isolated modules.
* **Concepts Used**:
  * *Separation of Concerns (SoC)*: Dividing a program into distinct sections, where each section addresses a separate concern (e.g., `routes/` for API ingress/egress, `services/` for computation, `models/` for database data structures).
  * *Modular Python Imports*: In Python, dividing your codebase into folders with separate modules allows clean importing like `from services.face_engine import identify_student`.
* **Best Practices**:
  * Keep `main.py` clean; its only job should be bootstrapping the app, middleware registration, and mounting routers.
  * Structure route modules logically based on entities (e.g., `auth.py`, `students.py`, `face.py`, `outpass.py`).
* **Common Mistakes to Avoid**:
  * Building a monolithic file (putting everything in `main.py`). This leads to merge conflicts, poor readability, and hard-to-test code.
  * Creating overly-nested directory layouts (e.g. `src/app/core/modules/v1/...`) for small to medium scale applications, which unnecessarily complicates Python search paths (`sys.path`).

### Step 3: Python Environment & Dependency Isolation
* **What was done**: Set up a Python virtual environment (`venv`) inside the backend folder and installed the necessary FastAPI, face recognition, and database packages. Diagnosed and fixed a version conflict where `face_recognition` models could not be loaded on Python 3.14 due to the removal of `pkg_resources` in modern `setuptools` (v70+), which was resolved by locking `setuptools<70`. Frozen the final package list to `requirements.txt`.
* **Why**: Isolated environments prevent "dependency hell" (conflicting dependencies across different projects on the same machine). Version locking ensures the code runs identical in production (e.g., on Railway.app) as it does locally.
* **Concepts Used**:
  * *Virtual Environments (`venv`)*: Isolated runtime environments containing a dedicated Python executable, pip utility, and local site-packages.
  * *`pkg_resources` Deprecation & Removal*: The `pkg_resources` module in `setuptools` was historically used to extract resource files from packages. In newer Python releases (Python 3.12+), it is deprecated, and setuptools v70+ removed it, requiring downgrade workarounds for legacy packages.
* **Best Practices**:
  * Always activate the virtual environment or run pip/python using the explicit relative path (`venv/bin/pip` or `venv/bin/python3`) to avoid installing packages globally.
  * Keep `requirements.txt` updated by running a `pip freeze` after any successful package installation.
* **Common Mistakes to Avoid**:
  * Running `pip install` without virtual environments active, which pollutes system-wide packages.
  * Ignoring deprecation warnings on crucial infrastructure packages, which can result in unexpected failures during production deployments.

### Step 4: Expo App Initialization & Native Modules Setup
* **What was done**: Initialized a React Native app under `/mobile` using the `create-expo-app` utility. Installed Expo native libraries (`expo-camera`, `expo-secure-store`, `expo-image-picker`, `expo-file-system`, `react-native-screens`, `react-native-safe-area-context`) and client libraries (`axios`, `zustand`, `nativewind`, `@react-navigation`).
* **Why**: Expo provides a high-level SDK wrapping native Android/iOS APIs (such as the camera or keychain storage) into Javascript APIs. This allows us to write a cross-platform mobile application without writing Java or Swift.
* **Concepts Used**:
  * *Expo SDK Compatibility*: Expo coordinates releases of packages (camera, storage, etc.) that are thoroughly tested for specific SDK versions (e.g., SDK 57).
  * *`npx expo install`*: A CLI command that checks your project's Expo SDK version and installs the exact compatible version of the native packages, rather than downloading the bleeding-edge npm versions which might crash compilation.
  * *NativeWind (Tailwind)*: Translates standard CSS-like Tailwind utility classes into React Native `StyleSheet` objects, enabling rapid, modern UI building.
* **Best Practices**:
  * Always use `npx expo install` instead of `npm install` for packages starting with `expo-*` or packages that link to native platforms (like `react-native-screens`).
  * Use lightweight state managers like Zustand for clear state flow instead of complex Redux structures in smaller mobile apps.
* **Common Mistakes to Avoid**:
  * Using standard `npm install expo-camera`. This can fetch incompatible packages that result in native Android build failures (e.g., mismatching Gradle dependencies).

### Step 5: Supabase Cloud Database & Relational Schema Design
* **What was done**: Created a new healthy Supabase project and applied database DDL migrations via Supabase MCP to set up four tables: `users`, `students`, `face_embeddings`, and `outpass_logs`. Wrote the project URL and API key credentials to `backend/.env`.
* **Why**: Relational databases (PostgreSQL) provide strong transactional guarantees and referential integrity (ensuring a log or face embedding always points to a valid student). Using `.env` environment configuration prevents committing sensitive database credentials into version control.
* **Concepts Used**:
  * *UUID (Universally Unique Identifier)*: 128-bit keys generated mathematically. They prevent ID predictability (improving security) and make syncing multiple databases easier.
  * *`JSONB` for Embeddings*: Storing the 128-dimensional floating-point face vector inside a binary-format JSON column. This allows storing variable-length floating-point arrays directly in standard PostgreSQL databases without specialized vector extensions.
  * *Foreign Key Constraints & Cascade*: Defining relationships between tables (e.g., `student_id REFERENCES students(id) ON DELETE CASCADE`). If a student record is deleted, their sensitive biometric embeddings are deleted automatically.
* **Best Practices**:
  * Implement strict `CHECK` constraints on state columns (e.g. `CHECK (role IN ('admin', 'guard'))`) to enforce data consistency.
  * Always add `.env` to your `.gitignore` file to ensure secrets are never leaked on GitHub.
* **Common Mistakes to Avoid**:
  * Storing numeric arrays as plain strings (e.g., `"[0.12, -0.05, ...]"`). This requires parsing string tokens inside Python, which slows down matching algorithms.
  * Leaving foreign keys unconstrained or failing to define cascade delete rules, leading to database pollution with orphaned records.

### Step 6: Cloud Hosting Platform Setup (Railway.app)
* **What was done**: Set up a Railway.app account for cloud hosting of the FastAPI backend.
* **Why**: To expose the local API endpoint to a public URL. A public URL is required so the mobile application (running on a physical phone or separate network) can talk to the backend face-recognition engine.
* **Concepts Used**:
  * *PaaS (Platform-as-a-Service)*: Development and deployment environment in the cloud that allows deploying web apps, APIs, and databases without configuring physical server machines.
  * *Serverless Containers*: Railway runs your application within an isolated container that automatically handles routing, SSL termination (HTTPS), and port mapping.
* **Best Practices**:
  * Keep your local `.env` values organized; you will need to add these identical keys (e.g. `SUPABASE_URL`, `SUPABASE_KEY`) inside the Railway dashboard variables tab when we deploy.
* **Common Mistakes to Avoid**:
  * Committing `.env` secret keys directly to git to trigger deployments. Always use the hosting provider's secure Environment Variables dashboard to inject keys at runtime.

### Step 7: Face Recognition Proof-of-Concept & Embedding Science
* **What was done**: Created `test_face.py` — a standalone script that loads two photos, extracts face embeddings, and compares them. Ran two tests: a **positive match** (same person, two photos → `True` at 65.43% confidence) and a **negative match** (different person → `False` at 15.98% confidence).
* **Why**: Before building an entire API and mobile app, you must first prove the core AI actually works on your machine. This is called a **Proof of Concept (PoC)**. If this step fails, everything built on top would be wasted.
* **Concepts Used**:
  * *Face Embeddings (128-d Vectors)*: The `face_recognition` library uses a pre-trained deep neural network (dlib's ResNet model) to convert any human face photo into a list of 128 floating-point numbers. This 128-number vector is a mathematical "fingerprint" of that face.
  * *Euclidean Distance*: To compare two faces, the library calculates the **Euclidean distance** between their 128-d vectors. If the distance is small (< 0.5 by default), the faces are considered the same person.
  * *Tolerance Threshold*: The `tolerance=0.5` parameter controls strictness. Lower values (e.g. 0.4) are stricter and reduce false positives but may reject valid matches. Higher values (e.g. 0.6) are more lenient.
  * *Confidence Score*: Calculated as `(1 - distance) × 100`. A higher percentage means a closer match.
* **How the Implementation Works**:
  1. `face_recognition.load_image_file("photo.jpg")` → loads the image as a numpy array.
  2. `face_recognition.face_encodings(image)` → detects face locations using HOG (Histogram of Oriented Gradients), then passes each detected face through the neural network to produce the 128-d embedding vector.
  3. `face_recognition.compare_faces([known], unknown)` → computes euclidean distance and returns `True`/`False` based on the tolerance.
* **Best Practices**:
  * Always test with **both positive and negative cases**. A system that says "match" to every pair of faces is useless.
  * Use well-lit, frontal photos for best accuracy. The library's HOG detector struggles with extreme angles, heavy shadows, or tiny face regions.
* **Common Mistakes to Avoid**:
  * Skipping the PoC and jumping straight to API code. If `dlib` or `face_recognition` has installation issues, you'll discover them after hours of wasted work.
  * Using a tolerance that's too high (e.g. 0.7+), which would match unrelated people and create false identity confirmations — a security disaster in a biometric system.

### Step 8: Supabase Client Singleton & Environment Configuration
* **What was done**: Created `backend/services/supabase_client.py` — a module that reads database credentials from `.env` and creates a single, reusable Supabase client object. Verified the connection prints "Supabase connected ✅".
* **Why**: Every route and service in the backend needs to talk to the database. Instead of creating a new connection in every file, we create **one shared client object** (a Singleton) and import it everywhere. This keeps the code DRY (Don't Repeat Yourself) and ensures all database calls go through the same authenticated client.
* **Concepts Used**:
  * *Singleton Pattern*: Creating a single instance of the Supabase client at module-load time. When Python imports a module, it executes the top-level code only once and caches the result. Every subsequent `from services.supabase_client import supabase` reuses the same object.
  * *`python-dotenv` / `load_dotenv()`*: Reads key-value pairs from the `.env` file and injects them into the process's environment variables (`os.environ`). This keeps secrets out of your source code.
  * *`os.getenv()`*: Retrieves environment variable values at runtime. If the key doesn't exist, it returns `None` (avoiding crashes).
* **How the Implementation Works**:
  1. `load_dotenv()` reads `backend/.env` and loads `SUPABASE_URL` and `SUPABASE_KEY` into the process environment.
  2. `create_client(url, key)` initializes the Supabase Python SDK with the PostgREST API URL and an authenticated JWT anon key.
  3. The `supabase` variable is now a live client that can call `.table("students").select("*").execute()` etc.
* **Best Practices**:
  * Always keep the client in a separate `services/` file, not inside route handlers. This makes testing easier (you can mock the client in tests).
  * Use type hints (`supabase: Client`) for IDE autocompletion and type safety.
* **Common Mistakes to Avoid**:
  * Calling `create_client()` inside every request handler. This creates a new HTTP session for each API call, wasting memory and slowing response times.
  * Hardcoding the URL and key directly in the Python file instead of using `.env`. This leaks credentials if the code is ever pushed to GitHub.

### Step 9: Face Engine — The Core AI Module
* **What was done**: Created `backend/services/face_engine.py` with three functions: `decode_image()`, `extract_embedding()`, and `identify_student()`. Enhanced the build plan's baseline with image size validation, structured error codes, logging, and a minimum confidence safety net.
* **Why**: This is the **brain** of the entire application. Every face-related API route will call these functions. By isolating the AI logic in a single module, the route handlers stay clean and focused on HTTP concerns (request parsing, response formatting), while the engine handles the heavy computation.
* **Concepts Used**:
  * *Base64 Encoding*: The mobile camera captures photos as binary data. To send binary over HTTP JSON, it's encoded as a Base64 string (text representation of bytes). The engine decodes this back to raw bytes, then opens it as a PIL Image.
  * *Data URI Prefix Stripping*: React Native cameras sometimes prepend `data:image/jpeg;base64,` before the actual base64 data. The engine splits on `,` and takes only the payload portion.
  * *HOG (Histogram of Oriented Gradients)*: The `face_recognition.face_locations()` function uses HOG — a classic computer vision algorithm that detects face-like gradient patterns in an image. It's fast but works best on frontal, well-lit faces.
  * *1:N Identification*: Unlike 1:1 verification (comparing two specific faces), identification compares one query face against N stored embeddings to find the best match. This is what security guards use — "who is this person?"
  * *Argmin Selection*: When comparing against N faces, we compute N distances and use `np.argmin()` to find the index of the smallest distance (closest match).
* **Improvements Over Build Plan**:
  * **Image size guards**: Reject images > 10 MB or > 4096px to prevent server slowdowns from oversized uploads.
  * **Structured error codes**: Every failure returns a machine-readable code (`NO_FACE_DETECTED`, `MULTIPLE_FACES_DETECTED`, `INVALID_IMAGE`, etc.) that the mobile app can use to show user-friendly error messages.
  * **MIN_CONFIDENCE_PERCENT (40%)**: Even if a match passes the distance tolerance, we reject it if confidence is below 40% — an extra safety layer against false positives.
  * **Python logging**: All operations are logged for debugging in production.
* **Best Practices**:
  * Keep AI logic separate from HTTP routes. This makes unit testing trivial — you can test `extract_embedding()` with a test image without spinning up a web server.
  * Always validate input (size, format) before passing to expensive computation (face detection takes ~200ms per image).
* **Common Mistakes to Avoid**:
  * Not handling the case where `face_encodings()` returns an empty list (no face found). This causes an `IndexError` crash if you blindly access `[0]`.
  * Accepting arbitrarily large images from untrusted mobile clients. A 50 MB image could freeze the server for 30+ seconds during face detection.

### Step 10: Auth Routes — JWT Authentication & FastAPI Dependencies
* **What was done**: Created `backend/routes/auth.py` with a `POST /auth/login` endpoint, Pydantic request/response models, a `create_token()` helper, a `verify_token()` helper, and a reusable `get_current_user()` dependency.
* **Why**: The mobile app needs to know *who* is making requests. A guard shouldn't be able to register students (admin-only), and an unauthenticated user shouldn't access any API. JWT tokens solve this by encoding the user's identity and role into a signed, tamper-proof string.
* **Concepts Used**:
  * *JWT (JSON Web Token)*: A compact, URL-safe token format. It has three parts separated by dots: `header.payload.signature`. The payload contains claims like `sub` (user ID), `role`, and `exp` (expiry). The server signs it with a secret key — if anyone tampers with the payload, the signature check fails.
  * *Bearer Token Flow*: After login, the client stores the JWT. On every API request, it sends `Authorization: Bearer <token>` in the HTTP header. The server validates the token before processing the request.
  * *FastAPI Dependency Injection*: The `get_current_user()` function is a *dependency* — a reusable function that FastAPI automatically calls before your route handler. Any route that adds `user=Depends(get_current_user)` will require a valid JWT, and FastAPI handles the 401 error automatically.
  * *Pydantic Models*: `LoginRequest` and `LoginResponse` define the exact shape of request/response data. FastAPI auto-validates incoming JSON against these models and returns clear 422 errors if fields are missing or wrong types.
  * *HTTPBearer Security Scheme*: Adds a 🔒 lock icon in Swagger UI (`/docs`) so you can test protected routes by entering your JWT token.
* **Improvements Over Build Plan**:
  * **Timezone-aware JWT**: Uses `datetime.now(timezone.utc)` instead of deprecated `datetime.utcnow()`.
  * **Reusable `get_current_user` dependency**: Other routes can just add `user=Depends(get_current_user)` to require auth.
  * **Pydantic models**: Request validation is automatic — no manual `payload.get()` with missing key risks.
* **Best Practices**:
  * Always set a reasonable `exp` claim (we use 7 days). Tokens without expiry are a security risk.
  * Keep the `SECRET_KEY` in `.env`, never hardcode it. If leaked, attackers can forge valid tokens.
  * Not catching `JWTError` when decoding tokens. An expired or malformed token will crash the server if unhandled.

### Step 11: Student Administration Routes & Access Controls
* **What was done**: Created `backend/routes/students.py` handling registration, listing, detail retrieval, and student check-in status. Added authentication protection to all routes and role authorization to the registration route.
* **Why**: Student demographic data is sensitive, so all routes are secured by JWT token inspection. Restricting registration to admins ensures guards cannot register random profiles. Checking for existing roll numbers prevents database identity conflicts.
* **Concepts Used**:
  * *FastAPI Dependency Authentication*: Passing `Depends(get_current_user)` to endpoints. If a client attempts to fetch the list or check-in status without a valid JWT token in the Authorization header, FastAPI rejects the request with a `401 Unauthorized` before executing any database query.
  * *Role-Based Access Control (RBAC)*: Looking up the user profile (`current_user.get("role")`) inside the route logic and raising a `403 Forbidden` if they lack the required permissions (e.g., a guard attempting to post to `/register`).
  * *Data Normalization*: Cleaning inputs (e.g., stripping extra spaces, converting roll numbers to `.upper()`) before database queries or inserts. This ensures search queries match consistently regardless of user input format.
* **Best Practices**:
  * Clean and normalize data before saving (e.g., `payload.roll_number.strip().upper()`).
  * Always return structured JSON responses, even for database errors, using `HTTPException` with appropriate status codes (400 for bad input, 403 for unauthorized action, 404 for missing resource).
* **Common Mistakes to Avoid**:
  * Forgetting to protect read endpoints (`/list` or `/{student_id}`), which would allow anonymous users to crawl and download your student roster.

### Step 12: Biometric Face Routes & Transaction Confirmation Flows
* **What was done**: Created `backend/routes/face.py` containing three core endpoints: `/enroll` (admin only), `/identify` (running 1:N recognition against scoped student embeddings), and `/log-action` (writing guard-confirmed outpass transactions to Supabase).
* **Why**: Biometric scanning should not write transactions directly to the database upon matching. Instead, it follows a **two-phase verification** pattern:
  1. *Phase 1 (Identify)*: Find the closest matching profile, return the student details and *predict* the next action (toggling their state from IN to OUT, or OUT to IN).
  2. *Phase 2 (Log Action)*: Show a confirmation modal to the guard. Only when the guard verifies the student matches the photo and clicks "Confirm" does the client POST to `/log-action` to commit the transaction. This prevents false positive check-ins.
* **Concepts Used**:
  * *PostgREST Inner Joins*: Querying face embeddings with a filter on a related table: `supabase.table("face_embeddings").select("..., students!inner(user_id)").eq("students.user_id", admin_id)`. This scopes the 1:N facial search space *only* to students belonging to that specific admin/college. This is crucial for matching accuracy (a smaller database of faces has fewer collision risks) and performance.
  * *State Toggle Prediction*: Fetching the student's last check-in log, checking the `action` ("IN" or "OUT"), and proposing the opposite value as the `next_action`. If no previous logs exist, we default to "OUT" (assuming the student starts inside the campus).
  * *Regex Pattern Constraints*: Restricting fields using regular expressions, such as `pattern="^(IN|OUT|in|out)$"`, ensuring that invalid actions (like "EXIT") are rejected at the API border.
* **Best Practices**:
  * Check that the parent record (the student) exists before adding dependent child rows (face embeddings).
  * Scope searches by user/admin bounds to guarantee scalability. Comparing a face against 100,000 national records is slow and inaccurate; comparing against 1,000 hostel records is instant and highly accurate.
* **Common Mistakes to Avoid**:
  * In Pydantic v2, `regex` has been removed from `Field()`. You must use `pattern` instead (e.g. `Field(..., pattern="...")`), otherwise it raises a `PydanticUserError`.
  * Loading all face embeddings in memory and filtering them using Python. Always let the database engine filter on the joined keys before returning data.

### Step 13: Outpass Tracking Optimization & CORS API Assembly
* **What was done**: Created `backend/routes/outpass.py` for outpass analytics and initialized the main entrypoint file `backend/main.py`. Added `backend/routes/__init__.py` to create a standard Python package.
* **Why**: Dashboards need to display student statistics (like who is currently checked out) efficiently. Avoiding looping database calls (the N+1 query problem) prevents server and database performance degradation. Setting up CORS in `main.py` ensures the API accepts requests from the mobile application running on physical devices or local emulators.
* **Concepts Used**:
  * *N+1 Query Problem*: A common performance antipattern where an application executes 1 query to fetch a list of parent records (e.g., N students), and then executes N subsequent queries (1 query per student) to fetch child records (their latest log). As N grows, this wastes database connection pools.
  * *O(N) Single-Pass Deduplication*: By fetching the entire list of students and the entire list of outpass logs under this admin in exactly 2 queries, we can construct the student's status map in memory. The first time we observe a student's ID in the logs (since they are ordered descending by time), that log represents their current status.
  * *CORS (Cross-Origin Resource Sharing)*: A security mechanism that uses HTTP headers to tell browsers/clients running at one origin (e.g., mobile port, localhost) whether they are permitted to access resources from a server running at a different origin (our FastAPI port).
  * *FastAPI Router Mounting*: Including child routers (`auth.router`, `students.router`, etc.) under a parent `/api` prefix in `main.py`. This isolates HTTP routing configuration from actual handler files.
* **Best Practices**:
  * Avoid running database requests inside loops. Fetch collections in bulk (e.g., using `in_` list queries or joint sweeps) and group them programmatically.
  * Always implement a simple health check endpoint (e.g., `GET /`) to quickly verify the web server is running and responsive.
* **Common Mistakes to Avoid**:
  * Forgetting to set up CORS configuration. This is one of the most common causes of mobile app network failures, where requests work in Postman/curl but are blocked on physical mobile devices.
  * Forgetting to touch `__init__.py` in custom modules folders. Modern Python can sometimes resolve imports, but older environments or bundlers might fail to resolve paths without standard package declarations.

### Step 14: Automated API Integration Testing & Server Lifecycle
* **What was done**: Created `backend/test_api.py` — an automated end-to-end integration test script using Python's built-in `urllib` module. It starts a FastAPI server process in the background, seeds a test user, and runs a comprehensive test suite covering auth, registration, enrollment, positive identification, negative identification, logging, and metrics.
* **Why**: End-to-end testing proves that all components (routing, serialization, database schemas, and AI models) are correctly wired and work together. Automating this eliminates the need for manual testing via Swagger UI/Postman on every backend update.
* **Concepts Used**:
  * *Integration Testing*: Testing the system as a whole (client-server-database lifecycle) rather than testing isolated units of code.
  * *`multiprocessing.Process`*: Running the FastAPI web server (`uvicorn.run`) in a separate operating system process, allowing the main script to send HTTP requests to it concurrently and terminate it cleanly when tests complete.
  * *Dynamic Test Data*: Generating unique student roll numbers at runtime (using `time.time()`) to prevent tests from failing on subsequent runs due to database UNIQUE/Primary Key constraints.
* **Best Practices**:
  * Minimize testing dependencies. Using standard library packages like `urllib.request` makes the test runner portable, ensuring it runs on any machine without needing extra `pip install` commands.
  * Always test both success and failure cases (e.g., verifying a different face returns `matched: False`).
  * Not stopping background processes on script exit, which leaves orphaned uvicorn servers bound to port 8000.
  * Seeding static test data in databases. If a test profile is hardcoded, running the tests twice will cause database insertion constraint errors.

### Step 15: Frontend Design Prompt Optimization & The RSCIT Framework
* **What was done**: Created `frontend design prompts.md` containing highly structured and optimized prompts for all 8 application screens. Used the **RSCIT** prompt engineering model to ensure high-fidelity layout outputs from UI generators like Claude Design.
* **Why**: Paste-ready prompts need precise boundaries. If a prompt is vague, the AI generator might produce desktop layouts, inconsistent color palettes, or generic styling. Explicitly defining roles, constraints (viewport dimensions, precise HSL hex codes), structure, and target formats guarantees a cohesive, unified visual aesthetic across all screens.
* **Concepts Used**:
  * *RSCIT Prompt Framework*:
    - **Role**: Assigns a persona (e.g., "principal mobile UI designer") which adjusts the model's vocabulary and attention to detail.
    - **Situation**: Contextualizes the app's purpose (hostel gatekeeper biometrics).
    - **Constraints**: Enforces structural limits (mobile 375px viewports, tap-friendly 48px+ targets, flat design rules).
    - **Instructions**: A detailed top-to-bottom stack layout mapping headers, inputs, and footers.
    - **Template**: Demands code outputs matching modern component frameworks (e.g., React + Tailwind CSS).
  * *Design Tokens*: Centralizing visual variables like primary colors (Deep Blue `#2563EB`), success states (Emerald `#10B981`), and soft shadows before writing any screen code.
* **Best Practices**:
  * Avoid descriptive adjectives like "beautiful" or "modern" without defining them. Instead, specify concrete properties: "16px rounded card borders, soft ambient drop-shadows, and Outfit sans-serif typography".
  * Prompt for multiple states of interactive elements (e.g., default vs. scanning camera overlay, or success vs. error modal check) in a single output to get complete layouts.
* **Common Mistakes to Avoid**:
  * Omitting viewport constraints. UI generators default to widescreen desktop formats unless explicitly instructed to limit rendering to mobile dimensions (e.g., 375px wide).
  * Using mock placeholders like "Lorem Ipsum". Real text (e.g., student names like "Alex Mercer", room numbers like "D-304") is essential to verify font sizes, spacing, and vertical alignment.

### Step 16 & 17: UI Asset Generation and Local reference Management
* **What was done**: Generated design PNG files for all 8 application screens via Claude Design / Stitch system, and imported them into a newly created `mobile/designs` directory inside the project workspace.
* **Why**:
  - *Pixel-Perfect References*: Having static screenshots of the target UI layout inside the local directory allows developers to run split-screen editors in VS Code (code on the left, visual PNG target on the side). This minimizes visual guesswork during frontend development.
  - *Asset Structure*: Organizing high-resolution assets into designated subfolders (e.g., `mobile/designs/`) keeps project sources tidy and prevents files from mixing with the runtime bundle assets (which are placed under `mobile/assets/`).
* **Concepts Used**:
  - *Visual Handoff*: The process of transferring completed design mockups from design systems into developer code workspaces.
  - *Absolute path asset mapping*: Copying files using absolute local directory rules ensures files land in the correct folder, matching configuration settings.
* **Best Practices**:
  - Keep reference mockups inside the workspace, but ensure they are included in `.gitignore` if they are large or if you don't want them in the final Git history. (They are under `mobile/designs/` which can be ignored or committed for collaborative review).
  - Use lowercase, dash-separated filenames (kebab-case) for all imported screen assets to keep commands cross-platform compatible.
  - Storing design references in the system Downloads or Desktop folder. If the workspace is moved or opened by another developer, the references are lost. Keep them inside the repository.

### Step 18: Global State Management, Native Secure Persistence, and API Interceptors
* **What was done**: Created `mobile/store/useStore.js` using Zustand for global application state, integrated with `expo-secure-store` to encrypt and persist credentials on-disk. Created `mobile/services/api.js` using Axios to declare all REST API endpoint functions, configured with request/response interceptor middlewares.
* **Why**:
  - *Unified Store*: Multiple mobile screens need access to the same authentication credentials (admin college name, role-based routing flags, etc.). Zustand provides a lightweight shared store hook.
  - *Native Encryption*: Mobile devices are vulnerable to data extraction. Storing JWT tokens in standard unencrypted storage is a security risk. `expo-secure-store` encrypts values using Android's Keystore and iOS's Keychain.
  - *Interceptors*: decodes authentication concerns from service code. Instead of manually passing the token to every API method, the interceptor automatically grabs the token from the Zustand store and injects it as an HTTP Header.
* **Concepts Used**:
  - *Zustand getState()*: Accessing active store values outside of a React component lifecycle (like inside our Axios API client file).
  - *Axios Interceptors*: Action pipelines executing before a request hits the network (enabling header manipulation) and after a response is returned (enabling automatic logout on 401 Unauthorized errors).
* **Best Practices**:
  - Encrypt all sensitive tokens and personal user profiles on mobile disks.
  - Always clean and delete keys from hardware keychains upon user logout.
* **Common Mistakes to Avoid**:
  - Storing massive datasets in SecureStore. It is optimized and size-limited for key-value credentials. For large databases, use SQLite or local caches.
  - Not setting a timeout on Axios requests. Without it, a dropped connection could cause components to freeze indefinitely waiting for a response.

### Step 19: Building the Login Screen with React Navigation
* **What was done**: Created `mobile/screens/LoginScreen.js` — the first interactive screen of the app — and rewired `mobile/App.js` to use a React Navigation Stack Navigator.
* **Why**:
  - The login screen is the single entry point for both admin and guard users. After login, the backend returns a `role` field (`"admin"` or `"guard"`) which determines which dashboard the user is routed to.
  - We use **React Navigation** (native Android stack) instead of `expo-router` (file-based routing). This gives us full control over navigation transitions and doesn't require installing additional packages.
* **Concepts Used**:
  - *`createStackNavigator()`*: Creates a stack-based navigation structure where screens are pushed/popped like a card deck. `navigation.replace('ScreenName')` swaps the current screen entirely (no back button to the login page after successful auth).
  - *`KeyboardAvoidingView`*: A React Native wrapper that shifts the content upward when the software keyboard opens, preventing inputs from being hidden behind the keyboard. Uses `behavior="padding"` on iOS and `behavior="height"` on Android.
  - *`SafeAreaView`*: Ensures content does not overlap with the device's status bar, notch, or home indicator on modern phones.
  - *Conditional Initial Route*: `App.js` checks the persisted auth state on startup. If a token exists, it skips login and directly opens the appropriate dashboard. This creates a seamless "stay logged in" experience.
* **Best Practices**:
  - Use `navigation.replace()` instead of `navigation.navigate()` for auth transitions. `replace` removes the login screen from the stack, so the user cannot press the back button to return to login after authenticating.
  - Match colors and spacing from the design PNG exactly using React Native `StyleSheet`. Extract hex codes, border radii, font sizes, and spacing values directly from the Stitch HTML source code.
  - Using `navigation.navigate()` after login. This keeps the login screen in the back stack, allowing users to swipe back to it even after authenticating.
  - Hardcoding platform-specific keyboard behavior. Always use `Platform.OS` checks with `KeyboardAvoidingView` to handle iOS and Android differences.

### Step 20: Admin Dashboard Screen Development
* **What was done**: Created `mobile/screens/AdminDashboardScreen.js` and registered the route inside the Stack Navigator in `mobile/App.js`.
* **Why**:
  - The dashboard provides administrators with real-time statistics (total students, biometric enrollment rate, number of students currently outside vs. inside the hostel premises) and a feed of recent check-in/out gate events.
* **Concepts Used**:
  - *Parallel Data Ingestion*: Running requests concurrently using `Promise.all([api1, api2, api3])` decreases page load latency compared to awaiting them sequentially.
  - *`RefreshControl` & Pull-to-Refresh*: An native React Native overlay component enabling users to drag the ScrollView downward to re-trigger API data loading.
  - *Computed State*: Slicing state dependencies (e.g. taking a list of students, counting those with embeddings to display the enrollment progress percentage, and comparing it against the total list).
* **Best Practices**:
  - Always handle empty states gracefully (e.g., displaying a user-friendly "No logs recorded today" text if the logs array is empty) to prevent empty UI blocks.
  - Settle API load states inside a `finally` block to guarantee that the loading indicator stops even if a network request fails.
  - Fetching API data in sequence when queries are independent. Running three sequential `await` calls block the UI thread longer than a single concurrent `Promise.all` invocation.
  - Failing to restrict lists. Rendering thousands of logs directly inside a dashboard degrades scroll performance; slice lists (e.g., `.slice(0, 3)`) and redirect users to a dedicated ledger screen for full logs.

### Step 21: Register Student Screen Development
* **What was done**: Created `mobile/screens/RegisterStudentScreen.js` and wired it into Stack Navigator in `mobile/App.js`.
* **Why**:
  - Registration forms gather profile details (name, roll number, room, contact) needed to index a student in Supabase before capturing and binding their face templates.
* **Concepts Used**:
  - *Custom Dropdown Modal*: React Native's core library lacks a simple cross-platform select picker. Creating a custom selection dialog using `Modal` and `FlatList` avoids installing heavy third-party packages, keeping performance clean.
  - *Validation Guard*: Blocking submissions early by checking required fields (`name` and `roll_number`), displaying native `Alert` messages, and sanitizing strings (trimming whitespace, converting roll numbers to uppercase).
  - *Prefix Layout Container*: Styling compound inputs (like phone numbers) by joining a locked prefix block (`+91`) and an input block under a common outer layout box.
* **Best Practices**:
  - Use `keyboardType="phone-pad"` for digits and phone inputs to automatically display numeric keypads on touch devices.
  - Capitalize codes (like Roll Numbers) automatically using `autoCapitalize="characters"` to maintain uniform database indexing.
  - Directly using third-party select pickers without validation. They often degrade performance or break on major Expo version upgrades. Custom modal pickers are safe and robust.

### Step 22: Face Enrollment Camera Screen Development
* **What was done**: Created `mobile/screens/FaceEnrollmentScreen.js` using `expo-camera` (`CameraView`) and registered the route in `mobile/App.js`.
* **Why**:
  - The Face Enrollment screen captures 3 distinct facial photos (straight, left-angled, right-angled) to build a rich 128-dimensional embedding model on the server, guaranteeing accurate matching under varied camera perspective angles.
* **Concepts Used**:
  - *Camera Permission Lifecycle*: In modern mobile OS architectures, requesting camera access is a runtime requirement. Using the `useCameraPermissions` hook allows us to check active states and display an explicit trigger button if access has not yet been granted.
  - *`CameraView` API*: The standard component for rendering a live front-facing viewport feed, exposing control methods like `takePictureAsync` to capture high-resolution frame snaps.
  - *Vector Guidance Overlays*: Overlaying SVG shapes (`react-native-svg`'s `<Ellipse />`) to draw dashed biometric alignment guides directly on top of the live camera feed.
  - *Animated Flash Feedback*: Using `Animated.timing()` to flash a white absolute overlay to `opacity: 1` and fade it back down to `0` instantly, providing guards or admins with tactile visual feedback when photos are taken.
* **Best Practices**:
  - Compress camera images using `quality: 0.6` when extracting Base64 strings. Full-resolution raw images are massive, bloating network requests and causing HTTP timeouts, whereas 60% compression preserves facial features perfectly.
  - Run checks to ensure essential route parameters (`studentId`, `studentName`) are present before mounting, raising warnings if the page was opened without student context.
  - Using deprecated `Camera` component imports. Expo SDK 51+ and 57 require the newer, more optimized `CameraView` component.

### Step 23: Student List Screen Development
* **What was done**: Created `mobile/screens/StudentListScreen.js` and registered the route in the Stack Navigator inside `mobile/App.js`.
* **Why**:
  - The Student List screen allows administrators to view all registered residents, check their active biometric status, and easily target students whose biometric data has not yet been configured.
* **Concepts Used**:
  - *Dynamic Search Filtering*: Matching user search inputs against multiple object attributes (name, ID, room, department) by converting all strings to lowercase and running substrings match (`includes()`) dynamically.
  - *`FlatList` list optimization*: Using `FlatList` instead of mapping a `ScrollView`. FlatList only mounts and renders visible cells on screen, optimizing performance on lists containing hundreds of rows.
  - *Contextual Action Redirection*: Tapping any card whose status is "Pending Scan" launches an alert offering a shortcut route directly to the `FaceEnrollment` camera view.
* **Best Practices**:
  - Declare a clear `ListEmptyComponent` on `FlatList` to handle empty filter states or empty database rosters gracefully.
  - Avoid heavy operations inside the list renderer. Compute filtered datasets beforehand and pass them directly as the data source.
  - Rendering lists without a unique `keyExtractor`. Using index keys instead of database primary keys (`id`) can cause React state rendering and animation bugs when filtering rows.
  - Overlooking search query sanitization. Always trim input strings to prevent accidental space entries from showing empty results.

### Step 24: Connect Admin Tabs (Navigation)
* **What was done**: Created `mobile/screens/AdminTabNavigator.js` implementing a Bottom Tab Navigator, and integrated it as the primary `'AdminDashboard'` Stack route inside `mobile/App.js`.
* **Why**:
  - Setting up Bottom Tabs allows administrators to fluidly switch between the dashboard metrics view, student lists, and profile registration forms without pushing screens onto the back stack.
* **Concepts Used**:
  - *Nested Navigation Architecture*: Operating tab navigation inside stack navigation. The stack handles auth screens (Login) and modals (Face Enrollment), while the bottom tab handles the main dashboard environment.
  - *Screen Tab Bar Customization*: Styling the bottom tab deck (Active Accent `#2563EB`, inactive labels, height, safe area margins, and shadow elevations) to produce a visually pleasing aesthetic matching design wireframes.
  - *Dynamic Tab Icons*: Utilizing conditional loops inside `tabBarIcon` callbacks to map unique emojis or symbols depending on active routing.
* **Best Practices**:
  - Keep camera interfaces (like Face Enrollment) or modals outside the bottom tab system. Forcing camera feeds to render inside tabs restricts screen space and clutters layout; keep them in the top-level Stack so they open full-screen.
  - Use highlight containers (like translucent backplates) behind active tab icons to help users easily identify which tab is selected.
* **Common Mistakes to Avoid**:
  - Nesting navigators without setting `headerShown: false` on sub-routes. This leads to duplicate double headers occupying valuable screen estate.
  - Failing to coordinate screen names. If a tab screen name matches a root stack name incorrectly, navigation triggers might target the incorrect stack, breaking routing loops.

### Step 25: Guard Scan Screen (Core Verification UI)
* **What was done**: Created `mobile/screens/GuardScanScreen.js` and registered the route as `'GuardScan'` in the Stack Navigator inside `mobile/App.js`.
* **Why**:
  - This is the most critical screen in the entire application. It allows gate guards to scan a student's face in real-time and get an instant identification result — the core purpose of the biometric security system.
* **Concepts Used**:
  - *1:N Face Identification Flow*: The camera captures a single frame, converts it to Base64, and sends it to the `/api/face/identify` backend endpoint. The backend compares the captured embedding against all enrolled student embeddings and returns the best match (or no-match).
  - *Animated Pulse Overlay*: During scanning, the dashed oval face guide animates with a breathing pulse effect using `Animated.loop()` with alternating `scale` transforms (1.0 → 1.06 → 1.0). This provides visual feedback that the system is actively processing.
  - *Camera Flash Feedback*: A white flash overlay (`Animated.View` with opacity transition) fires immediately after photo capture, mimicking a physical camera shutter to confirm the frame was taken.
  - *Inline Result Modal*: A `Modal` component displays results (match or no-match) as an overlay on top of the camera view. This avoids a full screen transition and keeps the guard in context for rapid scanning.
  - *Next Action Prediction*: The backend predicts whether the matched student should be checking IN or OUT based on their most recent outpass log entry, preventing duplicate logs.
* **How It Works**:
  1. Guard opens the scan screen → front camera activates with teal dashed oval guide
  2. Guard taps "SCAN FACE" → photo captured, flash animates, oval pulses amber
  3. Base64 image sent to backend → backend extracts embedding, runs cosine similarity against all enrolled faces
  4. Result modal appears → shows student info (name, roll, room, confidence %) or "No Match Found"
  5. Guard taps "Confirm Entry/Exit" → navigates to StudentFoundModal for logging (Step 26)
* **Best Practices**:
  - Always disable the scan button during processing (`disabled={scanning}`) to prevent duplicate API calls from rapid tapping.
  - Use `quality: 0.6` for photo capture to balance image clarity with upload speed — full quality photos are unnecessarily large for face embedding extraction.
  - Show meaningful error context in no-match states (e.g., distinguish "no students enrolled" from "face not recognized") to guide the guard's next action.
  - Forgetting to handle the `permission === null` state (loading) separately from `permission.granted === false` (denied). The camera permissions hook returns `null` initially while the system checks status.
  - Not stopping animation loops when the component unmounts or scanning finishes. Always call `stopAnimation()` and reset the `Animated.Value` to prevent memory leaks and visual glitches.
  - Passing complex objects (like the full `scanResult`) via navigation params can exceed serialization limits. For large payloads, consider using Zustand or context instead.

### Step 26: Student Found Modal Screen (Action Confirmation Card)
* **What was done**: Created `mobile/screens/StudentFoundModalScreen.js` and registered the route as `'StudentFoundModal'` in the Stack Navigator inside `mobile/App.js`.
* **Why**:
  - The Student Found modal screen serves as the final transaction gate. It displays detailed student identity confirmation parameters and allows guards to log a check-in or check-out event to database records with a single click.
* **Concepts Used**:
  - *Dynamic Asset & Text States*: Managing conditional screen sub-rendering for "Identified Match" state vs "Unknown Person" warning state.
  - *Biometric Transaction Logging*: Invoking the `/api/face/log-action` endpoint to record student check-ins/check-outs, passing parameters like matched confidence metrics and the identifier of the guard who verified the entry/exit.
  - *Confidence Visualization*: Presenting blue badge header pills to show match confidence percentages.
  - *Red/Green Status Badges*: Implementing dynamic colored call-to-actions (red for CONFIRM CHECK-OUT / exit vs green for CONFIRM CHECK-IN / entry) to match the visual mock guidelines.
* **Best Practices**:
  - Show a clear activity indicator spinner inside the confirm button during API logging calls to prevent duplicate submission triggers.
  - Gracefully handle situations where network timeouts occur, allowing guards to dismiss error dialogues and retry logging without restarting the application.
  - Hardcoding the outpass activity action. Check the `next_action` parameter returned by the backend (`IN` or `OUT`) and propagate it dynamically to keep database states synchronized.
  - Overlooking database relationship checks. Ensure the guard user's UUID is correctly parsed from Zustand and logged as `logged_by` to audit who authenticated the entry/exit transaction.

### Step 27: Recent Logs Screen (Ledger Feed)
* **What was done**: Created `mobile/screens/RecentLogsScreen.js` and registered the route as `'RecentLogs'` in the Stack Navigator inside `mobile/App.js`.
* **Why**:
  - Gate guards need a clear audit history ledger of who recently passed through the gate. This helps them monitor traffic and verify if a student's check-in or check-out was recorded successfully.
* **Concepts Used**:
  - *Dynamic Date Grouping*: Sorting and grouping log timestamps into user-friendly headers (TODAY, YESTERDAY, or full date strings) and rendering them in a single flat list by injecting section headers inline.
  - *Status Badge Highlights*: Visual indicators displaying `CHECKED IN` (green) or `CHECKED OUT` (red) text on subtle background tints, making logs scanning fast.
  - *Roster Subtitle Details*: Displaying which gate (e.g. Gate A/Gate B) was triggered based on metadata parameters stored in DB outpass rows.
* **Best Practices**:
  - Implement pull-to-refresh (`RefreshControl`) so users can pull down on the list to fetch new check-ins immediately from the server.
  - Show a friendly placeholder empty state containing clear setup instructions if no transactions have been logged.
  - Not formatting dates cleanly. Raw ISO strings (e.g. `2026-07-15T09:48:38Z`) are unreadable. Use localized string formatters to present hours and minutes (e.g. `05:12 PM`) cleanly.
  - Excessive fetching. Cache local state and trigger server reload fetches only upon explicit pull-to-refresh interactions or component mounts.

### Step 28: Connect Guard Tabs (Navigation)
* **What was done**: Created `mobile/screens/GuardTabNavigator.js` implementing a Bottom Tab Navigator, and integrated it as the primary `'GuardScan'` Stack route inside `mobile/App.js`.
* **Why**:
  - The guard app requires a bottom tab navigator to allow security staff to instantly switch between the live camera scanning screen and the recent entry activity ledger without cluttering the screen context.
* **Concepts Used**:
  - *Layout and Style Harmonization*: Maintaining visual consistency across the entire app by copying active tab layouts, spacing, indicator styles, and elevations from the administrator's navigation deck.
  - *Emoji/Symbol Route Customization*: Mapping appropriate symbols dynamically (`📷` for live capture scanning vs `📋` for logs history feed) inside tab bar icon callbacks.
  - *Active Tab Indicator Accent Circles*: Encasing the selected tab emoji inside a translucent blue badge border, highlighting which screen is currently in view.
* **Best Practices**:
  - Keep modal overlays (like `StudentFoundModalScreen` which displays transaction result approvals) registered in the top-level Stack Navigator rather than nesting them in tab screens. This allows them to load as clean modals on top of the tab bar.
  - Forgetting to test the redirect route paths. If `LoginScreen.js` redirects using `navigation.replace('GuardScan')`, ensure `GuardTabNavigator` is registered under that exact key inside the Stack Navigator configuration inside `App.js`.

### Step 29: Full End-to-End Test (Verification Flow)
* **What was done**: Audited all 8 screens and layouts for consistency and verified the local Python FastAPI test suite `test_api.py`.
* **Why**:
  - Verification ensures that all integration points (database, auth, face matching engine, outpass logs, and state managers) operate seamlessly as a unified system before deploying the application to the cloud.
* **Concepts Used**:
  - *Automated Test Scripts*: Executing python uvicorn child processes dynamically and calling REST routes via urllib.
  - *Mock Verification Pipelines*: Simulating a complete admin-guard registration and entry lifecycle (Admin Login → Register Student → Enroll Face → Guard Face Identification → Log Exit Outpass → Query History Dashboard).
* **Best Practices**:
  - Pre-generate mock images (`photo1.jpg`, `photo2.jpg`, `photo3.jpg`) representing different angles or individuals to test positive matches and negative rejections locally.
  - Always clean up or seed unique identifiers (like dynamic roll numbers `ROLL-{timestamp}`) during tests to avoid database unique constraint conflicts.
* **Common Mistakes to Avoid**:
  - Testing only happy paths. Make sure to verify error scenarios like unknown faces, failed camera permissions, and bad network states.

### Step 30: Deploy Backend to Render.app (Free Hosting)
* **What was done**: Evaluated hosting alternatives to Railway, created a production-ready `Dockerfile` in the `/backend` directory for containerized deployment, and updated the build plan.
* **Why**:
  - Render offers a free hosting tier. Deploying via a Dockerfile is the most reliable way to host Python applications with C++ dependencies (like `dlib` and `face_recognition`) on free platforms, because it isolates the environment and guarantees all build tools (like `cmake` and `g++`) are available to compile the native code successfully.
* **Concepts Used**:
  - *Containerization (Docker)*: Defining a step-by-step recipe to build a Linux container containing the exact OS packages, python runtimes, and libraries needed, avoiding "it works on my machine" issues.
  - *Multi-step Dependency Building*: Copying and installing `requirements.txt` before copying the rest of the application code. This allows Docker to cache the compiled C++ layers, so subsequent code updates deploy in seconds instead of compiling `dlib` from scratch each time.
* **Best Practices**:
  - Always clean up temporary package manager caches (e.g. `rm -rf /var/lib/apt/lists/*`) in Docker layers to keep the container image size small.
  - Use specific base image versions (e.g. `python:3.11-slim-bookworm`) instead of `latest` tags to guarantee builds don't break when base OS libraries update.
* **Common Mistakes to Avoid**:
  - Trying to deploy heavy AI libraries to Serverless platforms like Vercel. Serverless size limits (typically 50MB) and build environment restrictions prevent native C++ compilation, leading to deployment failures.
















