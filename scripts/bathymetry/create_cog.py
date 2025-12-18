#!/usr/bin/env python3
"""
Convert GeoTIFF to Cloud Optimized GeoTIFF (COG) with overviews.
"""

import argparse
import sys
import json
from pathlib import Path
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling


def create_cog(input_path: str, output_path: str):
    """
    Convert GeoTIFF to Cloud Optimized GeoTIFF.
    
    Args:
        input_path: Path to input GeoTIFF
        output_path: Path to output COG
    """
    # Ensure we work with Path objects
    input_path = Path(input_path)
    output_path = Path(output_path)

    print(f"Reading: {input_path}")
    
    with rasterio.open(input_path) as src:
        # Read metadata
        bounds = src.bounds
        crs = src.crs
        width = src.width
        height = src.height
        transform = src.transform
        
        # Calculate resolution in meters (approximate)
        # At equator: 1 degree ≈ 111km
        # For 15 arc-second: 15/3600 * 111000 ≈ 463m
        resolution_m = abs(transform[0]) * 111000
        
        print(f"  Size: {width}x{height}")
        print(f"  Resolution: ~{resolution_m:.0f}m")
        print(f"  Bounds: {bounds}")
        
        # Create COG profile
        profile = src.profile.copy()
        profile.update({
            'driver': 'GTiff',
            'compress': 'DEFLATE',
            'tiled': True,
            'blockxsize': 512,
            'blockysize': 512,
            'BIGTIFF': 'IF_SAFER',
            'INTERLEAVE': 'BAND',
        })
        
        print(f"Writing COG: {output_path}")
        with rasterio.open(output_path, 'w', **profile) as dst:
            # Copy data
            data = src.read(1)
            dst.write(data, 1)
        
        # Build overviews (optional - requires GDAL)
        import subprocess
        try:
            subprocess.run(['gdaladdo', '--version'], 
                          capture_output=True, 
                          check=True, 
                          timeout=5)
            print("Building overviews...")
            subprocess.run([
                'gdaladdo',
                '-r', 'average',
                str(output_path),
                '2', '4', '8', '16'
            ], check=True)
            print("✓ Overviews built")
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            print("⚠️  gdaladdo not found, skipping overviews")
            print("   COG will work but may be slower for some queries")
            print("   Install GDAL for better performance: brew install gdal (macOS)")
        
        # Generate metadata
        metadata = {
            'source': 'GEBCO_2025',
            'resolution_m': round(resolution_m),
            'bbox': {
                'min_lon': bounds.left,
                'min_lat': bounds.bottom,
                'max_lon': bounds.right,
                'max_lat': bounds.top,
            },
            'crs': str(crs),
            'width': width,
            'height': height,
        }
        
        metadata_path = output_path.with_suffix('.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✓ COG created: {output_path}")
        print(f"✓ Metadata: {metadata_path}")


def main():
    parser = argparse.ArgumentParser(description='Create Cloud Optimized GeoTIFF')
    parser.add_argument('--input', required=True, help='Input GeoTIFF path')
    parser.add_argument('--output', required=True, help='Output COG path')
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)
    
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    create_cog(str(input_path), str(output_path))


if __name__ == '__main__':
    main()

