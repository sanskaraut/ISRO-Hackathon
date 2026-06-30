import os
from fastapi import APIRouter
from schemas.responses import HealthResponse
from services.dataset_scanner import get_metadata_index

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    import config
    metadata = get_metadata_index()
    hf_url = os.getenv("HF_SPACES_URL", "")

    # Calculate indexed count across all nested cyclones
    count = 0
    if metadata:
        for sat, sat_data in metadata.items():
            count += len(sat_data)

    # Count actual generated NetCDF files in the cache directory
    generated_count = 0
    if config.CACHE_DIR.exists():
        generated_count = len([f for f in config.CACHE_DIR.iterdir() if f.suffix == ".nc"])

    return HealthResponse(
        status="healthy",
        model_loaded=bool(hf_url),   # "loaded" means HF Spaces URL is configured
        device=f"HF Spaces ({hf_url})" if hf_url else "Not configured",
        datasets_indexed=count,
        generated_frames=generated_count
    )
