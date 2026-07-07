# CYC-INTEL — Satellite Cyclone Intelligence System
### Complete Workflow Summary for Teammates

---

## 🛰️ What Is This Project?

**CYC-INTEL** is an AI-powered satellite image interpolation platform built for ISRO Hackathon. It takes raw **GOES-19 / INSAT satellite NetCDF imagery** of cyclones and uses a **custom PyTorch CNN-Attention-RIFE model** to synthesize **missing intermediate frames** between two known observations — essentially creating a time-series "video" from sparse satellite snapshots.

---

## 🗂️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                    (Next.js Frontend :3000)                         │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────────────┐
│                  FastAPI Backend Gateway (:8000)                     │
│   routes/: health.py │ dataset.py │ inference.py                    │
│   services/: dataset_scanner.py │ model_loader.py                   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP POST /interpolate (NetCDF files)
┌───────────────────────────▼─────────────────────────────────────────┐
│            HuggingFace Spaces Inference Microservice                 │
│         (CNN-Attention-RIFE PyTorch Model, CPU inference)            │
│         Returns: gzip-compressed .npy float32 array                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Layout

```
ISRO Hackathon/
├── frontend/               ← Next.js 14 web app (TypeScript)
│   ├── app/
│   │   ├── page.tsx        ← Landing/hero page
│   │   ├── cyclone/[id]/   ← Per-cyclone detail page
│   │   ├── explorer/       ← Dataset explorer page
│   │   ├── demo/           ← Live demo page
│   │   └── about/          ← About page
│   ├── components/
│   │   ├── workspace/      ← Core UI: timeline, image panels, comparison viewer
│   │   ├── maps/           ← Satellite viewer map component
│   │   ├── cards/          ← GlassCard, StatCard UI cards
│   │   ├── charts/         ← Chart components
│   │   ├── common/         ← Starfield, GlobeWireframe, dividers
│   │   ├── layout/         ← Navbar, footer, page wrappers
│   │   └── ui/             ← Button, Badge base components
│   └── hooks/ lib/ utils/  ← Custom hooks, API client, type definitions
│
├── backend/                ← FastAPI Python app (entry: app.py)
│   ├── routes/
│   │   ├── inference.py    ← /generate  (database-based) & /upload_generate
│   │   ├── dataset.py      ← /cyclones, /cyclone/{id}, /frame, /ingest, /clear_cache
│   │   └── health.py       ← /health
│   ├── services/
│   │   ├── dataset_scanner.py ← Scans NetCDF files, builds metadata.json
│   │   ├── model_loader.py    ← PyTorch model loader (local fallback)
│   │   └── interpolation.py  ← Local inference helpers
│   ├── config.py           ← Paths, CORS, device, env vars
│   ├── datasets/           ← Raw satellite .nc files (organized by sat/cyclone)
│   ├── ingest/             ← Drop folder for new raw .nc files
│   ├── cache/              ← Generated interpolated .nc + preview .png files
│   └── models/             ← best_model_512.pth (PyTorch weights)
│
├── huggingface_space/      ← Deployed model inference microservice
│   ├── app.py              ← FastAPI /interpolate endpoint
│   └── model/
│       └── architecture.py ← CNN_Attention_RIFE_Temporal model definition
│
├── docker-compose.yml      ← Orchestrates frontend + backend containers
└── notebooks/              ← Model training / experimentation notebooks
```

---

## 🔄 Core Workflow: Step by Step

### Step 1 — Data Ingestion
Raw **GOES-19 NetCDF (.nc) files** (GOES ABI Level-2 Cloud & Moisture Imagery, Band 13 — IR) are placed in `backend/ingest/`. The `POST /ingest` API endpoint triggers `dataset_scanner.py` which:
- Parses filenames to extract timestamps (e.g., `_s20252960740213_` → `07:40`)
- Moves files to `backend/datasets/{SATELLITE}/{CYCLONE_ID}/`
- Generates preview PNGs (false-color viridis colormap, normalized 215.5K–299.25K)
- Writes a `metadata.json` registry indexing all available frames

### Step 2 — Frontend: Browse Available Cyclones
The frontend calls `GET /cyclones` and displays the registered cyclone datasets. Each cyclone card shows the satellite source, available timestamps, and thumbnail previews.

### Step 3 — Frame Interpolation (Database Mode)
User selects two known frames and clicks **Generate**:

```
Frontend → POST /generate {
    satellite: "GOES19",
    cyclone_id: "AMPHAN",
    frame_a_time: "07:40",
    frame_b_time: "07:50",
    timestep: 0.5          ← 0.0=A, 1.0=B, 0.5=midpoint
}
```

Backend flow:
1. Resolves source `.nc` files from `datasets/` or `cache/` (supports chained interpolation)
2. Calculates target timestamp: `07:40 + (07:50 - 07:40) × 0.5 = 07:45`
3. Checks if result already cached → returns immediately (cache hit)
4. Otherwise → **dispatches background task** → returns `{status: "processing"}`
5. Frontend **polls** until `{status: "complete"}` (with base64 PNG data in response)

Background task:
- POSTs both `.nc` files to **HuggingFace Spaces** `/interpolate`
- HF model runs patch-based inference (512×512 patches with 64px overlap + Hanning window blending)
- Returns `gzip(.npy)` → saves as `.nc` + false-color `.png` + error heatmap `_diff.png`
- Computes quality metrics: **SSIM, PSNR, MSE, FSIM** (vs. ground truth if available)
- Registers new frame in metadata index

