FROM python:3.11-slim-bookworm

# Install build tools and C++ libraries required for dlib compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    g++ \
    libatlas-base-dev \
    libjpeg-dev \
    liblapack-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose port 8000
EXPOSE 8000

# Run ASGI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
