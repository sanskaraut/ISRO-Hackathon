"""
model_loader.py — Lightweight shim for Render deployment.

The PyTorch model runs exclusively on Hugging Face Spaces.
This module keeps the same public API so dataset_scanner.py and other
callers are unaffected, but sources normalisation bounds from environment
variables instead of loading a checkpoint file.

For local development with the model present, set:
  GLOBAL_MIN=215.5
  GLOBAL_MAX=299.25
in backend/.env (matching the values in best_model_512.pth).
"""

import os
import logging

logger = logging.getLogger("app")

# Public globals (kept for API compatibility — model itself lives on HF Spaces)
model  = None
device = None

# Read normalisation bounds from environment (set in .env / Render dashboard)
global_min: float = float(os.getenv("GLOBAL_MIN", "215.5"))
global_max: float = float(os.getenv("GLOBAL_MAX", "299.25"))


def load_model_and_warmup():
    """No-op on Render — model inference is delegated to HF Spaces."""
    logger.info(
        "[MODEL_LOADER] Running in HF-Spaces delegation mode. "
        f"Norm range: [{global_min:.4f}, {global_max:.4f}] "
        "(sourced from GLOBAL_MIN / GLOBAL_MAX env vars)"
    )


def get_model():
    return None


def get_device():
    return None


def get_normalization_stats():
    return global_min, global_max