### Step 4 — Frame Interpolation (Custom Upload Mode)
User can also upload **any two custom `.nc` files** via `POST /upload_generate`:
- Bypasses the cyclone database
- Same HF Spaces inference pipeline
- Returns generated frame + Frame A preview + Frame B preview + difference heatmap

### Step 5 — Frame Serving
All frames (raw, interpolated, difference) are served securely via:
```
GET /frame?satellite=GOES19&cyclone_id=AMPHAN&timestamp=07:45&type=interpolated&format=png
GET /frame?satellite=GOES19&cyclone_id=AMPHAN&timestamp=07:45&type=difference&format=png
GET /frame?satellite=GOES19&cyclone_id=AMPHAN&timestamp=07:45&type=interpolated&format=nc
```
No absolute filesystem paths are ever exposed. If a cached PNG is missing (ephemeral disk restart), it is regenerated from the `.nc` file on-the-fly.

---

## 🧠 The AI Model

**Architecture:** `CNN_Attention_RIFE_Temporal`

- Based on **RIFE (Real-Time Intermediate Flow Estimation)** adapted for single-channel satellite thermal imagery
- Adds **CNN feature extraction + Attention mechanism** to handle large satellite image spatial patterns
- Input: Two normalized CMI frames (channel 1, float32) + scalar timestep `t ∈ [0,1]`
- Output: Synthesized intermediate CMI frame at time `t`
- Inference: **Patch-based** (512×512 tiles, 64px overlap, Hanning window blending for seamless seams)
- Training data normalization range: `[215.5 K, 299.25 K]` (brightness temperature)
- Weights file: `best_model_512.pth` (~33MB)
- Deployed on **HuggingFace Spaces (CPU)** with 10-minute inference timeout

---

## 🖥️ Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Landing** | `/` | Hero page, project overview, animated globe, feature cards |
| **Cyclone Detail** | `/cyclone/[id]` | Per-cyclone timeline + inference workspace |
| **Explorer** | `/explorer` | Browse all available cyclone datasets |
| **Demo** | `/demo` | Live demo with upload workspace |
| **About** | `/about` | Project background and methodology |

### Key Frontend Components

- **`ScientificComparisonWorkspace.tsx`** — The main analysis workspace (55KB). Shows side-by-side frame comparison, metric scores, timeline controls, download buttons.
- **`Timeline.tsx`** — Interactive time-axis showing raw and interpolated frames
- **`ImagePanel.tsx`** — Individual frame viewer with zoom/pan
- **`UploadWorkspace.tsx`** — Drag-and-drop UI for the custom upload flow
- **`SatelliteViewer.tsx`** — Leaflet-based map showing satellite footprint

---

## 🐳 Deployment

### Local Development
```bash
npm run dev          # Start both frontend (:3000) and backend (:8000) concurrently
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only
```

### Docker Compose (Production)
```bash
docker compose up --build -d
```
- **Frontend container**: Next.js on port 3000
- **Backend container**: FastAPI/uvicorn on port 8000
- **Volumes**: `datasets/`, `models/`, `cache/` persisted across restarts

### Environment Variables (Backend `.env`)
| Variable | Purpose |
|----------|---------|
| `HF_SPACES_URL` | URL of the HuggingFace Spaces inference service |
| `DATASETS_DIR` | Path to raw NetCDF datasets |
| `CACHE_DIR` | Path to generated frame cache |
| `MODEL_PATH` | Path to `.pth` weights file |
| `ALLOWED_ORIGINS` | CORS-allowed frontend origins |
| `GLOBAL_MIN/MAX` | Normalization constants (215.5 / 299.25) |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | System health + model status |
| `GET` | `/cyclones` | List all registered cyclone datasets |
| `GET` | `/cyclone/{id}` | Get single cyclone metadata + frame list |
| `GET` | `/datasets` | List available satellite sources |
| `GET` | `/frame` | Serve raw/interpolated/difference frame (PNG or NC) |
| `POST` | `/ingest` | Trigger scan of `ingest/` folder → build metadata |
| `POST` | `/generate` | Interpolate between two database frames (async + poll) |
| `POST` | `/upload_generate` | Interpolate two custom uploaded NC files (sync) |
| `GET` | `/clear_cache` | Wipe all generated caches and rebuild metadata |

---

## 🔑 Key Design Decisions

1. **Async background inference**: HF Spaces can take minutes on CPU. The backend immediately returns `{status: "processing"}` and the frontend polls until completion, preventing HTTP timeout errors.

2. **Cache-first architecture**: Every generated frame is persisted as `.nc` + `.png` + `_diff.png`. Cache hits return instantly without re-running inference.

3. **Chained interpolation support**: Generated frames go back into the index, so you can interpolate between a raw and a previously-generated frame to achieve finer temporal resolution (e.g., 10-min → 5-min → 2.5-min gaps).

4. **Secure frame serving**: The `/frame` endpoint uses query parameters instead of exposing filesystem paths, with automatic PNG regeneration from `.nc` if files are lost on ephemeral storage.

5. **Memory-efficient streaming**: HF inference response is streamed directly to disk in 1MB chunks. Arrays are read sliced from disk where possible, keeping RAM under control for large (5400×5400px) satellite tiles.

---

## 🧪 Quality Metrics Computed

After each inference, the backend computes (vs. ground truth `.nc` if available):
- **SSIM** — Structural Similarity Index
- **PSNR** — Peak Signal-to-Noise Ratio (dB)
- **MSE** — Mean Squared Error (physical units K²)
- **FSIM** — Feature Similarity Index

These are displayed in the frontend's scientific comparison workspace.
