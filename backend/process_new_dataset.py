import os
import sys
import shutil
import numpy as np
import xarray as xr
from PIL import Image

# Resolve paths to match backend execution environment
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.extend([current_dir, project_root])

from services.model_loader import load_model_and_warmup, get_normalization_stats

def array_to_png_resized(array, global_min, global_max, output_path, target_size=(1024, 1024)):
    """
    Convert a 2D float32 CMI array into a false-color satellite IR preview PNG,
    resizing it to a target size for smooth rendering in the frontend.
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
    
    # Resize for smooth browser preview loading
    img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
    img_resized.save(output_path, "PNG")

def main():
    print("==================================================")
    # 1. Load model checkpoint to read global normalization parameters
    load_model_and_warmup()
    global_min, global_max = get_normalization_stats()
    print(f"Loaded normalisation stats: min={global_min:.4f}, max={global_max:.4f}")
    
    # 2. Create the target directory under datasets/GOES19/MELISSA
    goes_melissa_dir = os.path.join(current_dir, "datasets", "GOES19", "MELISSA")
    os.makedirs(goes_melissa_dir, exist_ok=True)
    print(f"Target directory: {goes_melissa_dir}")
    
    # List of files in the backend directory to process
    nc_files = [
        "OR_ABI-L2-CMIPF-M6C13_G19_s20252960740213_e20252960749534_c20252960749583.nc",
        "OR_ABI-L2-CMIPF-M6C13_G19_s20252960750213_e20252960759534_c20252960759594.nc",
        "OR_ABI-L2-CMIPF-M6C13_G19_s20252960800213_e20252960809533_c20252960809581.nc",
        "OR_ABI-L2-CMIPF-M6C13_G19_s20252960810213_e20252960819533_c20252960819598.nc",
        "OR_ABI-L2-CMIPF-M6C13_G19_s20252960820213_e20252960829533_c20252960830005.nc",
        "OR_ABI-L2-CMIPF-M6C13_G19_s20252960830213_e20252960839533_c20252960839593.nc"
    ]
    
    time_map = {
        "s20252960740": "0740",
        "s20252960750": "0750",
        "s20252960800": "0800",
        "s20252960810": "0810",
        "s20252960820": "0820",
        "s20252960830": "0830"
    }
    
    for nc_file in nc_files:
        full_path = os.path.join(current_dir, nc_file)
        if not os.path.exists(full_path):
            print(f"Skipping {nc_file} because it does not exist.")
            continue
            
        timestamp = None
        for k, v in time_map.items():
            if k in nc_file:
                timestamp = v
                break
                
        if not timestamp:
            print(f"Could not parse timestamp from {nc_file}")
            continue
            
        print(f"Processing {nc_file} -> {timestamp}.nc (full 5424x5424) / .png (1024x1024)")
        
        # Save full NetCDF file by copying
        out_nc_path = os.path.join(goes_melissa_dir, f"{timestamp}.nc")
        shutil.copy(full_path, out_nc_path)
        
        # Open to render resized preview
        ds = xr.open_dataset(full_path)
        cmi_data = ds["CMI"].values.astype(np.float32)
        cmi_data = np.nan_to_num(cmi_data, nan=global_min)
        
        # Save resized preview PNG
        out_png_path = os.path.join(goes_melissa_dir, f"{timestamp}.png")
        array_to_png_resized(cmi_data, global_min, global_max, out_png_path)
        
    print("==================================================")
    print("All files processed successfully!")

if __name__ == "__main__":
    main()
