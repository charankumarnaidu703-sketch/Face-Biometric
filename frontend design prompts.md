# Frontend Design Prompts (frontend design prompts.md)

This file contains optimized system prompts for each of the 8 screens in the **Hostel Biometric** mobile application. Each prompt has been crafted using the **RSCIT** (Role, Situation, Constraints, Instructions, Template) framework to produce visually stunning, premium-grade, and realistic user interfaces when pasted into Claude Design.

---

## 🎨 Global Design Guidelines (Applied to all Prompts)
To maintain consistency across the entire application:
* **Primary Color**: Deep Blue (`#2563EB` / HSL `221, 83%, 53%`)
* **Success Color**: Emerald Green (`#10B981` / HSL `142, 70%, 45%`)
* **Danger Color**: Crimson Red (`#EF4444` / HSL `0, 84%, 60%`)
* **Backgrounds**: Pure white (`#FFFFFF`) or light slate grey (`#F8FAFC`)
* **Typography**: Clean modern sans-serif (such as Inter, Outfit, or Roboto)
* **Shadows**: Subtle, soft ambient shadows (`shadow-sm` or `shadow-md` in Tailwind)

---

## 📁 8 Screen Prompts

### 🖥️ 1. Login Screen (Unified Admin & Guard Entrance)
```markdown
Role: You are an expert mobile UI/UX designer specializing in high-security biometric enterprise applications.

Situation: Design a premium, clean mobile login screen for "Hostel Biometric" (a biometric student gate management system).

Constraints:
- Single mobile viewport width (375px) with vertical scroll container.
- Theme: Minimal, high-trust, corporate. Flat design with high-fidelity components.
- Primary Accent: Deep Blue (#2563EB). Background: Pure White (#FFFFFF).
- Typography: Large bold titles, clear inputs, clean hierarchy.
- No generic gradients or colored page backgrounds.

Instructions:
Design a top-to-bottom layout:
1. Header Section:
   - Centered security shield or clean fingerprint outline icon (48px) colored in Deep Blue.
   - 16px space.
   - App title "Hostel Biometric" in bold, large typography (28px, charcoal #1E293B).
   - Subtitle "Institutional Security Dashboard" in soft grey (#6B7280).
2. Input Form (40px spacing below header):
   - Email Input Box: Pair a dark gray label (#374151, 14px, semi-bold) directly above a rounded input container (8px border-radius, light gray border #D1D5DB, padding 14px). Include a subtle envelope icon on the left and a placeholder email "admin@college.edu" in light gray.
   - Password Input Box (16px spacing below Email): Same structure, with key/lock icon on the left, masked text (••••••••), and a password visibility "eye" icon on the far right.
3. Actions (24px spacing below inputs):
   - Full-width, high-contrast Deep Blue button with bold white text "Login to Dashboard" (12px border-radius, height 52px).
   - "Forgot Password?" link centered below in Deep Blue text, medium weight (14px).
4. Footer (at the bottom):
   - Centered text: "Powered by Biometric AI" (#9CA3AF, 11px, tracking-widest uppercase).

Template: Render a pixel-perfect, clean, single-screen React component styled with Tailwind CSS. Provide a high-fidelity visual preview.
```

---

### 🖥️ 2. Admin Dashboard Screen (Summary & Metrics)
```markdown
Role: You are a principal dashboard UI designer specializing in educational management portals.

Situation: Design a mobile homepage/dashboard for the Hostel Administrator.

Constraints:
- Mobile viewport. Light slate grey background (#F8FAFC).
- High visual hierarchy. Metrics must be large, legible, and color-coded.
- No heavy shadows or overlapping cards. Minimal borders.

Instructions:
Create a layout consisting of:
1. Header Bar:
   - "Welcome Back, Admin 👋" in bold (22px, #1E293B).
   - Below: "St. Jude Engineering Hostel" in soft grey (#6B7280, 13px).
2. Metric Grid (2x2 layout):
   - Card 1 (Blue Accent): "Total Students" label, value "482" in massive 36px bold, white icon.
   - Card 2 (Green Accent): "Enrolled Faces" label, value "476" in 36px bold, success badge (+6 newly added).
   - Card 3 (Red Accent): "Currently OUT" label, value "38" in 36px bold, activity indicator.
   - Card 4 (Purple Accent): "Currently IN" label, value "444" in 36px bold.
   - All cards: White background, rounded corners (16px), subtle border (#F1F5F9), no heavy shadow.
3. Quick Actions Section (24px below metrics):
   - Section label: "QUICK ACTIONS" in dark grey, small capital letters (#475569, 12px, bold).
   - Action Button 1: Solid blue button with icon "+ Register New Student" (height 52px, rounded 12px, white bold text).
   - Action Button 2 (12px below): Outlined white button with blue border/text "View Roster & Student Profiles" (height 52px, rounded 12px).
4. Recent Analytics Widget:
   - Clean linear line chart or simple progress bar showing "Enrolled Face Biometrics: 98% complete".

Template: Render a modern, clean, single-screen React dashboard component styled with Tailwind CSS.
```

