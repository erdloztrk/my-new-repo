#!/usr/bin/env python3
"""
Build fused bathymetry COG from multiple sources (EMODnet, GEBCO, SDB, Clarity).

This script combines depth data from multiple sources using a fusion algorithm
that prioritizes SDB in shallow coastal areas (with quality/clarity checks)
and falls back to EMODnet/GEBCO in deeper areas.

Usage:
    python build_fused_bathymetry.py \
        --emodnet data/processed/emodnet_turkey_cog.tif \
        --gebco data/processed/gebco_turkey_cog.tif \
        --sdb data/bathymetry/sdb/sdb_TR_cog.tif \
        --clarity data/bathymetry/clarity/clarity_TR_cog.tif \
        --output data/bathymetry/fused/fused_TR_cog.tif
"""

import argparse
import sys
from pathlib import Path
import json
from datetime import datetime
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling, calculate_default_transform
from rasterio.enums import Resampling as ResamplingEnum


def quality_weight(q: np.ndarray) -> np.ndarray:
    """
    Convert quality index to weight (0..1).
    
    Assumes quality is 0-4 or 0-255 scale where lower is better.
    """
    # Normalize to 0..1 (assuming 0-4 scale, or 0-255)
    if q.max() > 10:
        # Likely 0-255 scale
        q_norm = 1.0 - (q / 255.0)
    else:
        # Likely 0-4 scale
        q_norm = 1.0 - (q / 4.0)
    
    return np.clip(q_norm, 0, 1)


def diff_weight(diff: np.ndarray, threshold: float = 20.0) -> np.ndarray:
    """
    Weight based on difference between SDB and base depth.
    
    If difference is large (>threshold), reduce SDB weight.
    """
    # Linear decay: 1.0 at diff=0, 0.0 at diff>=threshold
    weight = np.clip(1.0 - (diff / threshold), 0, 1)
    return weight


