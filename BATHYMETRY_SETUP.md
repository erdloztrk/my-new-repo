# Bathymetry System Setup Guide

Complete setup instructions for the bathymetry (sea depth) system.

## Quick Start

### 1. Download GEBCO Data

```bash
# Download GEBCO 2024 from:
# https://www.gebco.net/data_and_products/gridded_bathymetry_data/

# Place the GeoTIFF file in:
mkdir -p data/raw
# Copy gebco_2024.tif to data/raw/
```

### 2. Process Data Pipeline

```bash
# Install Python dependencies
pip install rasterio gdal numpy

# Or use conda (recommended for GDAL)
conda install -c conda-forge rasterio gdal

# Run pipeline
cd scripts/bathymetry
make setup
make process-gebco
```

This will:
- Crop GEBCO to Turkey region (Aegean + Marmara)
- Convert to Cloud Optimized GeoTIFF (COG)
- Generate metadata

Output: `data/processed/gebco_turkey_cog.tif`

### 3. Start Backend Service

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set COG path
export COG_PATH=../data/processed/gebco_turkey_cog.tif

# Run server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

### 4. Configure Mobile App

Create `.env` file in project root:

```bash
EXPO_PUBLIC_BATHYMETRY_API_URL=http://localhost:8000
```

For physical device, use your computer's IP:

```bash
EXPO_PUBLIC_BATHYMETRY_API_URL=http://192.168.1.100:8000
```

### 5. Test

1. Start mobile app: `npm start`
2. Navigate to Map screen
3. Tap on sea area
4. Depth widget should appear with depth and species scores

## API Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

### Get Depth
```bash
curl "http://localhost:8000/v1/depth?lat=40.5&lon=28.5"
```

Response:
```json
{
  "depth_m": -18.4,
  "source": "GEBCO_2024",
  "resolution_m": 450
}
```

### Get Score
```bash
curl "http://localhost:8000/v1/score?lat=40.5&lon=28.5&species=chipura"
```

Response:
```json
{
  "depth_m": -18.4,
  "score_0_100": 95.2,
  "zone_label": "optimal",
  "reasons": [
    {
      "type": "depth",
      "message": "Depth -18.4m is within preferred range (-5m to -30m)."
    },
    {
      "type": "optimal_band",
      "message": "Depth -18.4m is within optimal band (-8m to -20m) for Çipura."
    }
  ],
  "species": "chipura"
}
```

## Species IDs

- `chipura` - Çipura (Gilthead Seabream)
- `levrek` - Levrek (European Seabass)
- `sargoz` - Sargoz (White Seabream)
- `karagoz` - Karagöz (Two-banded Seabream)
- `mirmir` - Mırmır (Sand Steenbras)

## Testing

### Unit Tests (Scoring)
```bash
cd backend
pytest tests/test_scoring.py -v
```

### Integration Tests (Requires COG)
```bash
cd backend
pytest tests/test_depth_api.py -v
```

## Troubleshooting

### Backend: "COG file not found"
- Check `COG_PATH` environment variable
- Verify file exists: `ls -lh data/processed/gebco_turkey_cog.tif`

### Mobile: "Failed to query depth"
- Check backend is running: `curl http://localhost:8000/health`
- Verify API URL in `.env`
- For physical device, ensure phone and computer are on same network

### Data Pipeline: GDAL errors
- Install GDAL via conda: `conda install -c conda-forge gdal`
- Or use system package manager: `brew install gdal` (macOS)

## Architecture Notes

- **Point Query Strategy**: Python microservice with rasterio (Option 1)
- **Caching**: LRU cache (1000 entries) + mobile AsyncStorage
- **COG Format**: Enables efficient point queries without loading entire raster
- **Resolution**: ~450m (15 arc-second GEBCO grid)

## Next Steps (Future)

- [ ] PostGIS integration for production scale
- [ ] Map tile overlay (contours)
- [ ] Season adjustments
- [ ] Tide preferences
- [ ] SST integration
- [ ] Recommended rigs per species

