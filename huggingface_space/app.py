"""
Hugging Face Spaces — Satellite CMI Temporal Interpolation API

Accepts two raw NetCDF (.nc) files via multipart upload.
Runs the CNN-Attention-RIFE patch-based interpolation model.
Returns the resulting CMI float32 array as a compressed .npy.gz binary.

Usage:
  POST /interpolate
  Content-Type: multipart/form-data
  Fields:
    file_a: frame_t0.nc
    file_b: frame_t1.nc
    timestep: 0.5 (float, optional)
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
from fastapi.responses import Response

# ── Path setup for model/ module ────────────────────────────────────────────
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
from model.architecture import CNN_Attention_RIFE_Temporal

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hf-spaces")

# ── Constants / configuration ─────────────────────────────────────────────
MODEL_PATH = os.getenv("MODEL_PATH", "models/best_model_512.pth")
DEVICE_STR  = os.getenv("DEVICE", "cpu")
PATCH_SIZE  = int(os.getenv("PATCH_SIZE", "512"))
OVERLAP     = int(os.getenv("OVERLAP", "64"))
BATCH_SIZE  = int(os.getenv("BATCH_SIZE", "8"))

# ── Global model state (loaded once at startup) ──────────────────────────
_model      = None
_device     = None
_global_min = None
_global_max = None


def _load_model():
    global _model, _device, _global_min, _global_max
    if _model is not None:
        return

    _device = torch.device(DEVICE_STR)
    if DEVICE_STR == "cpu":
        torch.set_num_threads(2)
        logger.info(f"[STARTUP] Set PyTorch CPU threads to {torch.get_num_threads()}")
    logger.info(f"[STARTUP] Loading model on {_device} from {MODEL_PATH}")

    _model = CNN_Attention_RIFE_Temporal(feature_dim=64)
    checkpoint = torch.load(MODEL_PATH, map_location=_device, weights_only=False)
    _model.load_state_dict(checkpoint["model_state_dict"])
    _model.to(_device)
    _model.eval()

    _global_min = float(checkpoint["global_min"])
    _global_max = float(checkpoint["global_max"])
    logger.info(f"[STARTUP] Model ready. norm=[{_global_min:.4f}, {_global_max:.4f}]")

    # warm-up
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


def _run_batch(patches0, patches2, timestep):
    global_min, global_max = _global_min, _global_max
    rng = global_max - global_min + 1e-8
    result_patches = []

    for i in range(0, len(patches0), BATCH_SIZE):
        batch_p0 = [p for _, _, p in patches0[i:i+BATCH_SIZE]]
        batch_p2 = [p for _, _, p in patches2[i:i+BATCH_SIZE]]
        coords   = [(y, x) for y, x, _ in patches0[i:i+BATCH_SIZE]]
        B        = len(batch_p0)

        b0 = torch.cat([
            torch.from_numpy(np.clip((p - global_min)/rng, 0., 1.)).unsqueeze(0).unsqueeze(0).float()
            for p in batch_p0], dim=0).to(_device)
        b2 = torch.cat([
            torch.from_numpy(np.clip((p - global_min)/rng, 0., 1.)).unsqueeze(0).unsqueeze(0).float()
            for p in batch_p2], dim=0).to(_device)
        ts = torch.full((B, 1), timestep, device=_device)

        with torch.no_grad():
            preds = _model(b0, b2, ts)

        for j, (y, x) in enumerate(coords):
            pred_norm = preds[j].squeeze().cpu().numpy()
            result_patches.append((y, x, (pred_norm * rng) + global_min))

    return result_patches


# ── FastAPI app ───────────────────────────────────────────────────────────

app = FastAPI(
    title="CYC-INTEL Model Inference Microservice",
    description="Accepts two NetCDF satellite frames, returns interpolated CMI as compressed numpy binary.",
    version="1.0.0"
)


@app.on_event("startup")
def startup_event():
    _load_model()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": _model is not None,
        "device": str(_device),
        "norm": [_global_min, _global_max]
    }


@app.post("/interpolate")
async def interpolate(
    file_a:   UploadFile = File(..., description="NetCDF frame at t0 (.nc)"),
    file_b:   UploadFile = File(..., description="NetCDF frame at t1 (.nc)"),
    timestep: float      = Form(0.5, description="Interpolation position [0.0, 1.0]")
):
    """
    Runs temporal interpolation between two CMI NetCDF frames.
    Returns the synthesised CMI float32 array as gzip-compressed npy binary.
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
            data0 = np.nan_to_num(ds0["CMI"].values.astype(np.float32), nan=_global_min)
            ds0.close()

            ds2   = xr.open_dataset(path_b)
            data2 = np.nan_to_num(ds2["CMI"].values.astype(np.float32), nan=_global_min)
            ds2.close()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read NetCDF: {e}")

        patches0 = _extract_patches(data0, PATCH_SIZE, OVERLAP)
        patches2 = _extract_patches(data2, PATCH_SIZE, OVERLAP)

        logger.info(f"[INFERENCE] Running {len(patches0)} patches (timestep={timestep})")
        result_patches = _run_batch(patches0, patches2, timestep)
        final_img = _merge_patches(result_patches, data0.shape, PATCH_SIZE, OVERLAP)

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
            "X-Array-Shape":       f"{final_img.shape[0]}x{final_img.shape[1]}"
        }
    )
