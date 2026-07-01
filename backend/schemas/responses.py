from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    datasets_indexed: int
    generated_frames: int

class FrameMetadata(BaseModel):
    timestamp: str
    nc_path: str
    png_path: str

class CycloneMetadata(BaseModel):
    id: str
    name: str
    basin: str
    satellite: str
    available_real_frames: List[str]
    generated_frames: List[str]
    ground_truth_availability: Dict[str, bool]
    frames: List[FrameMetadata]

class DatasetResponse(BaseModel):
    satellites: List[str]

class GenerateRequest(BaseModel):
    satellite: str = "GOES19"
    cyclone_id: str
    frame_a_time: str
    frame_b_time: str
    timestep: float = 0.5

class MetricSchema(BaseModel):
    ssim: float
    psnr: float
    mse: float
    fsim: float
    is_simulated: bool = True

class GenerateResponse(BaseModel):
    satellite: str
    cyclone_id: str
    frame_a_time: str
    frame_b_time: str
    timestep: float
    timestamp: str  # Dynamically generated target timestamp (e.g. "01:15" or "01:07:30")
    inference_time_ms: float
    metrics: MetricSchema
    png_url: str
    difference_png_url: Optional[str] = None
    is_difference_map_placeholder: bool = False
    nc_url: str
    # Inline base64-encoded PNGs — avoids a second /frame fetch that may 404
    # on ephemeral-disk hosts (Render free tier restarts wipe cache/)
    png_data: Optional[str] = None        # "data:image/png;base64,..."
    difference_png_data: Optional[str] = None
