#!/usr/bin/env python3
"""
Download GEBCO 2025 tiles for Turkey region only.
GEBCO provides 8 tiles (90°x90° each) covering the globe.
Turkey is in tile: 30°E-120°E, 0°N-90°N (Tile 3)
"""

import argparse
import sys
from pathlib import Path
import subprocess
import tempfile
import shutil

# GEBCO 2025 tile URLs (90°x90° tiles)
# Tile covering Turkey: 30°E-120°E, 0°N-90°N
TURKEY_TILE_URL = "https://dap.ceda.ac.uk/bodc/gebco/global/gebco_2025/sub_ice_topography_bathymetry/geotiff/gebco_2025_sub_ice_topo_geotiff_tile_3.zip"

def download_turkey_tile(output_dir: str):
    """Download GEBCO tile covering Turkey region."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print("📥 GEBCO 2025 - Türkiye Bölgesi (Tile İndirme)")
    print("=" * 50)
    print("")
    print("⚠️  Bu yöntem bir tile indirir (~500 MB)")
    print("   Türkiye 30°E-120°E, 0°N-90°N tile'ında yer alıyor")
    print("")
    
    zip_file = output_path / "gebco_tile_3.zip"
    extracted_dir = output_path / "gebco_tile_3"
    
    if zip_file.exists():
        print(f"✓ Dosya zaten mevcut: {zip_file}")
        response = input("Yeniden indir? (y/N): ")
        if response.lower() != 'y':
            print("İndirme atlandı.")
        else:
            zip_file.unlink()
    
    if not zip_file.exists():
        print(f"İndiriliyor: {TURKEY_TILE_URL}")
        print("Bu biraz zaman alabilir (~500 MB)...")
        print("")
        
        try:
            subprocess.run(
                ["curl", "-L", "-o", str(zip_file), TURKEY_TILE_URL],
                check=True,
                timeout=600  # 10 dakika timeout
            )
        except subprocess.TimeoutExpired:
            print("❌ İndirme zaman aşımına uğradı.")
            print("Lütfen manuel olarak indirin:")
            print(f"  {TURKEY_TILE_URL}")
            sys.exit(1)
        except subprocess.CalledProcessError as e:
            print(f"❌ İndirme hatası: {e}")
            sys.exit(1)
    
    print("")
    print("✓ İndirme tamamlandı!")
    print("")
    print("Açılıyor...")
    
    # Extract
    extracted_dir.mkdir(exist_ok=True)
    try:
        subprocess.run(
            ["unzip", "-q", "-o", str(zip_file), "-d", str(extracted_dir)],
            check=True
        )
    except subprocess.CalledProcessError:
        print("❌ Açma hatası. Manuel olarak açın.")
        sys.exit(1)
    
    # Find GeoTIFF file
    tif_files = list(extracted_dir.rglob("*.tif")) + list(extracted_dir.rglob("*.tiff"))
    
    if not tif_files:
        print("❌ GeoTIFF dosyası bulunamadı!")
        print(f"İçerik: {list(extracted_dir.iterdir())}")
        sys.exit(1)
    
    source_tif = tif_files[0]
    target_tif = output_path / "gebco_2025_turkey.tif"
    
    print(f"Kopyalanıyor: {source_tif} -> {target_tif}")
    shutil.copy2(source_tif, target_tif)
    
    print("")
    print("✓ Tamamlandı!")
    print(f"  Dosya: {target_tif}")
    print(f"  Boyut: {target_tif.stat().st_size / (1024*1024):.1f} MB")
    print("")
    print("Sonraki adım: COG formatına dönüştürün:")
    print(f"  python scripts/bathymetry/create_cog.py --input {target_tif} --output data/processed/gebco_turkey_cog.tif")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Download GEBCO tile for Turkey region')
    parser.add_argument('--output-dir', default='data/raw', help='Output directory')
    args = parser.parse_args()
    
    download_turkey_tile(args.output_dir)

