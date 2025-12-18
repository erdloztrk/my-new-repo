#!/usr/bin/env python3
"""
Convert NetCDF bathymetry data to Cloud Optimized GeoTIFF (COG).

This script reads a NetCDF file (e.g., from Copernicus SDB) and converts
it to a multi-band COG with depth, quality, and source information.

Usage:
    python netcdf_to_cog.py \
        --input data/bathymetry/sdb/raw/sdb_comp_TR.nc \
        --depth-var depth \
        --quality-var quality \
        --output data/bathymetry/sdb/sdb_TR_cog.tif
"""

import argparse
import sys
from pathlib import Path
import json
from datetime import datetime
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from rasterio.enums import Resampling
import xarray as xr
import rioxarray


def netcdf_to_cog(
    input_path: Path,
    output_path: Path,
    depth_var: str,
    quality_var: str = None,
    source_var: str = None
):
    """
    Convert NetCDF to multi-band COG.
    
    Args:
        input_path: Input NetCDF file
        output_path: Output COG file
        depth_var: Name of depth variable
        quality_var: Optional name of quality variable
        source_var: Optional name of source variable
    """
    print(f"Reading NetCDF: {input_path}")
    
    # Open NetCDF
    ds = xr.open_dataset(input_path)
    
    # Check if depth variable exists
    if depth_var not in ds.data_vars:
        print(f"ERROR: Depth variable '{depth_var}' not found in dataset")
        print(f"Available variables: {list(ds.data_vars.keys())}")
        sys.exit(1)
    
    # Get depth data
    depth_data = ds[depth_var]
    
    # Get coordinates
    if 'lat' in ds.coords and 'lon' in ds.coords:
        lats = ds.coords['lat'].values
        lons = ds.coords['lon'].values
    elif 'latitude' in ds.coords and 'longitude' in ds.coords:
        lats = ds.coords['latitude'].values
        lons = ds.coords['longitude'].values
    elif 'y' in ds.coords and 'x' in ds.coords:
        lats = ds.coords['y'].values
        lons = ds.coords['x'].values
    else:
        print("ERROR: Could not find lat/lon coordinates")
        print(f"Available coordinates: {list(ds.coords.keys())}")
        sys.exit(1)
    
    # Handle 1D vs 2D coordinates
    if lats.ndim == 1 and lons.ndim == 1:
        # 1D coordinates - create meshgrid
        lon_grid, lat_grid = np.meshgrid(lons, lats)
        min_lon, max_lon = lons.min(), lons.max()
        min_lat, max_lat = lats.min(), lats.max()
    else:
        # 2D coordinates
        lon_grid = lons
        lat_grid = lats
        min_lon, max_lon = lons.min(), lons.max()
        min_lat, max_lat = lats.min(), lats.max()
    
    # Get depth values
    depth_values = depth_data.values
    
    # Handle time dimension if present
    if 'time' in depth_data.dims:
        print("  Found time dimension, using first time step")
        depth_values = depth_values[0] if depth_values.ndim == 3 else depth_values
    
    # Ensure depth is 2D
    if depth_values.ndim != 2:
        print(f"ERROR: Expected 2D depth data, got {depth_values.ndim}D")
        sys.exit(1)
    
    height, width = depth_values.shape
    
    print(f"  Size: {width}x{height}")
    print(f"  Depth range: {np.nanmin(depth_values):.2f} to {np.nanmax(depth_values):.2f} m")
    
    # Calculate transform
    # Note: NetCDF may have lat/lon in different order
    # Assuming depth_values is (lat, lon) or (y, x)
    transform = from_bounds(min_lon, min_lat, max_lon, max_lat, width, height)
    
    # Prepare bands
    bands = []
    band_names = []
    
    # Band 1: Depth (float32)
    depth_band = depth_values.astype(np.float32)
    # Convert to negative if needed (bathymetry convention)
    if np.nanmean(depth_band) > 0:
        depth_band = -depth_band
    bands.append(depth_band)
    band_names.append('depth_m')
    
    # Band 2: Quality (uint8 or int16)
    if quality_var and quality_var in ds.data_vars:
        quality_data = ds[quality_var].values
        if 'time' in ds[quality_var].dims:
            quality_data = quality_data[0] if quality_data.ndim == 3 else quality_data
        
        # Normalize quality to 0-255
        quality_min = np.nanmin(quality_data)
        quality_max = np.nanmax(quality_data)
        if quality_max > quality_min:
            quality_normalized = ((quality_data - quality_min) / (quality_max - quality_min) * 255).astype(np.uint8)
        else:
            quality_normalized = np.full_like(quality_data, 255, dtype=np.uint8)
        
        # Set nodata
        quality_normalized[np.isnan(quality_data)] = 255
        bands.append(quality_normalized)
        band_names.append('quality')
    else:
        # No quality data - fill with nodata
        bands.append(np.full((height, width), 255, dtype=np.uint8))
        band_names.append('quality')
    
    # Band 3: Source code (uint8)
    if source_var and source_var in ds.data_vars:
        source_data = ds[source_var].values
        if 'time' in ds[source_var].dims:
            source_data = source_data[0] if source_data.ndim == 3 else source_data
        
        # Convert to uint8 (0-255)
        source_normalized = np.clip(source_data.astype(np.uint8), 0, 255)
        source_normalized[np.isnan(source_data)] = 0
        bands.append(source_normalized)
        band_names.append('source_code')
    else:
        # Default: 3 = SDB
        bands.append(np.full((height, width), 3, dtype=np.uint8))
        band_names.append('source_code')
    
    # Create output directory
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write COG
    print(f"Writing COG: {output_path}")
    
    profile = {
        'driver': 'GTiff',
        'height': height,
        'width': width,
        'count': len(bands),
        'dtype': bands[0].dtype if len(bands) == 1 else 'float32',
        'crs': 'EPSG:4326',
        'transform': transform,
        'compress': 'DEFLATE',
        'tiled': True,
        'blockxsize': 512,
        'blockysize': 512,
        'nodata': np.nan if bands[0].dtype == np.float32 else None,
    }
    
    with rasterio.open(output_path, 'w', **profile) as dst:
        for i, band in enumerate(bands, 1):
            dst.write(band, i)
            dst.set_band_description(i, band_names[i-1])
        
        # Set nodata for each band
        dst.nodata = np.nan  # Band 1 (depth)
        # Band 2 (quality): nodata = 255
        # Band 3 (source): nodata = 0
    
    # Add overviews
    print("  Adding overviews...")
    import subprocess
    try:
        subprocess.run([
            'gdaladdo',
            '-r', 'average',
            str(output_path),
            '2', '4', '8', '16'
        ], check=True, capture_output=True)
        print("  ✓ Overviews added")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("  ⚠ Warning: gdaladdo not found, skipping overviews")
    
    # Save metadata
    metadata_path = output_path.with_suffix('.json')
    metadata = {
        'input_file': str(input_path),
        'output_file': str(output_path),
        'depth_variable': depth_var,
        'quality_variable': quality_var,
        'source_variable': source_var,
        'bands': band_names,
        'bbox': [min_lon, min_lat, max_lon, max_lat],
        'resolution_approx_m': abs(transform[0]) * 111000,
        'conversion_date': datetime.now().isoformat(),
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✓ COG created: {output_path}")
    print(f"✓ Metadata saved: {metadata_path}")
    
    ds.close()


def main():
    parser = argparse.ArgumentParser(
        description="Convert NetCDF to Cloud Optimized GeoTIFF"
    )
    parser.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Input NetCDF file"
    )
    parser.add_argument(
        "--depth-var",
        required=True,
        help="Name of depth variable"
    )
    parser.add_argument(
        "--quality-var",
        help="Name of quality variable (optional)"
    )
    parser.add_argument(
        "--source-var",
        help="Name of source variable (optional)"
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Output COG file path"
    )
    
    args = parser.parse_args()
    
    if not args.input.exists():
        print(f"ERROR: Input file not found: {args.input}")
        sys.exit(1)
    
    netcdf_to_cog(
        input_path=args.input,
        output_path=args.output,
        depth_var=args.depth_var,
        quality_var=args.quality_var,
        source_var=args.source_var
    )


if __name__ == "__main__":
    main()

