"""
Face Engine — Core AI module for all face recognition operations.

Responsibilities:
  1. Decode base64 images from the mobile app into numpy arrays.
  2. Extract 128-dimensional face embeddings from a single-face photo.
  3. Compare a live query face against all stored student embeddings.

Performance optimizations for 1,000+ students:
  - In-memory numpy matrix cache (avoids re-fetching from Supabase on every scan)
  - Vectorized Euclidean distance computation (single numpy operation across all embeddings)
  - Cache auto-refresh every 60 seconds to pick up new enrollments
"""

import face_recognition
import numpy as np
from PIL import Image
import io
import base64
import logging
import time
import threading

logger = logging.getLogger(__name__)

# --- Constants ---
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB hard limit for incoming base64 images
MAX_IMAGE_DIMENSION = 4096           # Reject images wider/taller than this
DEFAULT_TOLERANCE = 0.5              # Euclidean distance threshold for face match
MIN_CONFIDENCE_PERCENT = 40.0        # Reject matches below this confidence
CACHE_TTL_SECONDS = 60               # How often to re-fetch embeddings from DB


# =============================================
# EMBEDDING CACHE — Hot numpy matrix in memory
# =============================================
class EmbeddingCache:
    """
    Keeps a pre-built numpy matrix of ALL enrolled face embeddings in RAM.
    This avoids fetching 1000+ embeddings from Supabase on every scan request.
    
    The matrix shape is (N, 128) where N = number of enrolled students.
    Distance computation is a single vectorized numpy operation: O(N) with SIMD.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._matrix = None         # np.ndarray of shape (N, 128)
        self._student_ids = []      # Parallel list of student_id strings
        self._last_refresh = 0      # Unix timestamp of last DB fetch
        self._count = 0

    def refresh(self, supabase_client, college_user_ids: list):
        """Fetch all embeddings from Supabase and build the numpy matrix."""
        
        # Step 1: Get enrolled student IDs (batched to avoid URL length limit)
        all_student_ids = []
        batch_size = 50
        for i in range(0, len(college_user_ids), batch_size):
            chunk = college_user_ids[i:i + batch_size]
            try:
                res = supabase_client.table("students")\
                    .select("id")\
                    .in_("user_id", chunk)\
                    .eq("is_enrolled", True)\
                    .limit(10000)\
                    .execute()
                if res.data:
                    all_student_ids.extend([s["id"] for s in res.data])
            except Exception as e:
                logger.error(f"Cache refresh: error fetching student batch {i//batch_size}: {e}")

        if not all_student_ids:
            logger.warning("Cache refresh: no enrolled students found")
            with self._lock:
                self._matrix = None
                self._student_ids = []
                self._count = 0
                self._last_refresh = time.time()
            return 0

        # Step 2: Fetch embeddings (batched)
        raw_embeddings = []
        for i in range(0, len(all_student_ids), batch_size):
            chunk = all_student_ids[i:i + batch_size]
            try:
                emb_res = supabase_client.table("face_embeddings")\
                    .select("student_id, embedding")\
                    .in_("student_id", chunk)\
                    .execute()
                if emb_res.data:
                    raw_embeddings.extend(emb_res.data)
            except Exception as e:
                logger.error(f"Cache refresh: error fetching embedding batch {i//batch_size}: {e}")

        if not raw_embeddings:
            logger.warning("Cache refresh: no embeddings found")
            with self._lock:
                self._matrix = None
                self._student_ids = []
                self._count = 0
                self._last_refresh = time.time()
            return 0

        # Step 3: Build the numpy matrix (N, 128) — single allocation
        # ponytail: float32 halves memory, identical accuracy for face distance
        student_ids = [e["student_id"] for e in raw_embeddings]
        matrix = np.array([e["embedding"] for e in raw_embeddings], dtype=np.float32)

        with self._lock:
            self._matrix = matrix
            self._student_ids = student_ids
            self._count = len(student_ids)
            self._last_refresh = time.time()

        logger.info(f"Embedding cache refreshed: {self._count} faces loaded into {matrix.shape} matrix")
        return self._count

    def is_stale(self):
        return (time.time() - self._last_refresh) > CACHE_TTL_SECONDS

    def get(self):
        """Returns (matrix, student_ids) tuple. Thread-safe."""
        # ponytail: return reference directly — callers only read, never mutate
        with self._lock:
            return self._matrix, self._student_ids

    @property
    def count(self):
        return self._count


# Global singleton cache
_cache = EmbeddingCache()


def decode_image(base64_string: str) -> np.ndarray:
    """
    Convert a base64-encoded image (from the mobile camera) into a numpy RGB array.
    """
    # Strip the optional data-URI prefix
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]

    estimated_bytes = len(base64_string) * 3 / 4
    if estimated_bytes > MAX_IMAGE_BYTES:
        raise ValueError(f"Image too large ({estimated_bytes / 1024 / 1024:.1f} MB). Max is {MAX_IMAGE_BYTES / 1024 / 1024:.0f} MB.")

    try:
        image_bytes = base64.b64decode(base64_string)
    except Exception as e:
        raise ValueError(f"Invalid base64 encoding: {e}")

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Cannot open image: {e}")

    w, h = image.size
    if w > MAX_IMAGE_DIMENSION or h > MAX_IMAGE_DIMENSION:
        raise ValueError(f"Image dimensions ({w}x{h}) exceed max ({MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}).")

    # Downscale for faster dlib processing
    PROCESSING_MAX = 640  # Reduced from 1024 — 640px is plenty for face detection
    if w > PROCESSING_MAX or h > PROCESSING_MAX:
        scale = PROCESSING_MAX / max(w, h)
        new_w, new_h = int(w * scale), int(h * scale)
        image = image.resize((new_w, new_h), Image.LANCZOS)
        logger.debug(f"Downscaled image from {w}x{h} to {new_w}x{new_h}")

    return np.array(image)


def extract_embedding(base64_image: str) -> dict:
    """
    Extract the 128-dimensional face embedding from a base64-encoded image.
    """
    try:
        img_array = decode_image(base64_image)
    except ValueError as e:
        logger.warning(f"Image decode failed: {e}")
        return {"success": False, "error": "INVALID_IMAGE", "detail": str(e)}

    face_locations = face_recognition.face_locations(img_array)

    if len(face_locations) == 0:
        return {"success": False, "error": "NO_FACE_DETECTED"}
    if len(face_locations) > 1:
        return {"success": False, "error": "MULTIPLE_FACES_DETECTED"}

    embeddings = face_recognition.face_encodings(img_array, face_locations)
    embedding = embeddings[0]

    logger.info("Face embedding extracted successfully (128-d vector).")
    return {"success": True, "embedding": embedding.tolist()}


def get_cache():
    """Return the global embedding cache singleton."""
    return _cache


def identify_student_fast(
    query_base64: str,
    cache: EmbeddingCache,
    tolerance: float = DEFAULT_TOLERANCE,
    is_front_camera: bool = False
) -> dict:
    """
    FAST 1:N face identification using vectorized numpy distance computation.
    
    Instead of looping through each embedding in Python, this computes
    Euclidean distances against ALL N embeddings in a single numpy broadcast:
    
        distances = sqrt(sum((matrix - query)^2, axis=1))
    
    For 1,000 embeddings this takes ~0.1ms (vs ~50ms with Python loops).
    For 10,000 embeddings this takes ~1ms.
    
    If is_front_camera=True, the image is horizontally flipped to undo the
    mirror effect before face detection.
    """
    t0 = time.time()
    
    try:
        img_array = decode_image(query_base64)
    except ValueError as e:
        logger.warning(f"Query image decode failed: {e}")
        return {"matched": False, "reason": "INVALID_IMAGE", "detail": str(e)}

    # Front camera produces a mirrored image — flip it back to normal
    if is_front_camera:
        img_array = np.fliplr(img_array).copy()
        logger.debug("Front camera image flipped horizontally")

    t1 = time.time()
    face_locations = face_recognition.face_locations(img_array)

    if not face_locations:
        return {"matched": False, "reason": "NO_FACE_IN_FRAME"}

    query_encoding = face_recognition.face_encodings(img_array, face_locations)[0]
    t2 = time.time()

    # Get cached embeddings matrix
    matrix, student_ids = cache.get()
    
    if matrix is None or len(student_ids) == 0:
        return {"matched": False, "reason": "NO_STUDENTS_ENROLLED"}

    # === VECTORIZED DISTANCE COMPUTATION ===
    # Single numpy operation: compute Euclidean distance from query to ALL N embeddings
    # Shape: matrix (N, 128), query (128,) → distances (N,)
    diff = matrix - query_encoding  # Broadcasting: (N, 128)
    distances = np.linalg.norm(diff, axis=1)  # (N,) — all distances in one shot
    
    best_index = int(np.argmin(distances))
    best_distance = distances[best_index]
    t3 = time.time()

    logger.info(
        f"Face search complete: decode={int((t1-t0)*1000)}ms, "
        f"dlib={int((t2-t1)*1000)}ms, "
        f"match={int((t3-t2)*1000)}ms ({len(student_ids)} faces), "
        f"total={int((t3-t0)*1000)}ms"
    )

    if best_distance > tolerance:
        return {"matched": False, "reason": "NO_MATCH_FOUND"}

    confidence = round((1 - best_distance) * 100, 2)

    if confidence < MIN_CONFIDENCE_PERCENT:
        logger.warning(f"Match found but confidence too low: {confidence}%")
        return {"matched": False, "reason": "LOW_CONFIDENCE", "confidence": confidence}

    logger.info(f"Student identified: {student_ids[best_index]} (confidence: {confidence}%)")
    return {
        "matched": True,
        "student_id": student_ids[best_index],
        "confidence": confidence
    }
