"""
Hugging Face Spaces — Satellite CMI Temporal Interpolation API

Accepts two raw NetCDF (.nc) files via multipart upload.
Runs the CNN-Attention-RIFE patch-based interpolation model (feature_dim=96).
Returns the resulting CMI float32 array as a compressed .npy.gz binary.

Usage:
  POST /interpolate
  Content-Type: multipart/form-data
  Fields:
    file_a:   frame_t0.nc
    file_b:   frame_t1.nc
    timestep: 0.5          (float, optional — interpolation position [0, 1])
    variable: CMI          (str,   optional — NetCDF variable name to read)
"""

import os
import io
import sys
import gzip
import time
import logging
import tempfile
import numpy as np
import xarray as xr
import torch
import torch.nn.functional as F

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response, RedirectResponse

# ── Path setup for model/ module ────────────────────────────────────────────
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
from model.architecture import CNN_Attention_RIFE_Temporal

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hf-spaces")

# ── Constants / configuration ─────────────────────────────────────────────
MODEL_PATH = os.getenv("MODEL_PATH", "models/best_model.pth")
DEVICE_STR  = os.getenv("DEVICE", "cpu")
PATCH_SIZE  = int(os.getenv("PATCH_SIZE", "512"))
OVERLAP     = int(os.getenv("OVERLAP", "64"))
BATCH_SIZE  = int(os.getenv("BATCH_SIZE", "8"))

# ── Global model state (loaded once at startup) ──────────────────────────
_model  = None
_device = None


def _load_model():
    global _model, _device
    if _model is not None:
        return

    _device = torch.device(DEVICE_STR)
    if DEVICE_STR == "cpu":
        torch.set_num_threads(2)
        logger.info(f"[STARTUP] Set PyTorch CPU threads to {torch.get_num_threads()}")
    logger.info(f"[STARTUP] Loading model on {_device} from {MODEL_PATH}")

    _model = CNN_Attention_RIFE_Temporal(feature_dim=96)
    checkpoint = torch.load(MODEL_PATH, map_location=_device, weights_only=False)
    _model.load_state_dict(checkpoint["model_state_dict"])
    _model.to(_device)
    _model.eval()

    epoch    = checkpoint.get("epoch", "N/A")
    val_ssim = checkpoint.get("val_ssim", "N/A")
    logger.info(f"[STARTUP] Model ready. epoch={epoch}, val_ssim={val_ssim}")

    # warm-up pass so first real request isn't slow
    dummy = torch.zeros((1, 1, PATCH_SIZE, PATCH_SIZE), device=_device)
    ts    = torch.full((1, 1), 0.5, device=_device)
    with torch.no_grad():
        _model(dummy, dummy, ts)
    logger.info("[STARTUP] Warm-up complete.")


# ── Patch helpers ─────────────────────────────────────────────────────────

def _extract_patches(data, patch_size, overlap):
    H, W  = data.shape
    step  = patch_size - overlap
    ys    = list(range(0, H - patch_size + 1, step))
    xs    = list(range(0, W - patch_size + 1, step))
    # ensure the far edge is always covered
    if not ys or ys[-1] + patch_size < H:
        ys.append(H - patch_size)
    if not xs or xs[-1] + patch_size < W:
        xs.append(W - patch_size)
    return [(y, x, data[y:y+patch_size, x:x+patch_size]) for y in ys for x in xs]


def _merge_patches(patches, output_shape, patch_size, overlap):
    H, W       = output_shape
    accum      = np.zeros(output_shape, dtype=np.float64)
    weight_map = np.zeros(output_shape, dtype=np.float64)
    win_1d     = np.hanning(patch_size)
    win_2d     = np.outer(win_1d, win_1d)
    for y, x, patch in patches:
        accum[y:y+patch_size, x:x+patch_size]      += patch * win_2d
        weight_map[y:y+patch_size, x:x+patch_size] += win_2d
    return (accum / np.maximum(weight_map, 1e-8)).astype(np.float32)


def _run_batch(patches0, patches2, timestep, norm_min, norm_max):
    """Run batched inference. norm_min/norm_max are derived per-request from input frames."""
    rng = norm_max - norm_min + 1e-8
    result_patches = []

    for i in range(0, len(patches0), BATCH_SIZE):
        batch_p0 = [p for _, _, p in patches0[i:i+BATCH_SIZE]]
        batch_p2 = [p for _, _, p in patches2[i:i+BATCH_SIZE]]
        coords   = [(y, x) for y, x, _ in patches0[i:i+BATCH_SIZE]]
        B        = len(batch_p0)

        b0 = torch.cat([
            torch.from_numpy(np.clip((p - norm_min)/rng, 0., 1.)).unsqueeze(0).unsqueeze(0).float()
            for p in batch_p0], dim=0).to(_device)
        b2 = torch.cat([
            torch.from_numpy(np.clip((p - norm_min)/rng, 0., 1.)).unsqueeze(0).unsqueeze(0).float()
            for p in batch_p2], dim=0).to(_device)
        ts = torch.full((B, 1), timestep, device=_device)

        with torch.no_grad():
            preds = _model(b0, b2, ts)

        for j, (y, x) in enumerate(coords):
            pred_norm = preds[j].squeeze().cpu().numpy()
            result_patches.append((y, x, (pred_norm * rng) + norm_min))

    return result_patches


