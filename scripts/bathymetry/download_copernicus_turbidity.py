#!/usr/bin/env python3
"""
Download Copernicus Marine Turbidity/SPM data for clarity mask generation.

This script downloads monthly turbidity and SPM data from Copernicus Marine
Service for MED and BLK regions, then builds a climatology mask.

Usage:
    python download_copernicus_turbidity.py \
        --region med \
        --bbox 25.8 39.6 27.2 40.5 \
        --start 2023-01-01 \
        --end 2024-01-01 \
        --out-dir data/bathymetry/turbidity/raw

Environment Variables:
    COPERNICUSMARINE_SERVICE_USERNAME: Copernicus Marine username
    COPERNICUSMARINE_SERVICE_PASSWORD: Copernicus Marine password
"""

import argparse
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import json

try:
    import copernicusmarine
    from copernicusmarine import subset
except ImportError:
    print("ERROR: copernicusmarine package not installed.")
    print("Install with: pip install copernicusmarine")
    sys.exit(1)


# Dataset IDs for MED and BLK regions
DATASET_IDS = {
    'med': 'OCEANCOLOUR_MED_BGC_HR_L4_NRT_009_211',
    'blk': 'OCEANCOLOUR_BLK_BGC_HR_L4_NRT_009_212',
}


def download_turbidity(
    region: str,
    bbox: tuple[float, float, float, float],
    start_date: datetime,
    end_date: datetime,
    output_dir: Path,
    mode: str = 'monthly'
):
    """
    Download turbidity and SPM data.
    
    Args:
        region: 'med' or 'blk'
        bbox: (min_lon, min_lat, max_lon, max_lat)
        start_date: Start date
        end_date: End date
        output_dir: Output directory for NetCDF files
        mode: 'monthly' or 'daily'
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    
    dataset_id = DATASET_IDS.get(region.lower())
    if not dataset_id:
        print(f"ERROR: Unknown region '{region}'. Use 'med' or 'blk'")
        sys.exit(1)
    
    print(f"Downloading turbidity/SPM for {region.upper()} region")
    print(f"  Dataset: {dataset_id}")
    print(f"  Bounding box: lon=[{min_lon}, {max_lon}], lat=[{min_lat}, {max_lat}]")
    print(f"  Period: {start_date.date()} to {end_date.date()}")
    print(f"  Mode: {mode}")
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Check credentials
    username = os.getenv("COPERNICUSMARINE_SERVICE_USERNAME")
    password = os.getenv("COPERNICUSMARINE_SERVICE_PASSWORD")
    
    if not username or not password:
        print("ERROR: Copernicus Marine credentials not set.")
        print("Set environment variables:")
        print("  export COPERNICUSMARINE_SERVICE_USERNAME=your_username")
        print("  export COPERNICUSMARINE_SERVICE_PASSWORD=your_password")
        sys.exit(1)
    
    # Login
    try:
        copernicusmarine.login(username=username, password=password, overwrite_config_file=True)
        print("✓ Logged in to Copernicus Marine Service")
    except Exception as e:
        print(f"⚠ Warning: Login failed (may already be logged in): {e}")
    
    # Variables to download
    variables = ['TUR', 'SPM']  # Turbidity (FNU) and Suspended Particulate Matter (mg/l)
    
    # Generate date range
    if mode == 'monthly':
        # Monthly products: one file per month
        current_date = start_date.replace(day=1)  # Start of month
        files_downloaded = []
        
        while current_date < end_date:
            month_start = current_date
            month_end = (current_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            if month_end > end_date:
                month_end = end_date
            
            output_filename = f"turbidity_{region}_{month_start.strftime('%Y%m')}.nc"
            output_path = output_dir / output_filename
            
            print(f"\nDownloading {month_start.strftime('%Y-%m')}...")
            
            try:
                subset(
                    dataset_id=dataset_id,
                    variables=variables,
                    minimum_longitude=min_lon,
                    maximum_longitude=max_lon,
                    minimum_latitude=min_lat,
                    maximum_latitude=max_lat,
                    start_datetime=month_start.strftime('%Y-%m-%dT%H:%M:%S'),
                    end_datetime=month_end.strftime('%Y-%m-%dT%H:%M:%S'),
                    output_filename=output_filename,
                    output_directory=str(output_dir),
                    force_download=True,
                )
                
                if output_path.exists():
                    files_downloaded.append(str(output_path))
                    print(f"  ✓ Downloaded: {output_path}")
                else:
                    print(f"  ⚠ Warning: File not found after download: {output_path}")
                    
            except Exception as e:
                print(f"  ⚠ Warning: Failed to download {month_start.strftime('%Y-%m')}: {e}")
            
            # Move to next month
            if month_end.month == 12:
                current_date = month_end.replace(year=month_end.year + 1, month=1, day=1)
            else:
                current_date = month_end.replace(month=month_end.month + 1, day=1)
        
        print(f"\n✓ Download complete. {len(files_downloaded)} files downloaded.")
        
        # Save metadata
        metadata_path = output_dir / f"turbidity_{region}_metadata.json"
        metadata = {
            'region': region,
            'dataset_id': dataset_id,
            'bbox': bbox,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'mode': mode,
            'variables': variables,
            'files': files_downloaded,
            'download_date': datetime.now().isoformat(),
        }
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✓ Metadata saved: {metadata_path}")
        print("\nNext step: Build clarity mask using build_clarity_mask.py")
        
    else:
        print(f"ERROR: Mode '{mode}' not implemented. Use 'monthly'")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Download Copernicus Marine turbidity/SPM data"
    )
    parser.add_argument(
        "--region",
        choices=['med', 'blk'],
        required=True,
        help="Region: 'med' (Mediterranean) or 'blk' (Black Sea)"
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
        "--start",
        type=str,
        default=None,
        help="Start date (YYYY-MM-DD). Default: 12 months ago"
    )
    parser.add_argument(
        "--end",
        type=str,
        default=None,
        help="End date (YYYY-MM-DD). Default: today"
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        required=True,
        help="Output directory for NetCDF files"
    )
    parser.add_argument(
        "--mode",
        choices=['monthly', 'daily'],
        default='monthly',
        help="Download mode (default: monthly)"
    )
    
    args = parser.parse_args()
    
    # Parse dates
    if args.end:
        end_date = datetime.strptime(args.end, '%Y-%m-%d')
    else:
        end_date = datetime.now()
    
    if args.start:
        start_date = datetime.strptime(args.start, '%Y-%m-%d')
    else:
        # Default: 12 months ago
        start_date = end_date - timedelta(days=365)
    
    if start_date >= end_date:
        print("ERROR: Start date must be before end date")
        sys.exit(1)
    
    download_turbidity(
        region=args.region,
        bbox=tuple(args.bbox),
        start_date=start_date,
        end_date=end_date,
        output_dir=args.out_dir,
        mode=args.mode
    )


if __name__ == "__main__":
    main()