---

### 🖥️ 3. Register Student Form Screen
```markdown
Role: You are a senior product designer specializing in mobile form optimization and data entry workflows.

Situation: Design a high-fidelity registration form screen for entering a student's profile details before enrolling their face.

Constraints:
- Viewport: Mobile. Background: Pure White.
- Fields must look spacious and tap-friendly on touch devices (height 48px+).
- Tightly paired labels and inputs (small gap between label and field, larger gap between different fields).

Instructions:
Layout structure:
1. Navigation Header:
   - Left-pointing arrow icon, followed by page title "Register Student" in bold (20px, #1E293B).
2. Form Fields (stacked vertically with 18px gap):
   - Field 1: "Full Name" label (dark gray, semi-bold, 13px) + Input box with placeholder "e.g., Alex Mercer".
   - Field 2: "Roll Number / ID" label + Input box with placeholder "e.g., 21CS001".
   - Field 3: "Department" label + Input box with placeholder "e.g., Computer Science".
   - Field 4: "Year of Study" label + Dropdown input selection showing "3rd Year".
   - Field 5: "Room Number" label + Input box with placeholder "e.g., D-304".
   - Field 6: "Parent's Phone" label + Input box with placeholder "e.g., +91 98765 43210".
3. Form Footer:
   - Full-width solid green button (#10B981) labeled "Continue to Face Scan →" (rounded 12px, height 54px, white text, bold, with an arrow icon).

Template: Render a clean, structured React form component styled with Tailwind CSS.
```

---

### 🖥️ 4. Face Enrollment Camera Screen (Biometric Capture)
```markdown
Role: You are a UI designer specializing in camera overlay interfaces, computer vision overlays, and biometric enrollment screens.

Situation: Design the active camera viewport overlay for enrolling a student's face.

Constraints:
- Mobile screen height. Translucent black overlays covering the camera background.
- Central focus guide must be clear and stand out.
- High-fidelity biometric feel.

Instructions:
Create the following layout:
1. Camera Background:
   - Simulates a viewport showing a live camera stream (e.g. photo of a student).
2. Focus Guide Overlay:
   - Exactly centered: A bright green dashed oval outline (approx. 240px wide, 300px tall, 2px stroke).
   - Surrounding the oval is a semi-transparent dark mask (opacity 60%) to emphasize the face-scanning zone.
3. Instruction Banner (Top):
   - Dark semi-transparent pill container centered near the top: "Look straight into the camera" (white text, 14px, medium weight).
   - Below it: "Photo 1 of 3 captured" (small progress text in soft green).
4. Progress Indicator:
   - 3 segmented dots at the top: [Green dot] [Gray dot] [Gray dot] showing photo capture steps.
5. Capture Controls (Bottom):
   - A large, circular, glowing green capture trigger button (80px diameter, with a smaller concentric circle inside).
   - Left side of trigger: Close/Cancel icon.
   - Right side of trigger: Camera switch icon (front/rear).

Template: Render a clean, immersive camera UI React component styled with Tailwind CSS.
```

---

### 🖥️ 5. Student List Screen (Directory Roster)
```markdown
Role: You are a principal UI developer specializing in high-density data directories for search-and-filter screens.

Situation: Design the admin search roster containing the list of registered students and their biometric enrollment status.

Constraints:
- Mobile viewport. Light slate grey background (#F8FAFC).
- High visual contrast on search input.
- Status badges must be immediately color-distinguishable.

Instructions:
Provide a layout with:
1. Search & Filter Bar (sticky at top):
   - Search box: White background, rounded (12px), border (#E2E8F0), magnifying glass icon on the left, text: "Search name, roll, or department...".
   - Filter button: A clean icon on the right (sliders or funnel) for advanced filters.
2. Statistics Mini-Pill:
   - Subtitle: "Showing 482 students total".
3. Roster List Items (vertical stack, 10px spacing):
   - Card 1: "Alex Mercer", Roll: "21CS001", Room: "D-304", Status: Green badge "Enrolled ✅"
   - Card 2: "Jane Doe", Roll: "21EC045", Room: "A-102", Status: Red badge "Pending Scan" (light red background, red text)
   - Card 3: "Vikram Singh", Roll: "21ME123", Room: "C-208", Status: Green badge "Enrolled ✅"
   - Card 4: "Priya Sharma", Roll: "21IT098", Room: "B-212", Status: Green badge "Enrolled ✅"
   - All cards: White background, rounded corners (14px), padding 16px. Name in bold black (#1E293B). Info in small gray text.
4. Pagination / Loading indicator:
   - "Load More" indicator at bottom.

Template: Render a high-density, searchable directory list React component styled with Tailwind CSS.
```

---

