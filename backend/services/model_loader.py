import os
import torch
from model.architecture import CNN_Attention_RIFE_Temporal

# Global variables to retain state in-memory
model = None
global_min = None
global_max = None
device = None

def load_model_and_warmup():
    global model, global_min, global_max, device
    import logging
    import config
    logger = logging.getLogger("app")
    
    # Configure device from config
    device = torch.device(config.DEVICE if torch.cuda.is_available() or config.DEVICE != "cuda" else "cpu")
    logger.info(f"[STARTUP] Loading PyTorch model on: {device}")
    
    model_path = config.MODEL_PATH
    if not model_path.exists():
        raise FileNotFoundError(f"Model weight file 'best_model_512.pth' not found at {model_path}!")
        
    # Initialize model architecture matching training configurations (feature_dim=64)
    model = CNN_Attention_RIFE_Temporal(feature_dim=64)
    
    # Load weights
    logger.info(f"[STARTUP] Loading state dict from {model_path}...")
    checkpoint = torch.load(str(model_path), map_location=device, weights_only=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    
    # Extract normalisation attributes
    global_min = float(checkpoint['global_min'])
    global_max = float(checkpoint['global_max'])
    
    logger.info(f"[STARTUP] Model loaded from epoch {checkpoint.get('epoch', 'N/A')}.")
    logger.info(f"          Normalisation range: [{global_min:.4f}, {global_max:.4f}]")
    logger.info(f"          Validation SSIM: {checkpoint.get('val_ssim', 0.0):.4f}")
    
    # Warm-up inference
    logger.info("[STARTUP] Performing model warm-up...")
    dummy_in0 = torch.zeros((1, 1, 512, 512), device=device)
    dummy_in2 = torch.zeros((1, 1, 512, 512), device=device)
    dummy_t = torch.full((1, 1), 0.5, device=device)
    with torch.no_grad():
        _ = model(dummy_in0, dummy_in2, dummy_t)
    logger.info("[STARTUP] Warm-up complete. Model is resident in-memory.")

def get_model():
    return model

def get_device():
    return device

def get_normalization_stats():
    return global_min, global_max
