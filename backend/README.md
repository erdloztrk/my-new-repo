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

Set environment variable for COG path:

```bash
export COG_PATH=data/processed/gebco_turkey_cog.tif
```

Or create `.env` file:

```
COG_PATH=data/processed/gebco_turkey_cog.tif
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
GET /v1/depth?lat=40.5&lon=28.5
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

