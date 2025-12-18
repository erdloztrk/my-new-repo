#!/usr/bin/env python3
"""
Crop GEBCO GeoTIFF to a bounding box (e.g., Turkey Aegean/Marmara region).
"""

import argparse
import sys
from pathlib import Path
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.crs import CRS


def crop_gebco(input_path: str, output_path: str, bbox: tuple[float, float, float, float]):
    """
    Crop GEBCO GeoTIFF to bounding box.
    
    Args:
        input_path: Path to input GeoTIFF
        output_path: Path to output cropped GeoTIFF
        bbox: (min_lon, max_lat, max_lon, min_lat) in WGS84
    """
    min_lon, max_lat, max_lon, min_lat = bbox
    
    print(f"Reading: {input_path}")
    print(f"Cropping to bbox: ({min_lon}, {min_lat}) to ({max_lon}, {max_lat})")
    
    with rasterio.open(input_path) as src:
        # Calculate transform for cropped region
        transform, width, height = calculate_default_transform(
            src.crs,
            CRS.from_epsg(4326),  # WGS84
            width=src.width,
            height=src.height,
            left=min_lon,
            bottom=min_lat,
            right=max_lon,
            top=max_lat
        )
        
        # Read window
        window = rasterio.windows.from_bounds(
            min_lon, min_lat, max_lon, max_lat, src.transform
        )
        
        # Read data
        data = src.read(1, window=window)
        
        # Update transform for cropped region
        transform = rasterio.transform.from_bounds(
            min_lon, min_lat, max_lon, max_lat, width, height
        )
        
        # Write cropped file
        profile = src.profile.copy()
        profile.update({
            'width': width,
            'height': height,
            'transform': transform,
            'crs': CRS.from_epsg(4326),
            'compress': 'lzw',
            'tiled': True,
        })
        
        print(f"Writing: {output_path}")
        with rasterio.open(output_path, 'w', **profile) as dst:
            dst.write(data, 1)
        
        print(f"✓ Cropped: {width}x{height} pixels")
        print(f"  Bounds: ({min_lon}, {min_lat}) to ({max_lon}, {max_lat})")


def main():
    parser = argparse.ArgumentParser(description='Crop GEBCO GeoTIFF to bounding box')
    parser.add_argument('--input', required=True, help='Input GeoTIFF path')
    parser.add_argument('--output', required=True, help='Output cropped GeoTIFF path')
    parser.add_argument('--bbox', nargs=4, type=float, required=True,
                       help='Bounding box: min_lon max_lat max_lon min_lat')
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)
    
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    bbox = tuple(args.bbox)
    crop_gebco(str(input_path), str(output_path), bbox)


if __name__ == '__main__':
    main()

