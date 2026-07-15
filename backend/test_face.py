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
