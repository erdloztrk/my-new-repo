# Bathymetry Data Pipeline

This directory contains scripts to process bathymetry data (GEBCO and EMODnet) for the fishing app.

## Overview

The pipeline converts bathymetry GeoTIFF files into Cloud Optimized GeoTIFF (COG) format, cropped to Turkey's Aegean/Marmara regions for faster queries.

**Data Sources:**
- **EMODnet Bathymetry** (primary): Higher resolution (~115m) for coastal areas, better accuracy near shore
- **GEBCO 2024** (fallback): Global coverage (~450m resolution), used when EMODnet data is unavailable

The backend automatically uses EMODnet when available, falling back to GEBCO for areas outside EMODnet coverage.

## Prerequisites

```bash
# Install Python dependencies
pip install rasterio gdal numpy

# Or use conda (recommended for GDAL)
conda install -c conda-forge rasterio gdal
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

## Notes

- **EMODnet** provides better accuracy in coastal/shallow water areas (~115m resolution)
- **GEBCO** provides global coverage with reliable deep water data (~450m resolution)
- COG format enables efficient point queries without loading entire raster
- Overviews (pyramids) are built for faster zoom levels
- Compression: DEFLATE (lossless)
- For production, consider uploading COG to S3-compatible storage

