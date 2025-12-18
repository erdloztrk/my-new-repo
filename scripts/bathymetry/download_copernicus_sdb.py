#!/usr/bin/env python3
"""
Download Copernicus Marine Satellite Derived Bathymetry (SDB) data.

This script downloads SDB composite data from Copernicus Marine Service
and saves it as NetCDF for further processing.

Usage:
    python download_copernicus_sdb.py \
        --bbox 25.8 39.6 27.2 40.5 \
        --out data/bathymetry/sdb/raw/sdb_comp_TR.nc

Environment Variables:
    COPERNICUSMARINE_SERVICE_USERNAME: Copernicus Marine username
    COPERNICUSMARINE_SERVICE_PASSWORD: Copernicus Marine password
    COPERNICUSMARINE_CACHE_DIRECTORY: Optional cache directory
"""

import argparse
import os
import sys
from pathlib import Path
import json
from datetime import datetime

try:
    import copernicusmarine
    from copernicusmarine import subset
except ImportError:
    print("ERROR: copernicusmarine package not installed.")
    print("Install with: pip install copernicusmarine")
    sys.exit(1)

try:
    import xarray as xr
except ImportError:
    print("ERROR: xarray package not installed.")
    print("Install with: pip install xarray")
    sys.exit(1)


def auto_detect_variables(nc_path: Path) -> dict:
    """
    Auto-detect depth, quality, and source variables in NetCDF file.
    
    Returns:
        dict with keys: depth_var, quality_var, source_var (may be None)
    """
    print(f"Auto-detecting variables in {nc_path}...")
    
    with xr.open_dataset(nc_path) as ds:
        all_vars = list(ds.data_vars.keys())
        coords = list(ds.coords.keys())
        
        print(f"  Found {len(all_vars)} data variables: {all_vars}")
        print(f"  Found {len(coords)} coordinates: {coords}")
        
        # Try to find depth variable
        depth_var = None
        for var in all_vars:
            var_lower = var.lower()
            if any(keyword in var_lower for keyword in ['depth', 'bathymetry', 'bathy', 'z', 'elevation']):
                depth_var = var
                break
        
        # Try to find quality variable
        quality_var = None
        for var in all_vars:
            var_lower = var.lower()
            if any(keyword in var_lower for keyword in ['quality', 'qi', 'q', 'confidence', 'uncertainty']):
                quality_var = var
                break
        
        # Try to find source/method variable
        source_var = None
        for var in all_vars:
            var_lower = var.lower()
            if any(keyword in var_lower for keyword in ['source', 'method', 'algorithm', 'type']):
                source_var = var
                break
        
        result = {
            'depth_var': depth_var,
            'quality_var': quality_var,
            'source_var': source_var,
        }
        
        print(f"  Detected depth variable: {depth_var}")
        print(f"  Detected quality variable: {quality_var}")
        print(f"  Detected source variable: {source_var}")
        
        return result


def download_sdb(
    dataset_id: str,
    bbox: tuple[float, float, float, float],
    output_path: Path,
    variables: list[str] = None
) -> dict:
    """
    Download SDB data from Copernicus Marine Service.
    
    Args:
        dataset_id: Copernicus dataset ID
        bbox: (min_lon, min_lat, max_lon, max_lat)
        output_path: Path to save NetCDF file
        variables: Optional list of variable names to download
    
    Returns:
        dict with variable detection results
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    
    print(f"Downloading SDB dataset: {dataset_id}")
    print(f"  Bounding box: lon=[{min_lon}, {max_lon}], lat=[{min_lat}, {max_lat}]")
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Check credentials
    username = os.getenv("COPERNICUSMARINE_SERVICE_USERNAME")
    password = os.getenv("COPERNICUSMARINE_SERVICE_PASSWORD")
    
    if not username or not password:
        print("ERROR: Copernicus Marine credentials not set.")
        print("Set environment variables:")
        print("  export COPERNICUSMARINE_SERVICE_USERNAME=your_username")
        print("  export COPERNICUSMARINE_SERVICE_PASSWORD=your_password")
        sys.exit(1)
    
    # Login to Copernicus Marine (if not already logged in)
    try:
        # Try new API first
        try:
            copernicusmarine.login(username=username, password=password)
        except TypeError:
            # Fallback to old API if overwrite_config_file exists
            copernicusmarine.login(username=username, password=password, overwrite_config_file=True)
        print("✓ Logged in to Copernicus Marine Service")
    except Exception as e:
        print(f"⚠ Warning: Login failed (may already be logged in): {e}")
    
    # If variables not specified, download all and auto-detect
    if variables is None:
        print("No variables specified, downloading all variables for auto-detection...")
        variables = None  # Download all
    
    try:
        # Download subset
        print("Downloading subset...")
        # Use absolute path and ensure directory exists
        abs_output_path = output_path.resolve()
        abs_output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Use only output_directory, include filename in path
        subset_result = subset(
            dataset_id=dataset_id,
            variables=variables,
            minimum_longitude=min_lon,
            maximum_longitude=max_lon,
            minimum_latitude=min_lat,
            maximum_latitude=max_lat,
            output_directory=str(abs_output_path.parent),
            output_filename=abs_output_path.name,
        )
        
        print(f"✓ Download complete: {output_path}")
        
        # Auto-detect variables if not specified
        if variables is None:
            var_info = auto_detect_variables(output_path)
            return var_info
        else:
            return {'depth_var': variables[0] if variables else None}
            
    except Exception as e:
        print(f"ERROR: Download failed: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Download Copernicus Marine SDB data"
    )
    parser.add_argument(
        "--dataset-id",
        default="cmems_obs-sdb_glo_phy_comp_my_100m-l4-s2_static",
        help="Copernicus dataset ID (default: SDB composite)"
    )
    parser.add_argument(
        "--bbox",
        nargs=4,
        type=float,
        metavar=("MIN_LON", "MIN_LAT", "MAX_LON", "MAX_LAT"),
        required=True,
        help="Bounding box: min_lon min_lat max_lon max_lat"
    )
    parser.add_argument(
        "--out",
        type=Path,
        required=True,
        help="Output NetCDF file path"
    )
    parser.add_argument(
        "--variables",
        nargs="+",
        help="Variable names to download (default: auto-detect)"
    )
    
    args = parser.parse_args()
    
    bbox = tuple(args.bbox)
    
    # Download
    var_info = download_sdb(
        dataset_id=args.dataset_id,
        bbox=bbox,
        output_path=args.out,
        variables=args.variables
    )
    
    # Save metadata
    metadata_path = args.out.with_suffix('.json')
    metadata = {
        'dataset_id': args.dataset_id,
        'bbox': bbox,
        'output_file': str(args.out),
        'variables': var_info,
        'download_date': datetime.now().isoformat(),
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✓ Metadata saved: {metadata_path}")
    print("\nNext step: Convert NetCDF to COG using netcdf_to_cog.py")


if __name__ == "__main__":
    main()

