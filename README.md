# Satellite Cyclone Intelligence System (CYC-INTEL)

This repository hosts the Satellite Frame Interpolation system, comprising a Next.js web interface (frontend) and a FastAPI PyTorch inference service (backend).

For full step-by-step production setup, environment configurations, cloud deployment options, and telemetry ingestion instructions, please refer to the [Deployment Guide](file:///d:/Programming/GitHub/ISRO%20Hackathon/deployment.md).

---

## 1. Project Directory Layout

The project is organized as follows:

```text
├── backend/                  # FastAPI Python application (PyTorch model)
│   ├── app.py                # Backend entry point
│   ├── config.py             # Centralized environment-aware configuration
│   ├── routes/               # API endpoints (inference, datasets, health)
│   ├── services/             # Core logic (model loader, dataset scanner)
│   └── cache/                # Interpolated frame caches
├── frontend/                 # Next.js web application
│   ├── app/                  # App router pages & layouts
│   ├── components/           # UI and map components
│   └── package.json          # Frontend configuration
├── datasets/                 # Local NetCDF/PNG cyclone datasets (GOES19)
├── ingest/                   # Ingest drops folder for raw NetCDF observations
├── models/                   # Neural network weights directory
│   └── best_model_512.pth    # PyTorch model weights
├── docker-compose.yml        # Orchestration compose configurations
└── README.md                 # This file
```

---

## 2. Getting Started

### Prerequisites
1. **Python 3.11+**: For backend execution.
2. **Node.js 18+**: For running the web application.
3. **Docker & Compose (Optional)**: For containerized deployments.

### Local Run Commands

You can run both the frontend and backend servers concurrently from the root directory:

```bash
# Run both frontend and backend concurrently
npm run dev

# Run only backend
npm run dev:backend

# Run only frontend
npm run dev:frontend
```

---

## 3. Docker Compose Orchestration

To run containerized production services, simply run:
```bash
docker compose up --build -d
```
This builds and connects the frontend (port 3000) and backend (port 8000) services with volume persistence for datasets, model checkpoints, and caches.

---

## 4. API Endpoints

- **Health Check**: `GET /health`
- **List Datasets**: `GET /cyclones`
- **Frame Ingestion/Discovery**: `GET /frame?satellite=...&cyclone_id=...&timestamp=...&type=raw|interpolated|difference&format=png|nc`
- **Model Inference**: `POST /generate` (Interpolate frames between database anchors)
- **Custom NetCDF Ingestion**: `POST /upload_generate` (Accepts two raw NetCDF uploads, performs interpolation, and generates discrepancy heatmaps)
