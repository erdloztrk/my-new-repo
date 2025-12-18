# Bathymetry Backend API

FastAPI service for depth queries and species-based scoring.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

## Configuration

Set environment variables for COG paths:

```bash
# Required: GEBCO (fallback)
export GEBCO_COG_PATH=data/processed/gebco_turkey_cog.tif

# Optional: EMODnet (higher resolution for coastal areas)
export EMODNET_COG_PATH=data/processed/emodnet_turkey_cog.tif

# Optional: SDB (satellite-derived bathymetry for shallow coastal areas)
export SDB_COG_PATH=data/bathymetry/sdb/sdb_TR_cog.tif

# Optional: Clarity mask (improves SDB quality assessment)
export CLARITY_COG_PATH=data/bathymetry/clarity/clarity_TR_cog.tif

# Optional: Fused bathymetry (pre-computed fusion of all sources)
export FUSED_COG_PATH=data/bathymetry/fused/fused_TR_cog.tif

# Optional: Copernicus Marine credentials (for downloading SDB/turbidity)
export COPERNICUSMARINE_SERVICE_USERNAME=your_username
export COPERNICUSMARINE_SERVICE_PASSWORD=your_password
```

Or create `.env` file:

```
GEBCO_COG_PATH=data/processed/gebco_turkey_cog.tif
EMODNET_COG_PATH=data/processed/emodnet_turkey_cog.tif
SDB_COG_PATH=data/bathymetry/sdb/sdb_TR_cog.tif
CLARITY_COG_PATH=data/bathymetry/clarity/clarity_TR_cog.tif
FUSED_COG_PATH=data/bathymetry/fused/fused_TR_cog.tif
COPERNICUSMARINE_SERVICE_USERNAME=your_username
COPERNICUSMARINE_SERVICE_PASSWORD=your_password
```

## Run

```bash
# Development
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check

```bash
GET /health
```

### Get Depth

```bash
GET /v1/depth?lat=40.5&lon=28.5&mode=auto&debug=false
```

Query Parameters:
- `lat` (required): Latitude
- `lon` (required): Longitude
- `mode` (optional): Depth source mode - `auto`, `emodnet`, `gebco`, `sdb`, `fused`, `blend` (default: `auto`)
- `debug` (optional): Include debug information (default: `false`)

Response:
```json
{
  "depth_m": -18.4,
  "source": "GEBCO_2024",
  "resolution_m": 450,
  "source_used": "gebco",
  "confidence": 0.9,
  "sdb_quality": null,
  "clarity": null,
  "not_for_navigation": true,
  "emodnet": {
    "depth_m": -18.2,
    "source": "EMODNET_2024",
    "resolution_m": 115
  },
  "gebco": {
    "depth_m": -18.4,
    "source": "GEBCO_2024",
    "resolution_m": 450
  }
}
```

### Get Contours

```bash
GET /v1/contours?min_lat=40.0&max_lat=41.0&min_lon=28.0&max_lon=29.0&intervals=5,10,15,20&mode=auto&format=points
```

Query Parameters:
- `min_lat`, `max_lat`, `min_lon`, `max_lon` (required): Bounding box
- `intervals` (optional): Comma-separated depth intervals in meters (default: `5,10,15,20,30,50,100`)
- `mode` (optional): Source mode - `auto`, `emodnet`, `gebco`, `sdb`, `fused` (default: `auto`)
- `format` (optional): Output format - `points` (legacy) or `lines` (GeoJSON LineString, requires scikit-image) (default: `points`)
- `downsample` (optional): Downsample factor for performance (default: `1`)
- `max_lines` (optional): Maximum number of contour lines for `lines` format (default: `1000`)

### Get Available Sources

```bash
GET /v1/bathymetry/sources
```

Response:
```json
{
  "sources": {
    "emodnet": {
      "name": "EMODnet",
      "available": true,
      "resolution_m": 115,
      "bbox": [25.0, 40.0, 30.0, 42.0]
    },
    "gebco": {
      "name": "GEBCO",
      "available": true,
      "resolution_m": 450,
      "bbox": [25.0, 40.0, 30.0, 42.0]
    },
    "sdb": {
      "name": "Satellite Derived Bathymetry (SDB)",
      "available": true,
      "resolution_m": 100,
      "bbox": [25.8, 39.6, 27.2, 40.5]
    },
    "clarity": {
      "name": "Clarity Mask",
      "available": true,
      "resolution_m": 100,
      "bbox": [25.8, 39.6, 27.2, 40.5]
    },
    "fused": {
      "name": "Fused Bathymetry",
      "available": true,
      "resolution_m": 100,
      "bbox": [25.0, 40.0, 30.0, 42.0]
    }
  }
}
```

### Get Wind Field

```bash
GET /v1/wind/field?west=28.0&south=40.0&east=29.0&north=41.0&nx=32&ny=32
```

Query Parameters:
- `west` (required): West longitude (WGS84)
- `south` (required): South latitude (WGS84)
- `east` (required): East longitude (WGS84)
- `north` (required): North latitude (WGS84)
- `nx` (optional): Grid resolution in X (longitude) direction (default: 32, max: 128)
- `ny` (optional): Grid resolution in Y (latitude) direction (default: 32, max: 128)

Response:
```json
{
  "bbox": [28.0, 40.0, 29.0, 41.0],
  "nx": 32,
  "ny": 32,
  "u": [0.5, 0.7, ...],
  "v": [-0.3, -0.5, ...],
  "units": "m/s",
  "ts": 1704067200
}
```

Returns wind vector field with u (eastward) and v (northward) components in m/s.
Grid is flattened row-major: first row (west->east), then second row, etc.
Data is fetched from Open-Meteo weather model API and cached for 5 minutes.

### Get Score

```bash
GET /v1/score?lat=40.5&lon=28.5&species=chipura
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

```bash
# Unit tests
pytest backend/tests/test_scoring.py -v

# Integration tests (requires COG file)
pytest backend/tests/test_depth_api.py -v
```

## Architecture Notes

- **Point Query Strategy**: Option 1 (Python microservice with rasterio)
- **Caching**: LRU cache (1000 entries) keyed by rounded coordinates (0.001° ≈ 111m)
- **COG Loading**: Global singleton loaded at startup
- **Future**: Consider PostGIS for production scale, or pre-tile into MBTiles