def fuse_depths(
    d_emod: np.ndarray,
    d_gebco: np.ndarray,
    d_sdb: np.ndarray,
    q_sdb: np.ndarray,
    clarity: np.ndarray,
    sdb_depth_min: float = 0.0,
    sdb_depth_max: float = 50.0,
    quality_threshold: float = 2.0,
    clarity_threshold: float = 0.3,
    diff_threshold: float = 20.0
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Fuse depth data from multiple sources.
    
    Returns:
        (fused_depth, source_code, confidence)
        - fused_depth: Combined depth in meters (negative)
        - source_code: 1=emodnet, 2=gebco, 3=sdb, 4=blend
        - confidence: 0..1
    """
    height, width = d_gebco.shape
    fused_depth = np.full((height, width), np.nan, dtype=np.float32)
    source_code = np.zeros((height, width), dtype=np.uint8)
    confidence = np.zeros((height, width), dtype=np.float32)
    
    # Base depth: prefer EMODnet, fallback to GEBCO
    d_base = np.where(~np.isnan(d_emod), d_emod, d_gebco)
    
    # Mask: where SDB is valid
    sdb_valid = ~np.isnan(d_sdb)
    
    # SDB depth range check
    d_sdb_abs = np.abs(d_sdb)
    sdb_in_range = (d_sdb_abs >= sdb_depth_min) & (d_sdb_abs <= sdb_depth_max)
    
    # Quality check (assuming quality 0-4 scale, lower is better)
    q_sdb_norm = q_sdb.copy()
    if q_sdb.max() > 10:
        q_sdb_norm = q_sdb / 255.0 * 4.0  # Normalize 0-255 to 0-4
    
    quality_ok = q_sdb_norm <= quality_threshold
    
    # Clarity check
    clarity_ok = clarity >= clarity_threshold
    
    # SDB is OK if all conditions met
    sdb_ok = sdb_valid & sdb_in_range & quality_ok & clarity_ok
    
    # Where SDB is OK and base depth exists, blend
    blend_mask = sdb_ok & ~np.isnan(d_base)
    
    if np.any(blend_mask):
        # Calculate difference
        diff = np.abs(d_sdb[blend_mask] - d_base[blend_mask])
        
        # Calculate weights
        q_weight = quality_weight(q_sdb[blend_mask])
        c_weight = clarity[blend_mask]
        d_weight = diff_weight(diff, diff_threshold)
        
        # Combined weight
        w_sdb = np.clip(0.2 + 0.8 * c_weight, 0, 1) * q_weight * d_weight
        
        # Blend
        fused_depth[blend_mask] = (
            w_sdb * d_sdb[blend_mask] +
            (1 - w_sdb) * d_base[blend_mask]
        )
        source_code[blend_mask] = 4  # blend
        confidence[blend_mask] = w_sdb
    
    # Where SDB is OK but no base depth, use SDB directly
    sdb_only_mask = sdb_ok & np.isnan(d_base)
    if np.any(sdb_only_mask):
        fused_depth[sdb_only_mask] = d_sdb[sdb_only_mask]
        source_code[sdb_only_mask] = 3  # sdb
        confidence[sdb_only_mask] = 0.7  # Moderate confidence for SDB alone
    
    # Where SDB is not OK, use base depth
    base_mask = ~sdb_ok & ~np.isnan(d_base)
    if np.any(base_mask):
        fused_depth[base_mask] = d_base[base_mask]
        # Source: EMODnet if available, else GEBCO
        source_code[base_mask] = np.where(
            ~np.isnan(d_emod[base_mask]),
            1,  # emodnet
            2   # gebco
        )
        confidence[base_mask] = 0.9  # High confidence for base sources
    
    return fused_depth, source_code, confidence


def reproject_to_target(
    src_path: Path,
    target_transform: rasterio.Affine,
    target_crs: str,
    target_shape: tuple[int, int],
    resampling: Resampling = Resampling.bilinear
) -> np.ndarray:
    """Reproject a raster to match target transform and shape."""
    with rasterio.open(src_path) as src:
        # Read first band
        data = src.read(1)
        
        # Reproject
        reprojected, _ = reproject(
            source=data,
            destination=np.empty(target_shape, dtype=data.dtype),
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=target_transform,
            dst_crs=target_crs,
            resampling=resampling
        )
        
        return reprojected


def build_fused_bathymetry(
    emodnet_path: Path,
    gebco_path: Path,
    sdb_path: Path = None,
    clarity_path: Path = None,
    output_path: Path = None
):
    """
    Build fused bathymetry COG.
    """
    print("Building fused bathymetry COG...")
    
    # Load GEBCO as reference (always available)
    print(f"Loading GEBCO: {gebco_path}")
    with rasterio.open(gebco_path) as gebco_ds:
        gebco_data = gebco_ds.read(1)
        target_transform = gebco_ds.transform
        target_crs = gebco_ds.crs
        target_shape = (gebco_ds.height, gebco_ds.width)
        bounds = gebco_ds.bounds
    
    print(f"  Reference grid: {target_shape[1]}x{target_shape[0]}")
    print(f"  Bounds: {bounds}")
    
    # Load EMODnet
    print(f"Loading EMODnet: {emodnet_path}")
    if emodnet_path.exists():
        emodnet_data = reproject_to_target(
            emodnet_path,
            target_transform,
            target_crs,
            target_shape,
            Resampling.bilinear
        )
        # Convert to negative if needed
        if np.nanmean(emodnet_data) > 0:
            emodnet_data = -emodnet_data
    else:
        print("  ⚠ Warning: EMODnet not found, using GEBCO only")
        emodnet_data = np.full(target_shape, np.nan, dtype=np.float32)
    
    # Load SDB (optional)
    if sdb_path and sdb_path.exists():
        print(f"Loading SDB: {sdb_path}")
        with rasterio.open(sdb_path) as sdb_ds:
            sdb_depth = sdb_ds.read(1)  # Band 1: depth
            sdb_quality = sdb_ds.read(2) if sdb_ds.count >= 2 else np.full(sdb_depth.shape, 255, dtype=np.uint8)
        
        # Reproject SDB to target grid
        sdb_depth_reproj = reproject_to_target(
            sdb_path,
            target_transform,
            target_crs,
            target_shape,
            Resampling.bilinear
        )
        
        # Reproject quality (nearest neighbor)
        with rasterio.open(sdb_path) as sdb_ds:
            sdb_quality_reproj = reproject_to_target(
                sdb_path,
                target_transform,
                target_crs,
                target_shape,
                Resampling.nearest
            )
            # Read quality band
            sdb_quality_reproj = sdb_ds.read(2) if sdb_ds.count >= 2 else np.full(target_shape, 255, dtype=np.uint8)
            sdb_quality_reproj, _ = reproject(
                source=sdb_quality,
                destination=np.empty(target_shape, dtype=np.uint8),
                src_transform=sdb_ds.transform,
                src_crs=sdb_ds.crs,
                dst_transform=target_transform,
                dst_crs=target_crs,
                resampling=Resampling.nearest
            )
    else:
        print("  ⚠ Warning: SDB not found, skipping fusion")
        sdb_depth_reproj = np.full(target_shape, np.nan, dtype=np.float32)
        sdb_quality_reproj = np.full(target_shape, 255, dtype=np.uint8)
    
    # Load clarity (optional)
    if clarity_path and clarity_path.exists():
        print(f"Loading clarity: {clarity_path}")
        clarity_data = reproject_to_target(
            clarity_path,
            target_transform,
            target_crs,
            target_shape,
            Resampling.bilinear
        )
    else:
        print("  ⚠ Warning: Clarity mask not found, using default (0.5)")
        clarity_data = np.full(target_shape, 0.5, dtype=np.float32)
    
    # Fuse
    print("Fusing depth data...")
    fused_depth, source_code, confidence = fuse_depths(
        d_emod=emodnet_data,
        d_gebco=gebco_data,
        d_sdb=sdb_depth_reproj,
        q_sdb=sdb_quality_reproj,
        clarity=clarity_data
    )
    
    print(f"  Fused depth range: {np.nanmin(fused_depth):.2f} to {np.nanmax(fused_depth):.2f} m")
    print(f"  Source distribution:")
    print(f"    EMODnet: {np.sum(source_code == 1)} pixels")
    print(f"    GEBCO: {np.sum(source_code == 2)} pixels")
    print(f"    SDB: {np.sum(source_code == 3)} pixels")
    print(f"    Blend: {np.sum(source_code == 4)} pixels")
    
    # Write COG
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Writing COG: {output_path}")
    
    profile = {
        'driver': 'GTiff',
        'height': target_shape[0],
        'width': target_shape[1],
        'count': 3,
        'dtype': 'float32',
        'crs': target_crs,
        'transform': target_transform,
        'compress': 'DEFLATE',
        'tiled': True,
        'blockxsize': 512,
        'blockysize': 512,
        'nodata': np.nan,
    }
    
    with rasterio.open(output_path, 'w', **profile) as dst:
        dst.write(fused_depth.astype(np.float32), 1)
        dst.write(source_code.astype(np.float32), 2)  # Store as float for consistency
        dst.write(confidence.astype(np.float32), 3)
        dst.set_band_description(1, 'fused_depth_m')
        dst.set_band_description(2, 'source_code')
        dst.set_band_description(3, 'confidence')
    
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
        'emodnet_path': str(emodnet_path),
        'gebco_path': str(gebco_path),
        'sdb_path': str(sdb_path) if sdb_path else None,
        'clarity_path': str(clarity_path) if clarity_path else None,
        'output_file': str(output_path),
        'bbox': list(bounds),
        'resolution_approx_m': abs(target_transform[0]) * 111000,
        'build_date': datetime.now().isoformat(),
    }
    
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✓ Fused bathymetry created: {output_path}")
    print(f"✓ Metadata saved: {metadata_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Build fused bathymetry COG"
    )
    parser.add_argument(
        "--emodnet",
        type=Path,
        required=True,
        help="EMODnet COG file path"
    )
    parser.add_argument(
        "--gebco",
        type=Path,
        required=True,
        help="GEBCO COG file path"
    )
    parser.add_argument(
        "--sdb",
        type=Path,
        help="SDB COG file path (optional)"
    )
    parser.add_argument(
        "--clarity",
        type=Path,
        help="Clarity mask COG file path (optional)"
    )
    parser.add_argument(
        "--output",
        type=Path,
        required=True,
        help="Output fused COG file path"
    )
    
    args = parser.parse_args()
    
    if not args.gebco.exists():
        print(f"ERROR: GEBCO file not found: {args.gebco}")
        sys.exit(1)
    
    build_fused_bathymetry(
        emodnet_path=args.emodnet,
        gebco_path=args.gebco,
        sdb_path=args.sdb,
        clarity_path=args.clarity,
        output_path=args.output
    )


if __name__ == "__main__":
    main()

