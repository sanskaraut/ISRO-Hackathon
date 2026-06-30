FROM python:3.11-slim

# Set system-level environment flags
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for NetCDF4 and HDF5 C-bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libnetcdf-dev \
    libhdf5-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to optimize layer caching
COPY backend/requirements.txt .

# Install dependencies, forcing CPU-only torch to minimize container footprint
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy the backend source files
COPY backend ./backend

# Default directory allocations
RUN mkdir -p backend/datasets backend/ingest backend/cache backend/data backend/models

# Expose backend API gateway port
EXPOSE 8000

# Start FastAPI gateway using Python
CMD ["python", "backend/app.py"]
