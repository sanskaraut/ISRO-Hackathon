import os
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from schemas.responses import DatasetResponse, CycloneMetadata
from services.dataset_scanner import get_metadata_index

router = APIRouter()

@router.get("/datasets", response_model=DatasetResponse)
def get_datasets():
    metadata = get_metadata_index()
    # Return available satellites from our scanner index
    return DatasetResponse(satellites=list(metadata.keys()))

@router.get("/cyclones")
def get_all_cyclones():
    metadata = get_metadata_index()
    if not metadata:
        return []
    
    # Flatten the metadata dictionary across all satellites
    cyclones_list = []
    for sat, sat_data in metadata.items():
        for cy, cy_data in sat_data.items():
            cyclones_list.append(cy_data)
    return cyclones_list

@router.post("/ingest")
def trigger_ingestion():
    """
    Triggers parsing of raw NetCDF files in the ingest/ folder,
    moves them to datasets/, generates previews, rebuilds metadata registry,
    and returns the updated cyclone registry.
    """
    from services.dataset_scanner import scan_and_generate_metadata, get_metadata_index
    try:
        scan_and_generate_metadata()
        metadata = get_metadata_index()
        cyclones_list = []
        for sat, sat_data in metadata.items():
            for cy, cy_data in sat_data.items():
                cyclones_list.append(cy_data)
        return {"success": True, "cyclones": cyclones_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.get("/cyclone/{id}", response_model=CycloneMetadata)
def get_cyclone_by_id(id: str):
    metadata = get_metadata_index()
    if not metadata:
        raise HTTPException(status_code=500, detail="Cyclone datasets not scanned yet.")
        
    for sat, sat_data in metadata.items():
        if id.upper() in sat_data:
            return sat_data[id.upper()]
            
    raise HTTPException(status_code=404, detail=f"Cyclone dataset '{id}' not found.")

@router.get("/frame")
def get_frame(
    satellite: str = Query(..., description="Target satellite sensor (e.g. GOES19)"),
    cyclone_id: str = Query(..., description="Target cyclone ID (e.g. AMPHAN)"),
    timestamp: str = Query(..., description="Target timestamp (e.g. 01:00 or 01:15)"),
    type: str = Query("raw", description="Frame type: 'raw', 'interpolated', 'difference'"),
    format: str = Query("png", description="File format: 'png' or 'nc'")
):
    """
    Securely serve image previews and NetCDF data layers without exposing internal server paths.
    """
    import config
    from pathlib import Path
    
    # Clean inputs
    sat = "".join(c for c in satellite if c.isalnum() or c in "-_").upper()
    cy = "".join(c for c in cyclone_id if c.isalnum() or c in "-_").upper()
    t_clean = timestamp.replace(":", "")
    
    if format not in ["png", "nc"]:
        raise HTTPException(status_code=400, detail="Invalid format. Supported: png, nc")
        
    if type not in ["raw", "interpolated", "difference"]:
        raise HTTPException(status_code=400, detail="Invalid type. Supported: raw, interpolated, difference")
        
    if type == "raw":
        # Raw frames reside in datasets_root/{satellite}/{cyclone_id}/{timestamp}.[png|nc]
        filename = f"{t_clean}.{format}"
        full_path = config.DATASETS_DIR / sat / cy / filename
    else:
        # Interpolated and difference frames reside in cache_root/
        # Filename structure: rec_{satellite}_{cyclone_id}_{t_clean}[_diff].[png|nc]
        suffix = "_diff" if type == "difference" else ""
        filename = f"rec_{sat}_{cy}_{t_clean}{suffix}.{format}"
        full_path = config.CACHE_DIR / filename
        
    if not full_path.exists():
        # PNG may have been wiped by an ephemeral-disk restart — try regenerating from NC
        if format == "png" and type in ("interpolated", "difference"):
            nc_path = config.CACHE_DIR / f"rec_{sat}_{cy}_{t_clean}.nc"
            if nc_path.exists():
                import numpy as np
                import xarray as xr
                from services.dataset_scanner import array_to_png
                try:
                    ds = xr.open_dataset(str(nc_path))
                    arr = ds["CMI"].values.astype(np.float32)
                    ds.close()
                    global_min = float(os.getenv("GLOBAL_MIN", "215.5"))
                    global_max = float(os.getenv("GLOBAL_MAX", "299.25"))
                    if type == "difference":
                        diff_norm = np.clip(np.abs(arr) / 20.0, 0.0, 1.0)
                        diff_gray = (diff_norm * 255).astype(np.uint8)
                        h, w = arr.shape
                        diff_rgb = np.zeros((h, w, 3), dtype=np.uint8)
                        diff_rgb[..., 0] = diff_gray
                        diff_rgb[..., 1] = (diff_gray * 0.15).astype(np.uint8)
                        diff_rgb[..., 2] = 20
                        from PIL import Image as _Image
                        _Image.fromarray(diff_rgb).save(str(full_path), "PNG")
                    else:
                        array_to_png(arr, global_min, global_max, full_path)
                except Exception as regen_err:
                    raise HTTPException(
                        status_code=404,
                        detail=f"File missing and regeneration failed: {regen_err}"
                    )
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Requested {type} file not found (Format: {format}, Path: {filename})."
                )
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Requested {type} file not found (Format: {format}, Path: {filename})."
            )
        
    media_type = "image/png" if format == "png" else "application/x-netcdf"
    return FileResponse(str(full_path), media_type=media_type)


@router.post("/clear_cache")
def clear_cache():
    """
    Deletes all generated cache files (NetCDFs, previews, heatmaps) and rebuilds a clean metadata index.
    """
    import shutil
    import logging
    import config
    from services.dataset_scanner import scan_and_generate_metadata
    from routes.inference import RUNNING_TASKS
    
    logger = logging.getLogger("app")
    logger.info("[CLEAR CACHE] Initiating database cache wipe...")
    
    # 1. Clear running inference task registry
    RUNNING_TASKS.clear()
    
    # 2. Delete all cached NetCDF and preview PNG files
    if config.CACHE_DIR.exists():
        try:
            for item in config.CACHE_DIR.iterdir():
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
            logger.info("[CLEAR CACHE] Cache folder wiped successfully.")
        except Exception as e:
            logger.error(f"[CLEAR CACHE] Error wiping cache directory: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to wipe cache directory: {e}")
            
    # 3. Re-scan raw datasets to build clean metadata.json index
    try:
        scan_and_generate_metadata()
        logger.info("[CLEAR CACHE] Metadata index rebuilt successfully.")
    except Exception as e:
        logger.error(f"[CLEAR CACHE] Error scanning raw datasets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to rebuild metadata: {e}")
        
    return {"success": True, "message": "All generated caches and index registries cleared successfully."}

