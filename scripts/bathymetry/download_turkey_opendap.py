#!/usr/bin/env python3
"""
Download GEBCO 2025 data for Turkey region only using OPeNDAP.
This downloads only the subset we need, saving disk space and time.
"""

import argparse
import sys
from pathlib import Path
import netCDF4
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from rasterio.crs import CRS


def download_turkey_gebco(output_path: str, bbox: tuple[float, float, float, float]):
    """
    Download GEBCO 2025 subset for Turkey region via OPeNDAP.
    
    Args:
        output_path: Path to output GeoTIFF
        bbox: (min_lon, min_lat, max_lon, max_lat)
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    
    print("📥 GEBCO 2025 - Türkiye Bölgesi İndirme")
    print("=" * 50)
    print(f"Bölge: ({min_lon}°E, {min_lat}°N) to ({max_lon}°E, {max_lat}°N)")
    print("")
    
    # GEBCO 2025 OPeNDAP URL (CEDA archive)
    # Try different URL formats
    urls = [
        "https://dap.ceda.ac.uk/bodc/gebco/global/gebco_2025/sub_ice_topography_bathymetry/netcdf/gebco_2025_sub_ice_topo.nc",
        "https://dap.ceda.ac.uk/threads/catalogue/bodc/gebco/global/gebco_2025/sub_ice_topography_bathymetry/netcdf/gebco_2025_sub_ice_topo.nc",
    ]
    
    url = None
    for test_url in urls:
        try:
            print(f"Trying URL: {test_url}")
            test_ds = netCDF4.Dataset(test_url)
            test_ds.close()
            url = test_url
            print(f"✓ URL çalışıyor: {url}")
            break
        except Exception as e:
            print(f"  ❌ Bu URL çalışmıyor: {e}")
            continue
    
    if url is None:
        raise RuntimeError("Hiçbir OPeNDAP URL'si çalışmıyor. Manuel indirme yapın.")
    
    print("OPeNDAP'ten veri indiriliyor...")
    print(f"URL: {url}")
    print("")
    
    try:
        ds = netCDF4.Dataset(url)
        
        # Get elevation data and coordinates
        elevation = ds.variables['elevation']
        lon = ds.variables['lon'][:]
        lat = ds.variables['lat'][:]
        
        print(f"Grid boyutu: {len(lon)} x {len(lat)}")
        print(f"Lon aralığı: {lon.min():.2f}° to {lon.max():.2f}°")
        print(f"Lat aralığı: {lat.min():.2f}° to {lat.max():.2f}°")
        print("")
        
        # Find indices for Turkey region
        lon_mask = (lon >= min_lon) & (lon <= max_lon)
        lat_mask = (lat >= min_lat) & (lat <= max_lat)
        
        lon_indices = np.where(lon_mask)[0]
        lat_indices = np.where(lat_mask)[0]
        
        if len(lon_indices) == 0 or len(lat_indices) == 0:
            print("❌ Hata: Bölge bulunamadı!")
            print(f"   Mevcut lon aralığı: {lon.min():.2f}° to {lon.max():.2f}°")
            print(f"   Mevcut lat aralığı: {lat.min():.2f}° to {lat.max():.2f}°")
            sys.exit(1)
        
        lon_min_idx, lon_max_idx = lon_indices[0], lon_indices[-1]
        lat_min_idx, lat_max_idx = lat_indices[0], lat_indices[-1]
        
        print(f"İndisler: lon[{lon_min_idx}:{lon_max_idx+1}], lat[{lat_min_idx}:{lat_max_idx+1}]")
        
        # Actual bounds
        actual_lon_min = lon[lon_min_idx]
        actual_lon_max = lon[lon_max_idx]
        actual_lat_min = lat[lat_min_idx]
        actual_lat_max = lat[lat_max_idx]
        
        print(f"Gerçek sınırlar: ({actual_lon_min:.4f}°E, {actual_lat_min:.4f}°N) to ({actual_lon_max:.4f}°E, {actual_lat_max:.4f}°N)")
        print("")
        
        # Read subset
        print("Veri okunuyor (bu biraz zaman alabilir)...")
        data = elevation[lat_min_idx:lat_max_idx+1, lon_min_idx:lon_max_idx+1]
        
        print(f"Veri boyutu: {data.shape[0]} x {data.shape[1]}")
        print(f"Derinlik aralığı: {data.min():.1f}m to {data.max():.1f}m")
        print("")
        
        # Create GeoTIFF
        transform = from_bounds(
            actual_lon_min, actual_lat_min, 
            actual_lon_max, actual_lat_max, 
            data.shape[1], data.shape[0]
        )
        
        profile = {
            'driver': 'GTiff',
            'height': data.shape[0],
            'width': data.shape[1],
            'count': 1,
            'dtype': data.dtype,
            'crs': CRS.from_epsg(4326),
            'transform': transform,
            'compress': 'lzw',
            'tiled': True,
        }
        
        output_path_obj = Path(output_path)
        output_path_obj.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"GeoTIFF yazılıyor: {output_path}")
        with rasterio.open(output_path, 'w', **profile) as dst:
            dst.write(data, 1)
        
        ds.close()
        
        print("")
        print("✓ İndirme tamamlandı!")
        print(f"  Dosya: {output_path}")
        file_size = output_path_obj.stat().st_size / (1024 * 1024)
        print(f"  Boyut: {file_size:.1f} MB")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        print("")
        print("Alternatif: Manuel indirme yapın:")
        print("1. https://betadownload.gebco.net adresine gidin")
        print("2. Türkiye bölgesini seçin")
        print("3. GeoTIFF formatında indirin")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Download GEBCO 2025 data for Turkey region via OPeNDAP'
    )
    parser.add_argument(
        '--output', 
        default='data/raw/gebco_2025_turkey.tif',
        help='Output GeoTIFF path'
    )
    parser.add_argument(
        '--bbox',
        nargs=4,
        type=float,
        default=[25.0, 35.0, 45.0, 42.0],
        help='Bounding box: min_lon min_lat max_lon max_lat (default: Turkey)'
    )
    
    args = parser.parse_args()
    
    bbox = tuple(args.bbox)
    download_turkey_gebco(args.output, bbox)


if __name__ == '__main__':
    main()

