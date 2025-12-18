# Bathymetry Data Pipeline

This directory contains scripts to process bathymetry data from multiple sources (GEBCO, EMODnet, and Copernicus Marine SDB) for the fishing app.

## Overview

The pipeline converts bathymetry data into Cloud Optimized GeoTIFF (COG) format, cropped to Turkey's Aegean/Marmara regions for faster queries. It also includes fusion capabilities to combine multiple sources for optimal coastal coverage.

**Data Sources:**
- **EMODnet Bathymetry** (primary): Higher resolution (~115m) for coastal areas, better accuracy near shore
- **GEBCO 2024** (fallback): Global coverage (~450m resolution), used when EMODnet data is unavailable
- **Copernicus Marine SDB** (new): Satellite-derived bathymetry (~100m) for shallow coastal areas (0-50m depth)
- **Clarity Mask** (new): Turbidity/SPM-based clarity score to improve SDB quality assessment
- **Fused Bathymetry** (new): Intelligent fusion of all sources with quality/clarity weighting

The backend automatically uses the best available source based on depth, quality, and clarity metrics.

## Prerequisites

```bash
# Install Python dependencies
pip install rasterio gdal numpy xarray rioxarray scikit-image affine pyproj

# Copernicus Marine Toolbox (for SDB and turbidity data)
pip install copernicusmarine

# Or use conda (recommended for GDAL)
conda install -c conda-forge rasterio gdal xarray rioxarray scikit-image affine pyproj
conda install -c conda-forge copernicusmarine
```

### Copernicus Marine Credentials

You need a Copernicus Marine account to download SDB and turbidity data:

1. Register at https://marine.copernicus.eu/
2. Get your username and password
3. Set environment variables:
```bash
export COPERNICUSMARINE_SERVICE_USERNAME=your_username
export COPERNICUSMARINE_SERVICE_PASSWORD=your_password
```

## Data Sources

### EMODnet Bathymetry (Recommended)
- **URL**: https://downloads.emodnet-bathymetry.eu/v12/F7_2024.tif.zip
- **Tile**: F7 (covers Turkey region: 23.25-33.125°E, 33.75-43.125°N)
- **Resolution**: ~115m (higher resolution for coastal areas)
- **Format**: 32-bit float GeoTIFF
- **Advantage**: Better accuracy in coastal/shallow water areas

### GEBCO 2024 (Fallback)
- **URL**: https://www.gebco.net/data_and_products/gridded_bathymetry_data/
- **Resolution**: ~450m (15 arc-second grid)
- **Format**: GeoTIFF or netCDF
- **Advantage**: Global coverage, reliable for deep water

## Usage

### Quick Start (Recommended)

Process both EMODnet and GEBCO datasets:

```bash
# Download and process both datasets
make process-all
```

This will:
1. Download EMODnet F7 tile
2. Download GEBCO data (if available)
3. Crop both to Turkey region
4. Convert both to COG format

### Individual Steps

#### EMODnet (Higher Resolution for Coastal Areas)

```bash
# 1. Download EMODnet F7 tile
make download-emodnet

# 2. Crop to Turkey region
make crop-emodnet

# 3. Convert to COG
make cog-emodnet

# Or process all at once:
make process-emodnet
```

#### GEBCO (Global Coverage Fallback)

```bash
# 1. Download GEBCO data (manual or via script)
make download

# 2. Crop to Turkey region
make crop

# 3. Convert to COG
make cog

# Or process all at once:
make process-gebco
```

### Manual Processing

#### EMODnet

```bash
# Download
python scripts/bathymetry/download_emodnet.py \
  --output-dir data/raw

# Crop to Turkey region
python scripts/bathymetry/process_emodnet.py \
  --input data/raw/emodnet_f7_2024.tif \
  --output data/processed/emodnet_turkey.tif \
  --bbox 25.0 40.0 30.0 42.0

# Convert to COG
python scripts/bathymetry/create_cog.py \
  --input data/processed/emodnet_turkey.tif \
  --output data/processed/emodnet_turkey_cog.tif
```

#### GEBCO

```bash
# Crop to Turkey region
python scripts/bathymetry/crop_gebco.py \
  --input data/raw/gebco_2024.tif \
  --output data/processed/gebco_turkey.tif \
  --bbox 25.0 42.0 30.0 40.0

# Convert to COG
python scripts/bathymetry/create_cog.py \
  --input data/processed/gebco_turkey.tif \
  --output data/processed/gebco_turkey_cog.tif
```

## Output Structure

```
data/
  raw/
    emodnet_f7_2024.tif     # Original EMODnet F7 tile
    gebco_2024.tif          # Original GEBCO file
  processed/
    emodnet_turkey.tif      # EMODnet cropped to Turkey
    emodnet_turkey_cog.tif  # EMODnet COG (final, ~115m resolution)
    gebco_turkey.tif        # GEBCO cropped to Turkey
    gebco_turkey_cog.tif    # GEBCO COG (final, ~450m resolution)
    metadata.json            # Metadata (bbox, resolution, etc.)
```

## Metadata

The pipeline generates `metadata.json` with:
- Bounding box
- Resolution (meters)
- Data source
- Processing date

## Backend Configuration

The backend automatically uses EMODnet when available, falling back to GEBCO:

```bash
# Set environment variables
export EMODNET_COG_PATH=../data/processed/emodnet_turkey_cog.tif
export GEBCO_COG_PATH=../data/processed/gebco_turkey_cog.tif

# Start backend
cd backend && uvicorn src.main:app --reload
```

The API response includes the data source:
- `source: "EMODNET_2024"` - Higher resolution data used
- `source: "GEBCO_2024"` - Fallback data used

## Copernicus Marine SDB + Turbidity + Fusion

### Step 1: Download SDB Data

