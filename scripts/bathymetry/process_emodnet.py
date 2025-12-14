#!/usr/bin/env python3
"""
Process EMODnet Bathymetry data: crop to Turkey region and convert to COG.
EMODnet F7 tile covers a larger area, so we crop to Turkey bounding box.
"""

import argparse
import sys
from pathlib import Path
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.windows import from_bounds
import numpy as np

# Turkey bounding box (Aegean + Marmara + Black Sea coast)
# min_lon, min_lat, max_lon, max_lat
TURKEY_BBOX = (25.0, 40.0, 30.0, 42.0)


def crop_emodnet(input_path: Path, output_path: Path, bbox: tuple = TURKEY_BBOX):
    """
    Crop EMODnet GeoTIFF to Turkey bounding box.
    
    Args:
        input_path: Path to input EMODnet GeoTIFF
        output_path: Path to output cropped GeoTIFF
        bbox: Bounding box (min_lon, min_lat, max_lon, max_lat)
    """
    input_path = Path(input_path)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    min_lon, min_lat, max_lon, max_lat = bbox
    
    print(f"Reading: {input_path}")
    
    with rasterio.open(input_path) as src:
        # Get source bounds and CRS
        src_bounds = src.bounds
        src_crs = src.crs
        
        print(f"  Source bounds: {src_bounds}")
        print(f"  Source CRS: {src_crs}")
        print(f"  Crop bounds: ({min_lon}, {min_lat}, {max_lon}, {max_lat})")
        
        # Check if crop bounds are within source bounds
        if (min_lon < src_bounds.left or max_lon > src_bounds.right or
            min_lat < src_bounds.bottom or max_lat > src_bounds.top):
            print("⚠ Warning: Crop bounds extend beyond source bounds")
            print("  Adjusting crop bounds to fit source data...")
            min_lon = max(min_lon, src_bounds.left)
            max_lon = min(max_lon, src_bounds.right)
            min_lat = max(min_lat, src_bounds.bottom)
            max_lat = min(max_lat, src_bounds.top)
            print(f"  Adjusted bounds: ({min_lon}, {min_lat}, {max_lon}, {max_lat})")
        
        # Calculate window for cropping
        window = from_bounds(min_lon, min_lat, max_lon, max_lat, src.transform)
        
        # Read data window
        data = src.read(1, window=window)
        
        # Calculate new transform for cropped data
        transform = rasterio.windows.transform(window, src.transform)
        
        # Calculate resolution in meters (approximate)
        resolution_m = abs(transform[0]) * 111000
        
        print(f"  Cropped size: {data.shape[1]}x{data.shape[0]}")
        print(f"  Resolution: ~{resolution_m:.0f}m")
        
        # Write cropped GeoTIFF
        profile = src.profile.copy()
        # Calculate tile size (must be multiple of 16)
        tile_width = 512  # Standard tile size
        tile_height = 512
        profile.update({
            'height': data.shape[0],
            'width': data.shape[1],
            'transform': transform,
            'compress': 'DEFLATE',
            'tiled': True,
            'blockxsize': tile_width,
            'blockysize': tile_height,
        })
        
        print(f"Writing: {output_path}")
        with rasterio.open(output_path, 'w', **profile) as dst:
            dst.write(data, 1)
        
        # Calculate statistics
        valid_data = data[~np.isnan(data)]
        if len(valid_data) > 0:
            print(f"  Depth range: {valid_data.min():.1f}m to {valid_data.max():.1f}m")
            print(f"  Mean depth: {valid_data.mean():.1f}m")
        
        print(f"✓ Cropped EMODnet data saved: {output_path}")
        return output_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Crop EMODnet Bathymetry data to Turkey region"
    )
    parser.add_argument(
        "--input",
        type=str,
        required=True,
        help="Input EMODnet GeoTIFF file"
    )
    parser.add_argument(
        "--output",
        type=str,
        required=True,
        help="Output cropped GeoTIFF file"
    )
    parser.add_argument(
        "--bbox",
        type=float,
        nargs=4,
        default=TURKEY_BBOX,
        metavar=("MIN_LON", "MIN_LAT", "MAX_LON", "MAX_LAT"),
        help=f"Bounding box (default: {TURKEY_BBOX})"
    )
    
    args = parser.parse_args()
    
    crop_emodnet(Path(args.input), Path(args.output), tuple(args.bbox))

