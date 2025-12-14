#!/usr/bin/env python3
"""
Download EMODnet Bathymetry data for Turkey region (F7 tile).
EMODnet provides higher resolution data for coastal areas compared to GEBCO.
"""

import argparse
import sys
import requests
from pathlib import Path
import zipfile
import shutil

# EMODnet F7 tile covers Turkey region
# Bounding box: 23.25-33.125 lon, 33.75-43.125 lat
EMODNET_F7_URL = "https://downloads.emodnet-bathymetry.eu/v12/F7_2024.tif.zip"
EMODNET_F7_TILE = "F7_2024.tif"


def download_emodnet(output_dir: Path, output_filename: str = None):
    """
    Download EMODnet F7 tile for Turkey region.
    
    Args:
        output_dir: Directory to save the downloaded file
        output_filename: Optional custom filename (default: emodnet_f7_2024.tif)
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    zip_path = output_dir / "F7_2024.tif.zip"
    final_tif_path = output_dir / (output_filename or "emodnet_f7_2024.tif")
    
    print(f"Downloading EMODnet F7 tile from: {EMODNET_F7_URL}")
    print(f"Output directory: {output_dir}")
    
    try:
        # Download ZIP file
        print("Downloading...")
        response = requests.get(EMODNET_F7_URL, stream=True, timeout=300)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(zip_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\rProgress: {percent:.1f}%", end='', flush=True)
        
        print("\n✓ Download complete")
        
        # Extract ZIP file
        print("Extracting...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Find the .tif file in the zip
            tif_files = [f for f in zip_ref.namelist() if f.endswith('.tif')]
            if not tif_files:
                raise ValueError("No .tif file found in ZIP archive")
            
            # Extract the first .tif file
            extracted_tif = tif_files[0]
            print(f"  Found: {extracted_tif}")
            
            # Extract to temporary location
            zip_ref.extract(extracted_tif, output_dir)
            extracted_path = output_dir / extracted_tif
            
            # Move to final location
            if extracted_path != final_tif_path:
                shutil.move(str(extracted_path), str(final_tif_path))
            
            print(f"✓ Extracted to: {final_tif_path}")
        
        # Clean up ZIP file
        zip_path.unlink()
        print(f"✓ Cleaned up ZIP file")
        
        print(f"\n✓ EMODnet download complete!")
        print(f"  Output: {final_tif_path}")
        print(f"  Tile: F7 (Turkey region)")
        print(f"  Bounding box: 23.25-33.125°E, 33.75-43.125°N")
        
        return final_tif_path
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Download failed: {e}")
        if zip_path.exists():
            zip_path.unlink()
        sys.exit(1)
    except zipfile.BadZipFile as e:
        print(f"✗ Invalid ZIP file: {e}")
        if zip_path.exists():
            zip_path.unlink()
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {e}")
        if zip_path.exists():
            zip_path.unlink()
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Download EMODnet Bathymetry F7 tile for Turkey region"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/raw",
        help="Output directory (default: data/raw)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output filename (default: emodnet_f7_2024.tif)"
    )
    
    args = parser.parse_args()
    
    download_emodnet(Path(args.output_dir), args.output)

