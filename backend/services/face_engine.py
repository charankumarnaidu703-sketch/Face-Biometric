"""
Face Engine — Core AI module for all face recognition operations.

Responsibilities:
  1. Decode base64 images from the mobile app into numpy arrays.
  2. Extract 128-dimensional face embeddings from a single-face photo.
  3. Compare a live query face against all stored student embeddings.

Uses dlib's ResNet model (via face_recognition) for embedding extraction
and Euclidean distance for comparison.
"""

import face_recognition
import numpy as np
from PIL import Image
import io
import base64
import logging

logger = logging.getLogger(__name__)

# --- Constants ---
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB hard limit for incoming base64 images
MAX_IMAGE_DIMENSION = 4096           # Reject images wider/taller than this
DEFAULT_TOLERANCE = 0.5              # Euclidean distance threshold for face match
MIN_CONFIDENCE_PERCENT = 40.0        # Reject matches below this confidence


def decode_image(base64_string: str) -> np.ndarray:
    """
    Convert a base64-encoded image (from the mobile camera) into a numpy RGB array.

    Handles the optional `data:image/...;base64,` prefix that browsers/React Native
    sometimes prepend to the raw base64 data.

    Raises:
        ValueError: If the image is too large, corrupted, or cannot be decoded.
    """
    # Strip the optional data-URI prefix (e.g. "data:image/jpeg;base64,...")
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]

    # Guard against oversized payloads before decoding
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

    # Reject extremely large images that would slow down dlib's HOG detector
    w, h = image.size
    if w > MAX_IMAGE_DIMENSION or h > MAX_IMAGE_DIMENSION:
        raise ValueError(f"Image dimensions ({w}x{h}) exceed max ({MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}).")

    return np.array(image)


def extract_embedding(base64_image: str) -> dict:
    """
    Extract the 128-dimensional face embedding from a base64-encoded image.

    Returns:
        On success: {"success": True, "embedding": [float, ...]}
        On failure: {"success": False, "error": "ERROR_CODE"}

    Error codes:
        - INVALID_IMAGE: The image could not be decoded or is too large.
        - NO_FACE_DETECTED: No human face was found in the image.
        - MULTIPLE_FACES_DETECTED: More than one face was found (ambiguous enrollment).
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
    return {
        "success": True,
        "embedding": embedding.tolist()
    }


def identify_student(
    query_base64: str,
    all_embeddings: list,
    tolerance: float = DEFAULT_TOLERANCE
) -> dict:
    """
    Compare a live camera frame (base64) against all stored student embeddings.
    Returns the best match if one exists above the confidence threshold.

    Args:
        query_base64: Base64-encoded image from the mobile camera.
        all_embeddings: List of dicts, each with keys "student_id" and "embedding".
        tolerance: Euclidean distance threshold (lower = stricter). Default 0.5.

    Returns:
        On match:    {"matched": True, "student_id": "...", "confidence": 75.23}
        On no match: {"matched": False, "reason": "REASON_CODE"}

    Reason codes:
        - INVALID_IMAGE: The query image could not be decoded.
        - NO_FACE_IN_FRAME: No face detected in the camera frame.
        - NO_STUDENTS_ENROLLED: The database has no enrolled face embeddings.
        - NO_MATCH_FOUND: No stored face is close enough to the query face.
        - BELOW_THRESHOLD: Best match exists but falls below the tolerance.
        - LOW_CONFIDENCE: Match found but confidence is below minimum threshold.
    """
    try:
        img_array = decode_image(query_base64)
    except ValueError as e:
        logger.warning(f"Query image decode failed: {e}")
        return {"matched": False, "reason": "INVALID_IMAGE", "detail": str(e)}

    face_locations = face_recognition.face_locations(img_array)

    if not face_locations:
        return {"matched": False, "reason": "NO_FACE_IN_FRAME"}

    # Use the first (largest) detected face for matching
    query_encoding = face_recognition.face_encodings(img_array, face_locations)[0]

    known_encodings = [np.array(e["embedding"]) for e in all_embeddings]
    known_ids = [e["student_id"] for e in all_embeddings]

    if not known_encodings:
        return {"matched": False, "reason": "NO_STUDENTS_ENROLLED"}

    matches = face_recognition.compare_faces(known_encodings, query_encoding, tolerance=tolerance)
    face_distances = face_recognition.face_distance(known_encodings, query_encoding)

    if True not in matches:
        return {"matched": False, "reason": "NO_MATCH_FOUND"}

    best_index = int(np.argmin(face_distances))

    if not matches[best_index]:
        return {"matched": False, "reason": "BELOW_THRESHOLD"}

    confidence = round((1 - face_distances[best_index]) * 100, 2)

    # Extra safety: reject matches with very low confidence even if within tolerance
    if confidence < MIN_CONFIDENCE_PERCENT:
        logger.warning(f"Match found but confidence too low: {confidence}%")
        return {"matched": False, "reason": "LOW_CONFIDENCE", "confidence": confidence}

    logger.info(f"Student identified: {known_ids[best_index]} (confidence: {confidence}%)")
    return {
        "matched": True,
        "student_id": known_ids[best_index],
        "confidence": confidence
    }
