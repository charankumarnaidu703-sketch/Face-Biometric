import axios from 'axios';
import useStore from '../store/useStore';

// For local physical device testing, replace this with your computer's local IP (e.g. 'http://192.168.1.15:8000')
// For emulator testing, 'http://10.0.2.2:8000' (Android) or 'http://localhost:8000' (iOS) works.
// For production, paste your Railway/AppHosting backend URL.
// Current: Localtunnel public URL (tunnels to localhost:8000 on your Mac)
export const API_URL = 'https://hostel-biometric-charan.loca.lt';

const api = axios.create({ 
  baseURL: API_URL,
  timeout: 30000, // 30s timeout (face recognition can take time over tunnel)
  headers: {
    'Bypass-Tunnel-Reminder': 'true', // Skip Localtunnel's interstitial page
  },
});

// Request Interceptor: Automatically inject JWT token from Zustand store
api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch authorization failures (401) and trigger logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized. Logging out.');
      useStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const login = (email) =>
  api.post('/api/auth/login', { email });

// --- Students Endpoints ---
export const registerStudent = (studentData) =>
  api.post('/api/students/register', studentData);

export const getStudents = (userId) =>
  api.get(`/api/students/list/${userId}`);

export const getStudentDetail = (studentId) =>
  api.get(`/api/students/${studentId}`);

export const getStudentStatus = (studentId) =>
  api.get(`/api/students/${studentId}/status`);

// --- Face Operations Endpoints ---
export const enrollFace = (studentId, base64Image) =>
  api.post('/api/face/enroll', { student_id: studentId, base64_image: base64Image });

export const identifyFace = (base64Image, adminUserId) =>
  api.post('/api/face/identify', { base64_image: base64Image, admin_user_id: adminUserId });

export const logAction = (studentId, action, confidence, loggedBy, gate = 'MAIN_GATE') =>
  api.post('/api/face/log-action', {
    student_id: studentId,
    action: action,
    confidence: confidence,
    logged_by: loggedBy,
    gate: gate
  });

// --- Outpass Tracking Endpoints ---
export const getRecentLogs = (adminUserId) =>
  api.get(`/api/outpass/logs/${adminUserId}`);

export const getCurrentlyOut = (adminUserId) =>
  api.get(`/api/outpass/currently-out/${adminUserId}`);

export default api;
