import os
import sys
import uvicorn
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Resolve project paths to ensure relative imports compile
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.extend([current_dir, project_root])

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("app")

import config
from services.dataset_scanner import scan_and_generate_metadata
from routes import health, dataset, inference

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("======================================================")
    logger.info("[STARTUP] SATELLITE CYCLONE INTELLIGENCE SYSTEM")
    logger.info("======================================================")
    
    # Verify/create required directories
    for name, path in [
        ("Datasets", config.DATASETS_DIR),
        ("Ingest", config.INGEST_DIR),
        ("Cache", config.CACHE_DIR),
        ("Metadata Parent", config.METADATA_PATH.parent)
    ]:
        if not path.exists():
            logger.info(f"[STARTUP] Directory for {name} does not exist. Creating: {path}")
            path.mkdir(parents=True, exist_ok=True)

    # Check HF_SPACES_URL is configured
    import os
    hf_url = os.getenv("HF_SPACES_URL", "")
    if not hf_url:
        logger.warning("[STARTUP] HF_SPACES_URL is not set. Inference calls will fail.")
    else:
        logger.info(f"[STARTUP] HF Spaces inference endpoint: {hf_url}")

    # Ingest original NetCDF imagery and build simulated multi-temporal database (optional)
    # scan_and_generate_metadata()

    logger.info("======================================================")
    logger.info(f"[GATEWAY] API IS READY FOR FRONTEND REQUESTS ON {config.HOST}:{config.PORT}")
    logger.info("======================================================")
    yield

app = FastAPI(
    lifespan=lifespan,
    title="CYC-INTEL // Satellite Image Interpolation API",
    description="Backend API Gateway handling PyTorch temporal interpolation on INSAT / GOES weather telemetry.",
    version="1.0.0"
)

# Configure CORS using Allowed Origins from environment configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health.router, tags=["System Health"])
app.include_router(dataset.router, tags=["Satellite Datasets"])
app.include_router(inference.router, tags=["Model Inference"])

if __name__ == "__main__":
    uvicorn.run("app:app", host=config.HOST, port=config.PORT, reload=False)