# ── FastAPI app ───────────────────────────────────────────────────────────

app = FastAPI(
    title="CYC-INTEL Model Inference Microservice",
    description="Accepts two NetCDF satellite frames, returns interpolated CMI as compressed numpy binary.",
    version="2.0.0"
)


@app.on_event("startup")
def startup_event():
    _load_model()


@app.get("/", include_in_schema=False)
def root():
    """HF Space health probe / browser navigation — redirect to /health."""
    return RedirectResponse(url="/health")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": _model is not None,
        "device": str(_device),
        "norm_strategy": "percentile_per_request (0.5-99.5)"
    }


@app.post("/interpolate")
async def interpolate(
    file_a:   UploadFile = File(..., description="NetCDF frame at t0 (.nc)"),
    file_b:   UploadFile = File(..., description="NetCDF frame at t1 (.nc)"),
    timestep: float      = Form(0.5, description="Interpolation position [0.0, 1.0]"),
    variable: str        = Form("CMI", description="NetCDF variable name to read")
):
    """
    Runs temporal interpolation between two CMI NetCDF frames.
    Normalisation range is derived automatically from the input frames
    (0.5–99.5 percentile). Returns the synthesised array as gzip-compressed
    npy binary.
    """
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    start = time.time()

    # Save uploads to temp files
    with tempfile.TemporaryDirectory() as tmpdir:
        path_a = os.path.join(tmpdir, "frame_a.nc")
        path_b = os.path.join(tmpdir, "frame_b.nc")

        with open(path_a, "wb") as f:
            f.write(await file_a.read())
        with open(path_b, "wb") as f:
            f.write(await file_b.read())

        try:
            ds0   = xr.open_dataset(path_a)
            data0 = ds0[variable].values.astype(np.float32)
            ds0.close()

            ds2   = xr.open_dataset(path_b)
            data2 = ds2[variable].values.astype(np.float32)
            ds2.close()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read NetCDF: {e}")

        # Fill NaNs with per-frame median (robust to any sensor fill value)
        med0 = float(np.nanmedian(data0))
        med2 = float(np.nanmedian(data2))
        data0 = np.nan_to_num(data0, nan=med0)
        data2 = np.nan_to_num(data2, nan=med2)

        # Compute percentile norm range from both input frames together
        all_vals = np.concatenate([data0.ravel(), data2.ravel()])
        norm_min = float(np.percentile(all_vals, 0.5))
        norm_max = float(np.percentile(all_vals, 99.5))

        if norm_max - norm_min < 1e-3:
            raise HTTPException(
                status_code=400,
                detail=f"Degenerate normalisation range [{norm_min}, {norm_max}]. Check input files."
            )

        logger.info(
            f"[INFERENCE] norm=[{norm_min:.3f}, {norm_max:.3f}] "
            f"shapes={data0.shape},{data2.shape} timestep={timestep}"
        )

        patches0 = _extract_patches(data0, PATCH_SIZE, OVERLAP)
        patches2 = _extract_patches(data2, PATCH_SIZE, OVERLAP)

        logger.info(f"[INFERENCE] Running {len(patches0)} patches")
        result_patches = _run_batch(patches0, patches2, timestep, norm_min, norm_max)
        final_img      = _merge_patches(result_patches, data0.shape, PATCH_SIZE, OVERLAP)
        final_img      = np.clip(final_img, norm_min, norm_max)

    duration_ms = (time.time() - start) * 1000
    logger.info(f"[INFERENCE] Done in {duration_ms:.0f} ms")

    # Serialise as gzip-compressed .npy binary
    buf = io.BytesIO()
    np.save(buf, final_img)
    compressed = gzip.compress(buf.getvalue(), compresslevel=4)

    return Response(
        content=compressed,
        media_type="application/octet-stream",
        headers={
            "X-Inference-Time-Ms": str(round(duration_ms, 2)),
            "X-Array-Shape":       f"{final_img.shape[0]}x{final_img.shape[1]}",
            "X-Norm-Min":          str(round(norm_min, 4)),
            "X-Norm-Max":          str(round(norm_max, 4))
        }
    )
