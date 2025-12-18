#!/usr/bin/env python3
"""
Build clarity mask from turbidity/SPM data.

This script processes downloaded turbidity NetCDF files and creates
a single clarity score COG (0..1) where higher values indicate clearer water.

Usage:
    python build_clarity_mask.py \
        --input-dir data/bathymetry/turbidity/raw \
        --region med \
        --output data/bathymetry/clarity/clarity_TR_cog.tif
"""

import argparse
import sys
from pathlib import Path
import json
from datetime import datetime
import numpy as np
import rasterio
from rasterio.transform import from_bounds
import xarray as xr
import rioxarray


def build_clarity_mask(
    input_dir: Path,
    region: str,
    output_path: Path,
    tur_low: float = None,
    tur_high: float = None
):
    """
    Build clarity mask from turbidity data.
    
    Args:
        input_dir: Directory containing turbidity NetCDF files
        region: Region name ('med' or 'blk')
        output_path: Output COG file path
        tur_low: Lower turbidity threshold (default: auto from p20)
        tur_high: Upper turbidity threshold (default: auto from p80)
    """
    print(f"Building clarity mask from turbidity data in {input_dir}")
    
    # Find all turbidity NetCDF files
    nc_files = sorted(input_dir.glob(f"turbidity_{region}_*.nc"))
    
    if not nc_files:
        print(f"ERROR: No turbidity NetCDF files found in {input_dir}")
        print(f"Expected pattern: turbidity_{region}_YYYYMM.nc")
        sys.exit(1)
    
    print(f"  Found {len(nc_files)} files")
    
    # Load and stack all TUR data
    tur_arrays = []
    lats = None
    lons = None
    transform = None
    
    for nc_file in nc_files:
        print(f"  Loading {nc_file.name}...")
        
        try:
            ds = xr.open_dataset(nc_file)
            
            # Find TUR variable
            tur_var = None
            for var in ds.data_vars:
                if 'TUR' in var.upper() or 'turbidity' in var.lower():
                    tur_var = var
                    break
            
            if not tur_var:
                print(f"    ⚠ Warning: TUR variable not found in {nc_file.name}")
                ds.close()
                continue
            
            tur_data = ds[tur_var]
            
            # Handle time dimension
            if 'time' in tur_data.dims:
                # Use median across time (more robust than mean)
                tur_data = tur_data.median(dim='time', skipna=True)
            
            # Get coordinates
            if lats is None:
                if 'lat' in ds.coords:
                    lats = ds.coords['lat'].values
                    lons = ds.coords['lon'].values
                elif 'latitude' in ds.coords:
                    lats = ds.coords['latitude'].values
                    lons = ds.coords['longitude'].values
                else:
                    print(f"    ⚠ Warning: Could not find lat/lon coordinates")
                    ds.close()
                    continue
                
                # Calculate transform
                min_lon, max_lon = lons.min(), lons.max()
                min_lat, max_lat = lats.min(), lats.max()
                
                if lats.ndim == 1 and lons.ndim == 1:
                    height, width = len(lats), len(lons)
                else:
                    height, width = lats.shape
                
                transform = from_bounds(min_lon, min_lat, max_lon, max_lat, width, height)
            
            # Get TUR values
            tur_values = tur_data.values
            
            # Handle 2D coordinates
            if tur_values.ndim == 2:
                tur_arrays.append(tur_values)
            
            ds.close()
            
        except Exception as e:
            print(f"    ⚠ Warning: Failed to load {nc_file.name}: {e}")
            continue
    
    if not tur_arrays:
        print("ERROR: No valid TUR data loaded")
        sys.exit(1)
    
    # Stack and compute climatology (median across all months)
    print(f"  Computing climatology from {len(tur_arrays)} time steps...")
    tur_stack = np.stack(tur_arrays, axis=0)
    tur_climatology = np.nanmedian(tur_stack, axis=0)
    
    print(f"  TUR climatology range: {np.nanmin(tur_climatology):.2f} to {np.nanmax(tur_climatology):.2f} FNU")
    
    # Auto-determine thresholds if not provided
    if tur_low is None or tur_high is None:
        valid_tur = tur_climatology[~np.isnan(tur_climatology)]
        if len(valid_tur) > 0:
            p20 = np.percentile(valid_tur, 20)
            p80 = np.percentile(valid_tur, 80)
            tur_low = tur_low if tur_low is not None else p20
            tur_high = tur_high if tur_high is not None else p80
            print(f"  Auto thresholds: low={tur_low:.2f} FNU (p20), high={tur_high:.2f} FNU (p80)")
        else:
            # Fallback to fixed values
            tur_low = tur_low if tur_low is not None else 1.0
            tur_high = tur_high if tur_high is not None else 10.0
            print(f"  Using fixed thresholds: low={tur_low:.2f} FNU, high={tur_high:.2f} FNU")
    
    # Compute clarity score: 1 - normalized TUR
    # TUR_norm = clamp((TUR - tur_low) / (tur_high - tur_low), 0..1)
    # clarity = 1 - TUR_norm
    tur_range = tur_high - tur_low
    if tur_range > 0:
        tur_norm = np.clip((tur_climatology - tur_low) / tur_range, 0, 1)
        clarity = 1.0 - tur_norm
    else:
        # All values are the same - set clarity to 0.5
        clarity = np.full_like(tur_climatology, 0.5, dtype=np.float32)
    
    # Set nodata
    clarity[np.isnan(tur_climatology)] = np.nan
    
    print(f"  Clarity score range: {np.nanmin(clarity):.3f} to {np.nanmax(clarity):.3f}")
    
    # Write COG
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Writing COG: {output_path}")
    
    profile = {
        'driver': 'GTiff',
        'height': clarity.shape[0],
        'width': clarity.shape[1],
        'count': 1,
        'dtype': 'float32',
        'crs': 'EPSG:4326',
        'transform': transform,
        'compress': 'DEFLATE',
        'tiled': True,
        'blockxsize': 512,
        'blockysize': 512,
        'nodata': np.nan,
    }
    
    with rasterio.open(output_path, 'w', **profile) as dst:
        dst.write(clarity.astype(np.float32), 1)
        dst.set_band_description(1, 'clarity_score')
    
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
        'input_directory': str(input_dir),
        'region': region,
        'output_file': str(output_path),
        'tur_low_threshold': tur_low,
        'tur_high_threshold': tur_high,
        'num_input_files': len(nc_files),
        'clarity_range': [float(np.nanmin(clarity)), float(np.nanmax(clarity))],
        'build_date': datetime.now().isoformat(),
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✓ Clarity mask created: {output_path}")
    print(f"✓ Metadata saved: {metadata_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Build clarity mask from turbidity data"
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        required=True,
        help="Directory containing turbidity NetCDF files"
    )
    parser.add_argument(
        "--region",
        choices=['med', 'blk'],
        required=True,
        help="Region: 'med' or 'blk'"
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Output COG file path"
    )
    parser.add_argument(
        "--tur-low",
        type=float,
        help="Lower turbidity threshold (FNU). Default: auto from p20"
    )
    parser.add_argument(
        "--tur-high",
        type=float,
        help="Upper turbidity threshold (FNU). Default: auto from p80"
    )
    
    args = parser.parse_args()
    
    if not args.input_dir.exists():
        print(f"ERROR: Input directory not found: {args.input_dir}")
        sys.exit(1)
    
    build_clarity_mask(
        input_dir=args.input_dir,
        region=args.region,
        output_path=args.output,
        tur_low=args.tur_low,
        tur_high=args.tur_high
    )


if __name__ == "__main__":
    main()

