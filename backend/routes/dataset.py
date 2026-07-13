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
    format: str = Query("png", description="File format: 'png' or 'nc'"),
    colormap: str = Query("cyan", description="Colormap: 'cyan', 'grayscale', 'thermal'")
):
    """
    Securely serve image previews and NetCDF data layers with dynamic colormap support
    and clean white outer space backgrounds.
    """
    import config
    import io
    import numpy as np
    import netCDF4 as _nc4
    from pathlib import Path
    from PIL import Image as _Image
    from fastapi.responses import Response
    
    # Clean inputs
    sat = "".join(c for c in satellite if c.isalnum() or c in "-_").upper()
    cy = "".join(c for c in cyclone_id if c.isalnum() or c in "-_").upper()
    t_clean = timestamp.replace(":", "")
    
    if format not in ["png", "nc"]:
        raise HTTPException(status_code=400, detail="Invalid format. Supported: png, nc")
        
    if type not in ["raw", "interpolated", "difference"]:
        raise HTTPException(status_code=400, detail="Invalid type. Supported: raw, interpolated, difference")
        
    # Determine raw or cache source NC file path
    if type == "raw":
        nc_filename = f"{t_clean}.nc"
        nc_path = config.DATASETS_DIR / sat / cy / nc_filename
    else:
        suffix = "_diff" if type == "difference" else ""
        nc_filename = f"rec_{sat}_{cy}_{t_clean}{suffix}.nc"
        # If it's a difference type, the data is computed between generated CMI and Ground Truth
        # But wait! Cache files for generated frames are rec_{sat}_{cy}_{t_clean}.nc.
        # We can just open the generated NC file, and if difference is requested, we also open the raw GT NC file.
        nc_path = config.CACHE_DIR / f"rec_{sat}_{cy}_{t_clean}.nc"

    # If NetCDF format is requested, serve it directly
    if format == "nc":
        if type == "raw":
            real_path = nc_path
        else:
            suffix = "_diff" if type == "difference" else ""
            real_path = config.CACHE_DIR / f"rec_{sat}_{cy}_{t_clean}{suffix}.nc"
            
        if not real_path.exists():
            raise HTTPException(status_code=404, detail="NetCDF file not found.")
        return FileResponse(str(real_path), media_type="application/x-netcdf")

    # For PNG previews: check if we can serve pre-computed default cyan PNG for raw frames to save CPU cycles
    if colormap == "cyan" and type == "raw" and format == "png":
        png_path = config.DATASETS_DIR / sat / cy / f"{t_clean}.png"
        if png_path.exists():
            return FileResponse(str(png_path), media_type="image/png")

    # If the source NC file doesn't exist, we can't render anything
    if not nc_path.exists():
        raise HTTPException(status_code=404, detail=f"Source NetCDF array not found for rendering.")

    try:
        global_min = float(os.getenv("GLOBAL_MIN", "215.5"))
        global_max = float(os.getenv("GLOBAL_MAX", "299.25"))

        # Read only the downsampled slice directly from disk to avoid loading 112 MB into RAM
        with config.NETCDF_LOCK:
            with _nc4.Dataset(str(nc_path), "r") as _ds:
                var = _ds.variables["CMI"]
                h_full, w_full = var.shape
                preview_size = 1024
                factor = max(1, h_full // preview_size)
                # Sliced read — netCDF4 only loads the strided rows from disk
                downsampled = var[::factor, ::factor].astype(np.float32)

        # Find nan mask (outer space background region) before filling NaNs
        nan_mask = np.isnan(downsampled)
        # Fill NaNs so subsequent arithmetic doesn't produce RuntimeWarning or garbage pixels
        downsampled = np.nan_to_num(downsampled, nan=global_min)

        if type == "difference":
            # For difference heatmaps: load actual GT NC to compute difference if available,
            # otherwise fall back to gradients
            gt_nc_path = config.DATASETS_DIR / sat / cy / f"{t_clean}.nc"
            diff_img = None

            if gt_nc_path.exists():
                try:
                    with config.NETCDF_LOCK:
                        with _nc4.Dataset(str(gt_nc_path), "r") as _ds_gt:
                            _var_gt = _ds_gt.variables["CMI"]
                            gt_down = _var_gt[::factor, ::factor].astype(np.float32)
                    gt_down = np.nan_to_num(gt_down, nan=global_min)
                    # Compute difference between generated downsampled and GT downsampled
                    h_m = min(downsampled.shape[0], gt_down.shape[0])
                    w_m = min(downsampled.shape[1], gt_down.shape[1])
                    diff_img = np.abs(downsampled[:h_m, :w_m] - gt_down[:h_m, :w_m])
                    del gt_down
                except Exception:
                    pass

            if diff_img is None:
                # Gradient-based fallback difference map
                grad_y, _ = np.gradient(downsampled)
                diff_img = np.abs(grad_y) * 4.5
                
            diff_norm = np.clip(diff_img / 20.0, 0.0, 1.0)
            diff_gray = (diff_norm * 255).astype(np.uint8)
            hd, wd = diff_img.shape
            rgb = np.zeros((hd, wd, 3), dtype=np.uint8)
            
            rgb[..., 0] = diff_gray
            rgb[..., 1] = (diff_gray * 0.15).astype(np.uint8)
            rgb[..., 2] = 20
            
            # Apply background white mask to difference map as well
            nan_mask_diff = nan_mask[:hd, :wd]
            rgb[nan_mask_diff] = 255
        else:
            rng = global_max - global_min + 1e-8
            norm = np.clip((downsampled - global_min) / rng, 0.0, 1.0)
            inverted = np.nan_to_num(1.0 - norm, nan=0.0)
            gray = (inverted * 255).astype(np.uint8)
            
            rgb = np.zeros((downsampled.shape[0], downsampled.shape[1], 3), dtype=np.uint8)
            
            if colormap == "grayscale":
                rgb[..., 0] = gray
                rgb[..., 1] = gray
                rgb[..., 2] = gray
            elif colormap == "thermal":
                rgb[..., 0] = gray
                rgb[..., 1] = np.clip(gray * 1.5 - 128, 0, 255).astype(np.uint8)
                rgb[..., 2] = np.clip(gray * 3.0 - 510, 0, 255).astype(np.uint8)
            else:
                # Default cyan/blue false color
                rgb[..., 0] = np.where(gray > 165, np.clip((gray - 165) * 2.8, 0, 255), 12).astype(np.uint8)
                rgb[..., 1] = np.where(gray > 110, np.clip((gray - 110) * 1.8, 0, 255), 22).astype(np.uint8)
                rgb[..., 2] = np.clip(gray * 1.1 + 40, 0, 255).astype(np.uint8)
                
            # Set background (NaNs) to white
            rgb[nan_mask] = 255
            
        # Convert to PNG stream directly in memory
        img_pil = _Image.fromarray(rgb)
        buf = io.BytesIO()
        img_pil.save(buf, format="PNG")

        # Free large arrays before returning the response to keep RSS low
        png_bytes = buf.getvalue()
        del downsampled, rgb, img_pil, buf
        import gc; gc.collect()

        return Response(content=png_bytes, media_type="image/png")

    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Rendering pipeline failed: {err}")



@router.get("/clear_cache")
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

    # Guard: refuse to wipe while inference tasks are actively running to avoid race conditions
    if RUNNING_TASKS:
        running_list = list(RUNNING_TASKS.keys())
        raise HTTPException(
            status_code=409,
            detail=f"Cache wipe rejected: {len(running_list)} inference task(s) still running: {running_list}. Wait for them to complete or restart the server."
        )

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