```bash
# Download SDB composite for Turkey region
python scripts/bathymetry/download_copernicus_sdb.py \
  --bbox 25.8 39.6 27.2 40.5 \
  --out data/bathymetry/sdb/raw/sdb_comp_TR.nc

# The script will auto-detect variables (depth, quality, source)
# Check the generated metadata JSON for variable names
```

### Step 2: Convert SDB NetCDF to COG

```bash
# Convert to multi-band COG (depth, quality, source)
python scripts/bathymetry/netcdf_to_cog.py \
  --input data/bathymetry/sdb/raw/sdb_comp_TR.nc \
  --depth-var depth \
  --quality-var quality \
  --output data/bathymetry/sdb/sdb_TR_cog.tif
```

### Step 3: Download Turbidity Data

```bash
# Download monthly turbidity for MED region (last 12 months)
python scripts/bathymetry/download_copernicus_turbidity.py \
  --region med \
  --bbox 25.8 39.6 27.2 40.5 \
  --out-dir data/bathymetry/turbidity/raw

# Download for BLK region if needed
python scripts/bathymetry/download_copernicus_turbidity.py \
  --region blk \
  --bbox 25.8 39.6 27.2 40.5 \
  --out-dir data/bathymetry/turbidity/raw
```

### Step 4: Build Clarity Mask

```bash
# Build clarity mask from turbidity climatology
python scripts/bathymetry/build_clarity_mask.py \
  --input-dir data/bathymetry/turbidity/raw \
  --region med \
  --output data/bathymetry/clarity/clarity_TR_cog.tif

# Optional: Set custom turbidity thresholds
python scripts/bathymetry/build_clarity_mask.py \
  --input-dir data/bathymetry/turbidity/raw \
  --region med \
  --tur-low 1.0 \
  --tur-high 10.0 \
  --output data/bathymetry/clarity/clarity_TR_cog.tif
```

### Step 5: Build Fused Bathymetry

```bash
# Combine all sources into fused COG
python scripts/bathymetry/build_fused_bathymetry.py \
  --emodnet data/processed/emodnet_turkey_cog.tif \
  --gebco data/processed/gebco_turkey_cog.tif \
  --sdb data/bathymetry/sdb/sdb_TR_cog.tif \
  --clarity data/bathymetry/clarity/clarity_TR_cog.tif \
  --output data/bathymetry/fused/fused_TR_cog.tif
```

### Step 6: Configure Backend

Set environment variables in `.env` or export:

```bash
# Existing sources
export EMODNET_COG_PATH=/absolute/path/to/data/processed/emodnet_turkey_cog.tif
export GEBCO_COG_PATH=/absolute/path/to/data/processed/gebco_turkey_cog.tif

# New sources
export SDB_COG_PATH=/absolute/path/to/data/bathymetry/sdb/sdb_TR_cog.tif
export CLARITY_COG_PATH=/absolute/path/to/data/bathymetry/clarity/clarity_TR_cog.tif
export FUSED_COG_PATH=/absolute/path/to/data/bathymetry/fused/fused_TR_cog.tif

# Copernicus credentials
export COPERNICUSMARINE_SERVICE_USERNAME=your_username
export COPERNICUSMARINE_SERVICE_PASSWORD=your_password
```

### Step 7: Test Backend

```bash
# Health check (shows which sources are loaded)
curl http://localhost:8000/health

# Get available sources
curl http://localhost:8000/v1/bathymetry/sources

# Test depth query with different modes
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=auto"
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=sdb"
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=fused"
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5&mode=blend&debug=1"

# Test contours with lines format
curl "http://localhost:8000/v1/contours?min_lat=40.0&max_lat=41.0&min_lon=28.0&max_lon=29.0&format=lines&mode=fused"
```

## Output Structure

```
data/
  raw/
    emodnet_f7_2024.tif     # Original EMODnet F7 tile
    gebco_2024.tif          # Original GEBCO file
  processed/
    emodnet_turkey.tif      # EMODnet cropped to Turkey
    emodnet_turkey_cog.tif  # EMODnet COG (final, ~115m resolution)
    gebco_turkey.tif        # GEBCO cropped to Turkey
    gebco_turkey_cog.tif    # GEBCO COG (final, ~450m resolution)
  bathymetry/
    sdb/
      raw/
        sdb_comp_TR.nc      # Copernicus SDB NetCDF
        sdb_comp_TR.json    # Metadata with variable names
      sdb_TR_cog.tif        # SDB COG (3 bands: depth, quality, source)
      sdb_TR_cog.json       # Metadata
    turbidity/
      raw/
        turbidity_med_202301.nc  # Monthly turbidity files
        turbidity_med_202302.nc
        ...
        turbidity_med_metadata.json
    clarity/
      clarity_TR_cog.tif    # Clarity mask COG (0..1 score)
      clarity_TR_cog.json   # Metadata
    fused/
      fused_TR_cog.tif      # Fused bathymetry COG (3 bands: depth, source_code, confidence)
      fused_TR_cog.json     # Metadata
```

## Notes

- **EMODnet** provides better accuracy in coastal/shallow water areas (~115m resolution)
- **GEBCO** provides global coverage with reliable deep water data (~450m resolution)
- **SDB** provides high-resolution satellite-derived bathymetry for shallow coastal areas (~100m, 0-50m depth)
- **Clarity Mask** improves SDB quality assessment using turbidity/SPM data
- **Fused Bathymetry** intelligently combines all sources with quality/clarity weighting
- COG format enables efficient point queries without loading entire raster
- Overviews (pyramids) are built for faster zoom levels
- Compression: DEFLATE (lossless)
- **Important**: All bathymetry data is approximate and NOT for navigation purposes
- For production, consider uploading COG to S3-compatible storage

