# 📘 Hostel Biometric — User Manual & Setup Guide

Welcome to the **Hostel Biometric System** user manual. This document provides step-by-step instructions for setting up the application and using all features available to Administrators and Security Guards.

---

## 📋 Table of Contents
1. [Overview](#-overview)
2. [Quick Setup Guide (Non-Technical)](#-quick-setup-guide-non-technical)
   - [Prerequisites](#1-prerequisites)
   - [Step 1: Start the Backend Server](#step-1-start-the-backend-server)
   - [Step 2: Start the Localtunnel (Public Network Access)](#step-2-start-the-localtunnel-public-network-access)
   - [Step 3: Run Mobile App / Install APK](#step-3-run-mobile-app--install-apk)
3. [Admin User Guide](#-admin-user-guide)
   - [Logging In](#1-logging-in-as-admin)
   - [Admin Dashboard](#2-admin-dashboard)
   - [Registering a New Student](#3-registering-a-new-student)
   - [Enrolling a Student's Face](#4-enrolling-a-students-face)
   - [Viewing Student Roster](#5-viewing-student-roster)
4. [Security Guard User Guide](#-security-guard-user-guide)
   - [Logging In](#1-logging-in-as-guard)
   - [Scanning Faces at the Gate](#2-scanning-faces-at-the-gate)
   - [Confirming Entry / Exit](#3-confirming-entry--exit)
   - [Viewing Access Logs](#4-viewing-access-logs)
   - [Tracking Students Currently Outside](#5-tracking-students-currently-outside)
5. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🎯 Overview

The **Hostel Biometric System** automates hostel entry and exit tracking using **1:N facial recognition**. 
- **Admin App**: Used by hostel management to register students, enroll facial biometric templates, and monitor hostel metrics.
- **Guard App**: Used by gate security to scan faces in real-time, instantly identify students, log check-in/check-out outpasses, and view phone contact info.

---

## 🚀 Quick Setup Guide (Non-Technical)

### 1. Prerequisites
Before starting, make sure your computer has:
* **Python 3.10+** installed.
* **Node.js 18+** installed.
* An active internet connection.

---

### Step 1: Start the Backend Server
Open your computer's terminal (or Command Prompt) and run:

```bash
cd backend
./venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```
*(If you are on Windows, run `venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000`)*

✅ **Success Check**: You should see `INFO: Application startup complete.` and `Uvicorn running on http://0.0.0.0:8000`.

---

### Step 2: Start the Localtunnel (Public Network Access)
Because mobile phones operate on cellular/Wi-Fi networks separate from localhost, we use **localtunnel** to securely expose your backend to the internet.

Open a **new terminal window** and run:

```bash
npx localtunnel --port 8000 --subdomain hostel-biometric-charan
```

✅ **Success Check**: You will see `your url is: https://hostel-biometric-charan.loca.lt`. Leave this terminal window running in the background.

---

### Step 3: Run Mobile App / Install APK

#### Option A: Install Standalone Android APK (Easiest for testing)
1. Locate the pre-compiled file `hostel-biometric.apk` in the project root folder.
2. Transfer `hostel-biometric.apk` to your Android phone via USB, Google Drive, or WhatsApp.
3. Tap the file on your phone to install (allow "Install from Unknown Sources" if prompted).
4. Launch **Hostel Biometric** from your phone app drawer.

#### Option B: Expo Go / Development Mode
1. In a **new terminal window**, navigate to the `mobile` folder:
   ```bash
   cd mobile
   npx expo start
   ```
2. Scan the displayed QR code using the **Expo Go** app on your Android or iOS phone.

---

## 🔑 Admin User Guide

### 1. Logging In as Admin
* **Default Credentials**:
  * **Email**: `admin@nitw.edu`
* Tap **Login**. You will be taken directly to the **Admin Dashboard**.

---

### 2. Admin Dashboard
The dashboard provides an instant overview of hostel activity:
* **Total Registered**: Count of all students added to your hostel database.
* **Faces Enrolled**: Count of students with registered facial biometric data.
* **Currently Outside**: Live counter of students checked out through gate scans.

---

### 3. Registering a New Student
1. Tap the **Register** tab at the bottom of the screen.
2. Fill in the student's profile details:
   * **Full Name**: e.g., `Charan Kumar`
   * **Roll Number / ID**: e.g., `NITW20260001` *(Must be unique)*
   * **Phone Number**: e.g., `+91 9876543210` *(Used for emergency guard contact)*
   * **Room Number**: e.g., `B-304`
   * **Department / Branch**: e.g., `Computer Science`
   * **Year**: e.g., `3rd Year`
3. Tap **Register Student**.
4. The app will immediately prompt you to **Enroll Student Face**.

---

### 4. Enrolling a Student's Face
1. Hold the phone camera in front of the student.
2. Ensure good ambient lighting without harsh glare or direct shadows.
3. Follow the 3-step photo capture prompts:
   * **Photo 1**: Frontal direct face view
   * **Photo 2**: Slight left angle view
   * **Photo 3**: Slight right angle view
4. If a photo fails face detection, tap **Try Again (Restart)** and check light conditions.
5. Upon completion, a green success modal will confirm enrollment.

---

### 5. Viewing Student Roster
1. Tap the **Roster** tab at the bottom of the screen.
2. Search students by **Name**, **Roll Number**, or **Room Number**.
3. Green badges indicate **Enrolled** status; red badges indicate **Pending** face enrollment.
4. **Tap any student card** to open their full profile modal displaying:
   * Profile Photo
   * Roll Number / ID
   * Contact Phone Number
   * Room & Department
   * Enrollment Status

---

## 🛡️ Security Guard User Guide

### 1. Logging In as Guard
* **Default Credentials**:
  * **Email**: `guard@nitw.edu`
* Tap **Login**. You will be taken to the **Guard Station Console**.

---

### 2. Scanning Faces at the Gate
1. Tap **Scan Face** on the dashboard or open the **Scan** tab.
2. Ask the student to stand in front of the camera.
3. Center the student's face inside the green **oval guide** on the screen.
4. Use the **Camera Flip button** (bottom-right) to switch between Front and Back cameras as needed.
5. Tap the big blue **SCAN FACE** button.

---

### 3. Confirming Entry / Exit
1. When a match is found, a popup modal will appear showing:
   * Student Photo & Name
   * Roll Number / ID
   * Contact Phone Number
   * Room Number
   * Verification Confidence %
   * Predicted Next Action (**Checking OUT** or **Checking IN**)
2. Tap **Confirm Exit** or **Confirm Entry** to save the gate log.
3. If an unrecognized face is scanned, the app displays an **Unknown Person** alert.

---

### 4. Viewing Access Logs
1. Tap the **Logs** tab at the bottom of the screen.
2. Toggle between **Checked In** and **Checked Out** tabs.
3. Each log card shows the student's photo, Roll Number, Room Number, and local timestamp.
4. **Tap any log card** to pull up the complete student info card with their **Phone Number**.

---

### 5. Tracking Students Currently Outside
1. Tap the **Outside** tab at the bottom of the screen.
2. Displays all resident students who are currently checked out of campus.
3. Shows how long each student has been away (e.g., `Today at 02:15 PM (3h ago)`).
4. **Tap any student card** to quickly access their **Phone Number** for safety checks.

---

## ❓ Troubleshooting & FAQs

### Q: The scan says "Failed to connect to biometric service" or returns 502/503.
* **Solution**: Ensure both the FastAPI backend (`uvicorn main:app`) and Localtunnel (`npx localtunnel`) terminal windows are running on your computer.

### Q: Face detection says "No face detected in camera frame".
* **Solution**: 
  1. Ensure the student is looking directly into the camera.
  2. Avoid strong background sunlight or dark shadows across the face.
  3. Keep the phone steady while tapping **Scan Face**.

### Q: Scanned face fails to match when using the front camera.
* **Solution**: The app automatically flips front-camera images to undo mirror distortion. Ensure the student enrolled their facial photos under clear lighting.

---

*Hostel Biometric System — Powered by FastAPI, dlib C++ Face Engine, React Native & Supabase.*
