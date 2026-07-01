import os
import json
import shutil
import datetime
import re
import logging
from pathlib import Path
import numpy as np
import xarray as xr
from PIL import Image
from services.model_loader import get_normalization_stats
import config

# In-memory metadata index cache
metadata_index = {}

def time_str_to_minutes(time_str: str) -> float:
    """Convert HH:MM or HH:MM:SS string to minutes since 00:00."""
    parts = time_str.split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    elif len(parts) == 3:
        return int(parts[0]) * 60 + int(parts[1]) + int(parts[2]) / 60.0
    return 0.0

def minutes_to_time_str(minutes: float) -> str:
    """Convert minutes since 00:00 back to HH:MM or HH:MM:SS."""
    h = int(minutes // 60)
    m = int(minutes % 60)
    s = int(round((minutes % 1) * 60))
    if s > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{h:02d}:{m:02d}"

def parse_filename_to_timestamp(filename: str) -> str:
    """
    Extracts a time stamp (HH:MM or HH:MM:SS) from a filename string by scanning digits.
    """
    base = os.path.splitext(filename)[0]
    if "_" in base:
        # Special check for GOES/INSAT raw names with _sYYYYJJJHHMMSS pattern
        if "s20" in base:
            idx = base.find("_s20")
            if idx != -1:
                stamp = base[idx+2:]
                digits = "".join([c for c in stamp if c.isdigit()])
                if len(digits) >= 11:
                    hh = digits[7:9]
                    mm = digits[9:11]
                    return f"{hh}:{mm}"
        base = base.replace("_", ":")
        
    clean = "".join([c for c in base if c.isdigit() or c == ":"])
    clean = clean.strip(":")
    if not clean:
        raise ValueError(f"No digits or colons found in filename: {filename}")
        
    if ":" in clean:
        parts = [p for p in clean.split(":") if p]
        if len(parts) == 2:
            h, m = int(parts[0]), int(parts[1])
            if 0 <= h < 24 and 0 <= m < 60:
                return f"{h:02d}:{m:02d}"
        elif len(parts) == 3:
            h, m, s = int(parts[0]), int(parts[1]), int(parts[2])
            if 0 <= h < 24 and 0 <= m < 60 and 0 <= s < 60:
                return f"{h:02d}:{m:02d}:{s:02d}"
        raise ValueError(f"Invalid timestamp values in: {clean}")
        
    if len(clean) == 4:
        h, m = int(clean[0:2]), int(clean[2:4])
        if 0 <= h < 24 and 0 <= m < 60:
            return f"{h:02d}:{m:02d}"
    elif len(clean) == 6:
        h, m, s = int(clean[0:2]), int(clean[2:4]), int(clean[4:6])
        if 0 <= h < 24 and 0 <= m < 60 and 0 <= s < 60:
            return f"{h:02d}:{m:02d}:{s:02d}"
    else:
        # Fallback parse as a raw numeric value representing HHMM
        val = int(clean)
        h = val // 100
        m = val % 100
        if 0 <= h < 24 and 0 <= m < 60:
            return f"{h:02d}:{m:02d}"
            
    raise ValueError(f"Could not parse valid timestamp digits: {clean}")

def array_to_png(array, global_min, global_max, output_path):
    """
    Convert a 2D float32 CMI array into a false-color satellite IR preview PNG.
    """
    rng = global_max - global_min + 1e-8
    norm = np.clip((array - global_min) / rng, 0.0, 1.0)
    inverted = 1.0 - norm
    gray = (inverted * 255).astype(np.uint8)
    
    h, w = array.shape
    rgb = np.zeros((h, w, 3), dtype=np.uint8)
    
    # R channel: high cloud tops
    rgb[..., 0] = np.where(gray > 165, np.clip((gray - 165) * 2.8, 0, 255), 12).astype(np.uint8)
    # G channel: active for cyan cloud walls and white cores
    rgb[..., 1] = np.where(gray > 110, np.clip((gray - 110) * 1.8, 0, 255), 22).astype(np.uint8)
    # B channel: active for all clouds, creating a blue base
    rgb[..., 2] = np.clip(gray * 1.1 + 40, 0, 255).astype(np.uint8)
    
    img = Image.fromarray(rgb)
    img.save(output_path, "PNG")

def parse_raw_satellite_filename(filename: str):
    """
    Parses a raw satellite NetCDF filename (e.g., OR_ABI-L2-CMIPF-M6C13_G19_s20252960740213_e20252960749534_c20252960749583.nc)
    and returns (satellite, cyclone_date, timestamp_str)
    """
    filename_upper = filename.upper()
    
    sat = "UNKNOWN_SATELLITE"
    if "G19" in filename_upper:
        sat = "GOES19"
    elif "G18" in filename_upper:
        sat = "GOES18"
    elif "G17" in filename_upper:
        sat = "GOES17"
    elif "G16" in filename_upper:
        sat = "GOES16"
    elif "INSAT3DS" in filename_upper or "INSAT-3DS" in filename_upper:
        sat = "INSAT3DS"
    elif "HIMAWARI8" in filename_upper or "HIMAWARI-8" in filename_upper:
        sat = "HIMAWARI8"
        
    match = re.search(r'_s(\d{4})(\d{3})(\d{2})(\d{2})', filename)
    if match:
        year = int(match.group(1))
        julian_day = int(match.group(2))
        hh = match.group(3)
        mm = match.group(4)
        
        try:
            date_obj = datetime.datetime(year, 1, 1) + datetime.timedelta(days=julian_day - 1)
            cyclone_date = date_obj.strftime("%Y-%m-%d")
        except Exception:
            cyclone_date = f"{year}-{julian_day:03d}"
            
        timestamp_str = f"{hh}:{mm}"
    else:
        try:
            timestamp_str = parse_filename_to_timestamp(filename)
            cyclone_date = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        except Exception:
            cyclone_date = "INGESTED"
            timestamp_str = "00:00"
            
    return sat, cyclone_date, timestamp_str

def ingest_raw_files():
    """
    Scans the config.INGEST_DIR folder for any .nc files.
    For each file, it parses the satellite, date (cyclone), and timestamp.
    Then, it creates the target directory in datasets/, copies the file,
    generates a preview, and deletes the source file.
    """
    logger = logging.getLogger("app")
    
    # Ensure ingest directory exists
    config.INGEST_DIR.mkdir(parents=True, exist_ok=True)
    
    nc_files = [f for f in config.INGEST_DIR.iterdir() if f.suffix == ".nc"]
    if not nc_files:
        return
        
    logger.info("==================================================")
    logger.info(f"[INGEST] Found {len(nc_files)} file(s) in ingest folder")
    logger.info("==================================================")
    
    try:
        global_min, global_max = get_normalization_stats()
        if global_min is None or global_max is None:
            global_min, global_max = 215.5, 299.25
    except Exception:
        global_min, global_max = 215.5, 299.25
        
    for f_path in nc_files:
        try:
            # Open source dataset first to inspect metadata attributes for cyclone/storm name
            ds = xr.open_dataset(str(f_path))
            
            cyclone_name = None
            for attr_key in ["cyclone_name", "storm_name", "cyclone", "storm", "title"]:
                val = ds.attrs.get(attr_key)
                if val and isinstance(val, str):
                    if attr_key == "title" and ("Cloud" in val or "Imagery" in val or "Dataset" in val):
                        continue
                    clean_val = "".join(c for c in val if c.isalnum() or c in "-_ ").strip()
                    if clean_val:
                        cyclone_name = clean_val.upper().replace(" ", "_")
                        break
            
            # Close dataset to unlock file
            ds.close()
            
            sat, cy_date, t_str = parse_raw_satellite_filename(f_path.name)
            
            # If NetCDF attributes contain a cyclone name, use it instead of date-based default
            final_cy_name = cyclone_name if cyclone_name else cy_date
            t_clean = t_str.replace(":", "")
            
            target_dir = config.DATASETS_DIR / sat / final_cy_name
            target_dir.mkdir(parents=True, exist_ok=True)
            
            dest_nc_path = target_dir / f"{t_clean}.nc"
            dest_png_path = target_dir / f"{t_clean}.png"
            
            logger.info(f"[INGEST] Processing {f_path.name}")
            logger.info(f"         -> Satellite: {sat}")
            logger.info(f"         -> Cyclone Folder: {final_cy_name} (Source: {'Metadata' if cyclone_name else 'Filename Date'})")
            logger.info(f"         -> Timestamp: {t_str}")
            logger.info(f"         -> Target: datasets/{sat}/{final_cy_name}/{t_clean}.nc")
            
            shutil.copy2(str(f_path), str(dest_nc_path))
            
            if not dest_png_path.exists():
                try:
                    ds = xr.open_dataset(str(dest_nc_path))
                    if "CMI" in ds.variables:
                        cmi_data = ds["CMI"].values.astype(np.float32)
                        cmi_data = np.nan_to_num(cmi_data, nan=global_min)
                        array_to_png(cmi_data, global_min, global_max, str(dest_png_path))
                        logger.info(f"         -> Generated preview: {t_clean}.png")
                    ds.close()
                except Exception as preview_err:
                    logger.warning(f"Failed to generate preview for ingested file: {preview_err}")
            
            f_path.unlink()
            logger.info("[INGEST] Ingested and cleaned up successfully.")
            
        except Exception as err:
            logger.error(f"Failed to ingest file {f_path.name}: {err}")
            
    logger.info("==================================================\n")

def scan_and_generate_metadata():
    global metadata_index
    logger = logging.getLogger("app")
    
    # 1. Ingest any pending raw files in ingest/ folder
    ingest_raw_files()
    
    # Ensure datasets & data directory structure exist
    config.DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    config.METADATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Load existing metadata.json to preserve generated_frames/linage
    existing_index = {}
    if config.METADATA_PATH.exists():
        try:
            with open(config.METADATA_PATH, "r", encoding="utf-8") as f:
                existing_index = json.load(f)
        except Exception as e:
            logger.warning(f"Could not load existing metadata.json: {e}")
            
    # Load normalization stats for preview generation
    try:
        global_min, global_max = get_normalization_stats()
        if global_min is None or global_max is None:
            global_min, global_max = 215.5, 299.25
    except Exception:
        global_min, global_max = 215.5, 299.25

    # Statistics reporting variables
    discovered_sats = set()
    discovered_cys = set()
    total_raw_frames_indexed = 0
    total_generated_restored = 0
    previews_created = 0
    previews_reused = 0
    invalid_files_skipped = 0
    removed_stale_cache = 0

    index = {}

    # 1. RECURSIVELY WALK DATASETS/ DIRECTORY
    for dirpath, _, filenames in os.walk(str(config.DATASETS_DIR)):
        nc_files = [f for f in filenames if f.endswith(".nc")]
        if not nc_files:
            continue

        # Extract satellite and cyclone from folder path
        dir_p = Path(dirpath)
        try:
            rel_path = dir_p.relative_to(config.DATASETS_DIR)
        except ValueError:
            continue
            
        parts = rel_path.parts
        if len(parts) < 2:
            # Must be nested under at least: datasets/Satellite/Cyclone/
            continue

        sat = parts[-2].upper()
        cy = parts[-1].upper()

        discovered_sats.add(sat)
        discovered_cys.add(cy)

        if sat not in index:
            index[sat] = {}

        valid_frames_info = []
        ground_truth = {}

        # Validate each .nc file in this directory
        for f in nc_files:
            nc_filepath = dir_p / f
            png_filepath = dir_p / f.replace(".nc", ".png")
            
            try:
                # Validation 1: Readability
                ds = xr.open_dataset(str(nc_filepath))
                
                # Validation 2: Contains required variable CMI
                if "CMI" not in ds.variables:
                    ds.close()
                    raise ValueError("Required variable 'CMI' is missing.")
                
                # Validation 3: Dimensions check
                if ds["CMI"].ndim != 2:
                    ds.close()
                    raise ValueError(f"Expected 2D CMI variable, got {ds['CMI'].ndim}D.")
                
                cmi_shape = ds["CMI"].shape
                if cmi_shape[0] == 0 or cmi_shape[1] == 0:
                    ds.close()
                    raise ValueError(f"Empty dimensions: {cmi_shape}.")
                # Validation 4: Timestamp parseable from filename
                timestamp = parse_filename_to_timestamp(f)
                
                # Relative path from project root for frontend portability
                rel_nc = nc_filepath.relative_to(config.BASE_DIR).as_posix()
                rel_png = png_filepath.relative_to(config.BASE_DIR).as_posix()
                
                # Validation 5: Auto Preview PNG generation/reuse
                if not png_filepath.exists():
                    try:
                        cmi_data = ds["CMI"].values.astype(np.float32)
                        cmi_data = np.nan_to_num(cmi_data, nan=global_min)
                        array_to_png(cmi_data, global_min, global_max, str(png_filepath))
                        previews_created += 1
                        del cmi_data
                        import gc
                        gc.collect()
                    except Exception as e:
                        logger.warning(f"Failed to generate preview for {nc_filepath}: {e}")
                else:
                    previews_reused += 1

                ds.close()

                valid_frames_info.append({
                    "timestamp": timestamp,
                    "nc_path": rel_nc,
                    "png_path": rel_png
                })
                ground_truth[timestamp] = True
                total_raw_frames_indexed += 1

            except Exception as e:
                logger.warning(f"Skipping invalid NetCDF file {nc_filepath}: {e}")
                invalid_files_skipped += 1
                continue

        # If we successfully indexed valid frames in this cyclone directory
        if valid_frames_info:
            # Sort frames chronologically by timestamp
            valid_frames_info.sort(key=lambda x: time_str_to_minutes(x["timestamp"]))
            available_real_frames = [x["timestamp"] for x in valid_frames_info]

            # 2. RESTORE & VALIDATE CACHE
            prev_generated = []
            prev_gt_avail = {}
            prev_metadata = {}
            if sat in existing_index and cy in existing_index[sat]:
                raw_prev_generated = existing_index[sat][cy].get("generated_frames", [])
                raw_prev_gt = existing_index[sat][cy].get("ground_truth_availability", {})
                raw_prev_metadata = existing_index[sat][cy].get("generated_metadata", {})
                
                for g_time in raw_prev_generated:
                    t_clean = g_time.replace(":", "")
                    cache_nc_path = config.CACHE_DIR / f"rec_{sat}_{cy}_{t_clean}.nc"
                    cache_png_path = config.CACHE_DIR / f"rec_{sat}_{cy}_{t_clean}.png"
                    
                    if cache_nc_path.exists() and cache_png_path.exists():
                        prev_generated.append(g_time)
                        if g_time in raw_prev_gt:
                            prev_gt_avail[g_time] = raw_prev_gt[g_time]
                        if g_time in raw_prev_metadata:
                            prev_metadata[g_time] = raw_prev_metadata[g_time]
                        total_generated_restored += 1
                    else:
                        removed_stale_cache += 1

            # Populate metadata entry
            basin = "Bay of Bengal" if cy == "AMPHAN" else "Arabian Sea" if cy == "BIPARJOY" else "Atlantic Ocean" if cy == "MELISSA" else "Custom Datasets"
            name_map = {
                "AMPHAN": "Cyclone Amphan (2020)", 
                "BIPARJOY": "Cyclone Biparjoy (2023)",
                "MELISSA": "Hurricane Melissa (2025)"
            }

            index[sat][cy] = {
                "id": cy,
                "name": name_map.get(cy, f"Cyclone {cy}"),
                "basin": basin,
                "satellite": sat,
                "available_real_frames": available_real_frames,
                "generated_frames": prev_generated,
                "ground_truth_availability": {**ground_truth, **prev_gt_avail},
                "generated_metadata": prev_metadata,
                "frames": valid_frames_info
            }

    # 3. WRITE METADATA REGISTRY TO DISK
    with open(config.METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2)

    metadata_index = index

    # 4. PRINT DATASET SUMMARY LOG
    logger.info("==================================================")
    logger.info("DATASET SUMMARY")
    logger.info("==================================================")
    logger.info(f"Satellites discovered      : {len(discovered_sats)}")
    logger.info(f"Cyclones discovered        : {len(discovered_cys)}")
    logger.info(f"Raw frames indexed         : {total_raw_frames_indexed}")
    logger.info(f"Generated frames restored  : {total_generated_restored}")
    logger.info(f"Preview images created     : {previews_created}")
    logger.info(f"Preview images reused      : {previews_reused}")
    logger.info(f"Invalid files skipped      : {invalid_files_skipped}")
    logger.info(f"Removed stale cache        : {removed_stale_cache}")
    logger.info("Startup complete.")
    logger.info("==================================================\n")

def get_metadata_index():
    global metadata_index
    if not metadata_index:
        if config.METADATA_PATH.exists():
            try:
                with open(config.METADATA_PATH, "r", encoding="utf-8") as f:
                    metadata_index = json.load(f)
                logging.getLogger("app").info("Loaded datasets index from existing metadata.json")
            except Exception as e:
                logging.getLogger("app").warning(f"Could not load metadata from disk: {e}")
                metadata_index = {}
        else:
            metadata_index = {}
    return metadata_index

def update_metadata_index(
    satellite: str,
    cyclone_id: str,
    generated_time: str,
    has_ground_truth: bool = False,
    metrics: dict = None,
    parent_timestamps: list = None,
    interpolation_depth: int = 1,
    temporal_resolution: str = "",
    inference_time: float = 0.0,
    model_version: str = "best_model_512.pth"
):
    """
    Register a newly interpolated frame in the database index.
    """
    global metadata_index
    
    sat = satellite.upper()
    cy = cyclone_id.upper()
    
    if sat in metadata_index and cy in metadata_index[sat]:
        cy_meta = metadata_index[sat][cy]
        
        if generated_time not in cy_meta["generated_frames"]:
            cy_meta["generated_frames"].append(generated_time)
            cy_meta["generated_frames"].sort(key=time_str_to_minutes)
            
        cy_meta["ground_truth_availability"][generated_time] = has_ground_truth
        
        if "generated_metadata" not in cy_meta:
            cy_meta["generated_metadata"] = {}
            
        cy_meta["generated_metadata"][generated_time] = {
            "timestamp": generated_time,
            "parent_timestamps": parent_timestamps,
            "interpolation_depth": interpolation_depth,
            "temporal_resolution": temporal_resolution,
            "scientific_metrics": metrics,
            "inference_time": inference_time,
            "ground_truth_availability": has_ground_truth,
            "model_version": model_version
        }
        
        # Persist back to file
        with open(config.METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(metadata_index, f, indent=2)
