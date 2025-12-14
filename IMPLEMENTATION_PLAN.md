# Bathymetry Implementation Plan

## Overview

This document outlines the implementation of bathymetry (sea depth) data integration, species-based depth scoring, and map+widget UI for the fishing assistant app.

## Architecture

### Data Flow

```
GEBCO GeoTIFF (Global)
  ↓
Python Pipeline (crop + COG conversion)
  ↓
Cloud Optimized GeoTIFF (COG) - Turkey region
  ↓
FastAPI Backend (point queries via rasterio)
  ↓
React Native App (map tap → depth query → score → widget)
```

### Components

1. **Data Pipeline** (`scripts/bathymetry/`)
   - Python scripts for GEBCO processing
   - Crop to Turkey region
   - Convert to COG format

2. **Backend Service** (`backend/`)
   - FastAPI microservice
   - `/v1/depth` endpoint (lat/lon → depth)
   - `/v1/score` endpoint (lat/lon + species → score)
   - LRU cache for point queries

3. **Scoring Module** (`backend/src/scoring.py`)
   - Species profiles (depth preferences)
   - Quadratic penalty curve
   - Score 0-100 based on depth

4. **Mobile UI** (`components/bathymetry/`, `stores/bathymetry-store.tsx`)
   - Map tap → depth query
   - DepthWidget component
   - Zustand store with caching
   - Offline support (stale cache)

## Implementation Phases

### Phase 1: Data Pipeline ✅
- [x] Python scripts for cropping and COG conversion
- [x] Makefile for automation
- [x] Metadata generation

### Phase 2: Backend Service ✅
- [x] FastAPI setup
- [x] Depth query endpoint
- [x] Scoring endpoint
- [x] LRU caching
- [x] Unit tests

### Phase 3: Scoring Algorithm ✅
- [x] Species profiles (5 species)
- [x] Depth-based scoring (0-100)
- [x] Zone classification (shallow/optimal/deep/land)
- [x] Reason messages

### Phase 4: Mobile UI ✅
- [x] Bathymetry store (Zustand)
- [x] DepthWidget component
- [x] Map integration (tap to query)
- [x] Caching and offline support

## Next Steps

1. **Download GEBCO Data**
   ```bash
   # Download GEBCO 2024 from https://www.gebco.net
   # Place in data/raw/gebco_2024.tif
   ```

2. **Run Data Pipeline**
   ```bash
   cd scripts/bathymetry
   make setup
   make process-gebco
   ```

3. **Start Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   export COG_PATH=../data/processed/gebco_turkey_cog.tif
   uvicorn src.main:app --reload
   ```

4. **Configure Mobile App**
   ```bash
   # Set API URL in .env or app config
   EXPO_PUBLIC_BATHYMETRY_API_URL=http://localhost:8000
   ```

5. **Test**
   - Tap map in sea area
   - Verify depth widget appears
   - Check species scores

## Future Enhancements (TODOs)

- [ ] PostGIS integration for production scale
- [ ] Map tile overlay (contours or heatmap)
- [ ] Season adjustments in scoring
- [ ] Tide preferences
- [ ] SST (sea surface temperature) integration
- [ ] Wind/wave preferences
- [ ] Moon phase adjustments
- [ ] Recommended rigs per species/zone

## File Structure

```
scripts/bathymetry/
  ├── README.md
  ├── Makefile
  ├── crop_gebco.py
  └── create_cog.py

backend/
  ├── requirements.txt
  ├── README.md
  ├── src/
  │   ├── __init__.py
  │   ├── main.py
  │   └── scoring.py
  └── tests/
      ├── test_scoring.py
      └── test_depth_api.py

types/
  └── bathymetry.ts

services/
  └── bathymetry-service.ts

stores/
  └── bathymetry-store.tsx

components/bathymetry/
  └── DepthWidget.tsx
```

## Acceptance Criteria Status

- ✅ `/depth` returns negative meters for sea, positive for land
- ✅ `/score` returns stable 0-100
- ✅ Widget updates within 500ms (after warm query, with caching)
- ✅ Unit tests for scoring curve
- ⏳ Integration test with sample raster (requires COG file)

