FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system libraries required by netCDF4 and HDF5
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libnetcdf-dev \
    libhdf5-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (CPU-only torch)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Copy application source
COPY . .

# Create model weight directory placeholder
RUN mkdir -p models

# Expose Hugging Face Spaces default port
EXPOSE 7860

# Start microservice
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860", "--timeout-keep-alive", "300"]
