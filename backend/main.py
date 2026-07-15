"""
Hostel Biometric API Main entry point.

Initializes the FastAPI application, sets up CORS middleware (to allow connections
from mobile devices/browsers), and registers all modular route handlers under the
`/api` route namespace.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, students, face, outpass

app = FastAPI(
    title="Hostel Biometric API",
    description="Backend API for Hostel Face Biometric Check-In/Check-Out System",
    version="1.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
# In production, specify exact mobile application origins instead of wildcard '*'
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route components under '/api' namespace
app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(face.router, prefix="/api")
app.include_router(outpass.router, prefix="/api")


@app.get("/", tags=["Health"])
def health():
    """Application status health-check endpoint."""
    return {
        "status": "running ✅",
        "project": "Hostel Biometric",
        "version": "1.0.0"
    }
