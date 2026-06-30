import os
from pathlib import Path

# Resolve backend directory dynamically (assumes layout: project_root/backend/config.py)
BASE_DIR = Path(__file__).resolve().parent

# Core path configurations
DATASETS_DIR = Path(os.getenv("DATASETS_DIR", BASE_DIR / "datasets"))
INGEST_DIR = Path(os.getenv("INGEST_DIR", BASE_DIR / "ingest"))
CACHE_DIR = Path(os.getenv("CACHE_DIR", BASE_DIR / "cache"))
METADATA_PATH = Path(os.getenv("METADATA_PATH", BASE_DIR / "data" / "metadata.json"))
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "best_model_512.pth"))

# Server options
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEVICE = os.getenv("DEVICE", "cpu")

# CORS Configuration
origins_env = os.getenv("ALLOWED_ORIGINS")
if origins_env:
    ALLOWED_ORIGINS = [o.strip() for o in origins_env.split(",") if o.strip()]
else:
    # Local fallback origins
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000"
    ]
