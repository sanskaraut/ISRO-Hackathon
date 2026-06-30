from fastapi import APIRouter
from schemas.responses import HealthResponse
from services.model_loader import get_model, get_device
from services.dataset_scanner import get_metadata_index

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    import config
    model = get_model()
    device = get_device()
    metadata = get_metadata_index()
    
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
        model_loaded=model is not None,
        device=str(device) if device is not None else "Not Initialized",
        datasets_indexed=count,
        generated_frames=generated_count
    )
