# Cyclone Interpolation System — Deployment Guide

This document describes how to configure, run, and deploy the Satellite Cyclone Image Interpolation system (frontend and backend) to production.

---

## 1. Project Directory Structure

Ensure the following layout is maintained on the host system:

```text
ISRO Hackathon/
├── backend/                  # FastAPI Application Source Code
│   ├── cache/                # [Auto-created] Model output registry cache
│   ├── data/                 # [Auto-created] Stores metadata.json
│   ├── datasets/             # [Persistent] Historical NetCDF datasets
│   │   └── GOES19/
│   │       └── MELISSA/      # Standard NetCDF imagery (.nc & .png previews)
│   ├── ingest/               # [Auto-created] Incoming drop directory for raw telemetry
│   ├── models/               # Neural network weights directory
│   │   └── best_model_512.pth # Trained PyTorch checkpoint
│   ├── routes/               # API Router endpoints
│   ├── services/             # Core ML loaders & scanners
│   ├── config.py             # Centralized environment-aware configuration
│   ├── Dockerfile            # Container definition for backend
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js UI Application Source Code
│   ├── app/                  # Route views (Workflow, Compare, Upload)
│   ├── components/           # UI Layouts & map panels
│   └── Dockerfile            # Container definition for frontend
├── docker-compose.yml        # Orchestration compose configurations
└── .env.example              # Sample environment template
```

---

## 2. Environment Variables Reference

A `.env` file should be placed at the project root. The following parameters configure both services:

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `HOST` | Backend server binding address | `0.0.0.0` |
| `PORT` | Backend server port | `8000` |
| `DEVICE` | PyTorch execution device (`cpu` or `cuda`) | `cpu` |
| `DATASETS_DIR` | Directory containing processed datasets | `backend/datasets` |
| `INGEST_DIR` | Ingest drop box for raw NetCDF drops | `backend/ingest` |
| `CACHE_DIR` | Directory for cache persistence | `backend/cache` |
| `METADATA_PATH` | Path to dataset JSON index file | `backend/data/metadata.json` |
| `MODEL_PATH` | Path to PyTorch model weights | `backend/models/best_model_512.pth` |
| `ALLOWED_ORIGINS` | Permitted CORS Origins (comma-separated) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Public URL of backend API (frontend client) | `http://localhost:8000` |

---

## 3. Local Development Setup

### A. Backend Setup
1. Navigate to the root directory and ensure you are using Python 3.11+.
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install PyTorch (CPU-only version is recommended for systems without Nvidia GPUs to reduce install sizes):
   ```bash
   pip install torch --extra-index-url https://download.pytorch.org/whl/cpu
   ```
4. Install remaining dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
5. Run the FastAPI development server:
   ```bash
   python backend/app.py
   ```

### B. Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Set the environment variable:
   Create a `.env.local` containing:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the system dashboard.

---

## 4. Docker Deployment (Recommended for Production)

Orchestrate both frontend and backend using Docker Compose.

### Step 1: Place weights & data
Make sure `models/best_model_512.pth` and your NetCDF folders inside `datasets/` exist on the host system.

### Step 2: Build & Spin up Containers
From the root directory, run:
```bash
docker compose up --build -d
```
Docker compose will:
1. Compile the FastAPI backend with CPU-only PyTorch optimization.
2. Compile the Next.js production build using your defined `NEXT_PUBLIC_API_URL`.
3. Mount the directories `datasets/`, `ingest/`, `models/`, and `cache/` as persistent volumes.

To shut down:
```bash
docker compose down
```

---

## 5. Cloud Platform Deployments

### A. Backend Deployment (Render / Railway / GCP Cloud Run)
- **Engine**: Choose Docker or Python 3.11.
- **Port**: Bind port to `8000` (or as defined by the platform's `$PORT`).
- **Resource Allocation**: Ensure at least 2GB of RAM is allocated (CPU PyTorch warm-up requires substantial memory).
- **Environment**: Define `ALLOWED_ORIGINS` to point to your deployed frontend domain.

### B. Frontend Deployment (Vercel / Netlify)
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment Variables**: Define `NEXT_PUBLIC_API_URL` pointing to your deployed backend API URL.

---

## 6. Real-Time Telemetry Ingestion Workflow

To dynamically ingest new telemetry observations:
1. Drop any original `.nc` format weather imagery file into the `ingest/` directory.
2. The backend system will automatically scan this folder on startup or when the scan endpoint is triggered.
3. The system parses the filename to identify the satellite (e.g. `INSAT-3D`, `GOES19`) and timestamp.
4. NetCDF internal metadata is parsed to discover storm attributes (e.g., `Cyclone Amphan`).
5. A cyclone directory is automatically mapped, the `.nc` file is moved, a false-color `.png` preview is generated, and the source file is safely unlinked.