### 🖥️ 6. Guard Scan Screen (Live Match Port)
```markdown
Role: You are a UI/UX designer specializing in high-speed industrial scanning dashboards and guard interfaces.

Situation: Design the live camera face recognition screen for a security guard at the hostel main gate.

Constraints:
- Mobile viewport.
- Interface must have a clean, high-contrast action button.
- Support visual feedback for scanning states.

Instructions:
Provide the screen layout for two states:
1. Camera Background:
   - Shows the live camera background.
2. Centered Scanner Overlay:
   - Centered: A dashed green oval outline (~240px wide, ~310px tall) marking the face capture bounds.
   - Text overlay above the oval: "👤 Center face in oval" in a semi-transparent dark banner (white text, 16px, bold).
3. Footer Controls:
   - A large, pill-shaped Blue button centered: "SCAN FACE" (60% screen width, height 56px, rounded 28px, white bold text, with scanner icon).
   - Text below button: "Main Gate Gatekeeper Port" in small light grey.
4. State Feedback Box:
   - An orange/yellow border variation around the oval representing the "Processing/Analyzing..." state, with the button changing to a disabled gray status showing "Verifying face...".

Template: Render a camera scan screen React component styled with Tailwind CSS.
```

---

### 🖥️ 7. Student Found Bottom Sheet Modal (Match Results)
```markdown
Role: You are an expert mobile interaction designer specializing in bottom sheets, modal states, and confirmation dialogs.

Situation: Design the slide-up bottom sheet confirmation modal triggered after a successful face scan.

Constraints:
- Viewport: Mobile. Dark backdrop overlay covering the background camera view.
- High-visibility action buttons (Green for check-in confirmation, Red for check-out).
- Clean spacing, rounded top corners.

Instructions:
Design a bottom sheet modal with two side-by-side or stacked states:
* **STATE 1 — Match Identified (Check-Out Scenario)**:
  - White sheet sliding up from bottom, rounded top corners (24px), padding 24px.
  - Centered at top: Circular student profile picture (90px diameter, thick blue border).
  - Student Name: "Alex Mercer" in bold (22px, #1E293B).
  - Subtitle: "Roll: 21CS001 • Room: D-304" (soft grey, 14px).
  - Confidence Badge: "Match Confidence: 98%" (blue text, light blue background pill, centered).
  - Spacing 24px.
  - Main Action Button: Full-width solid red button (#EF4444) with bold white text: "🔴 CONFIRM CHECK-OUT" (height 54px, rounded 12px, 18px text).
  - Secondary Button: Outlined gray button "Cancel & Re-Scan" (height 48px, rounded 12px).

* **STATE 2 — Unknown/No Match**:
  - Same white sheet structure.
  - Centered at top: Warning shield icon or red ⚠️ exclamation icon (72px, colored in red #EF4444).
  - Title: "Unknown Person" in bold (22px, #1E293B).
  - Subtitle: "No biometric match found in local database." (soft grey, 14px).
  - Action Button: Full-width gray outlined button "Try Scanning Again" (height 54px, rounded 12px).
  - Secondary link: "Register student profiles" (for admins).

Template: Render both states of the bottom sheet modal side-by-side inside a single React container styled with Tailwind CSS.
```

---

### 🖥️ 8. Recent Logs Screen (Gate Audit Ledger)
```markdown
Role: You are a principal UI designer specializing in activity ledgers, transaction histories, and live feed logs.

Situation: Design the activity log screen for the hostel gate check history.

Constraints:
- Mobile viewport. Light slate grey background (#F8FAFC).
- Strict visual codes (Red = Out, Green = In).
- Scannable, date-grouped list.

Instructions:
Develop the following screen layout:
1. Header Section:
   - Title: "Recent Activity Logs" in bold (20px, #1E293B).
   - Action: "Refresh List" blue link or icon on the far right.
2. Time Group Header:
   - Text: "TODAY — JULY 11" in small caps, bold (#64748B, 11px).
3. Log Feed Item Cards (vertical stack, 8px spacing):
   - Log 1:
     - Left indicator: Small solid Green circle (12px) representing check-in (IN).
     - Body: "Alex Mercer" (bold #1E293B), Roll: "21CS001", Room: "D-304".
     - Right info: Action label "CHECKED IN" (Green, 14px, bold), timestamp "05:12 PM".
   - Log 2:
     - Left indicator: Small solid Red circle (12px) representing check-out (OUT).
     - Body: "Priya Sharma" (bold #1E293B), Roll: "21IT098", Room: "B-212".
     - Right info: Action label "CHECKED OUT" (Red, 14px, bold), timestamp "04:45 PM".
   - Log 3:
     - Left indicator: Small solid Green circle (12px).
     - Body: "Vikram Singh" (bold #1E293B), Roll: "21ME123", Room: "C-208".
     - Right info: Action label "CHECKED IN" (Green, 14px, bold), timestamp "03:15 PM".
   - All log items: White card background, rounded (12px), padding 14px, minimal shadow.

Template: Render a clean, color-coded ledger log React component styled with Tailwind CSS.
```
