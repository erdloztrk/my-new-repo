"""
FastAPI backend service for bathymetry depth queries and species scoring.
"""

import os
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from functools import lru_cache
import rasterio
import numpy as np
from fastapi import FastAPI, HTTPException, Query, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import requests
import time
from datetime import datetime

# Load environment variables from .env file if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv not installed, skip
    pass

# Import scoring module
from .scoring import DepthScorer, get_species_profile

app = FastAPI(
    title="Bathymetry API",
    description="Depth queries and species-based scoring for fishing app",
    version="1.0.0"
)

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration - environment-based allowlist
def get_cors_origins() -> list[str]:
    """
    Get allowed CORS origins from environment.
    Defaults to localhost/Expo dev URLs for development.
    Supports LAN IP via LAN_IP environment variable for physical devices.
    """
    env = os.getenv("ENVIRONMENT", "development").lower()
    cors_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
    
    if cors_env:
        # Parse comma-separated list from env
        return [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    
    if env == "production":
        # Production: require explicit CORS_ALLOWED_ORIGINS
        # Fallback to empty list (no CORS) if not set
        return []
    
    # Development defaults: localhost + common Expo dev URLs
    dev_origins = [
        "http://localhost:8081",
        "http://localhost:19000",
        "http://localhost:19006",
        "exp://localhost:8081",
        "exp://127.0.0.1:8081",
    ]
    
    # Add LAN IP if set (for physical devices on same network)
    lan_ip = os.getenv("LAN_IP", "").strip()
    if lan_ip:
        # Validate IP format (basic check)
        if lan_ip.replace(".", "").isdigit() and len(lan_ip.split(".")) == 4:
            dev_origins.extend([
                f"http://{lan_ip}:8081",
                f"http://{lan_ip}:19000",
                f"http://{lan_ip}:19006",
                f"exp://{lan_ip}:8081",
            ])
    
    return dev_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Global COG datasets (loaded once at startup)
# EMODnet has higher resolution for coastal areas, GEBCO is fallback
_emodnet_dataset: Optional[rasterio.DatasetReader] = None
_gebco_dataset: Optional[rasterio.DatasetReader] = None


def get_emodnet_cog_path() -> Optional[Path]:
    """Get path to EMODnet COG file from environment or default."""
    emodnet_path = os.getenv("EMODNET_COG_PATH", "../data/processed/emodnet_turkey_cog.tif")
    path = Path(emodnet_path)
    return path if path.exists() else None


def get_gebco_cog_path() -> Path:
    """Get path to GEBCO COG file from environment or default."""
    gebco_path = os.getenv("GEBCO_COG_PATH", os.getenv("COG_PATH", "../data/processed/gebco_turkey_cog.tif"))
    return Path(gebco_path)




@lru_cache(maxsize=1000)
def query_depth_single(lat: float, lon: float, source: str) -> Optional[float]:
    """
    Query depth from a single dataset.
    
    Args:
        lat: Latitude
        lon: Longitude
        source: "EMODNET" or "GEBCO"
    
    Returns:
        Depth in meters (negative for below sea level, positive for land)
        None if out of bounds or dataset not available
    """
    global _emodnet_dataset, _gebco_dataset
    
    if source == "EMODNET":
        dataset = _emodnet_dataset
    elif source == "GEBCO":
        dataset = _gebco_dataset
    else:
        return None
    
    if dataset is None:
        return None
    
    try:
        values = list(dataset.sample([(lon, lat)]))
        if values and not np.isnan(values[0]):
            depth = float(values[0])
            # EMODnet uses positive values for depth, convert to negative
            if source == "EMODNET" and depth > 0:
                depth = -depth
            return depth
    except Exception:
        pass
    
    return None




@lru_cache(maxsize=1000)
def query_depth(lat: float, lon: float) -> Tuple[Optional[float], str]:
    """
    Query depth at lat/lon from datasets.
    Tries EMODnet first (higher resolution for coastal areas), then falls back to GEBCO.
    Uses LRU cache keyed by rounded coordinates (0.001° ≈ 111m).
    
    Returns:
        Tuple of (depth in meters, source name)
        Depth: negative for below sea level, positive for land
        Source: "EMODNET_2024" or "GEBCO_2024"
        Returns (None, None) if out of bounds
    """
    # Try EMODnet first
    emodnet_depth = query_depth_single(lat, lon, "EMODNET")
    if emodnet_depth is not None:
        return emodnet_depth, "EMODNET_2024"
    
    # Fallback to GEBCO
    gebco_depth = query_depth_single(lat, lon, "GEBCO")
    if gebco_depth is not None:
        return gebco_depth, "GEBCO_2024"
    
    return None, None


@lru_cache(maxsize=1000)
def query_depth_both(lat: float, lon: float) -> Tuple[Optional[float], Optional[float]]:
    """
    Query depth from both EMODnet and GEBCO datasets.
    
    Returns:
        Tuple of (emodnet_depth, gebco_depth)
        Each depth is negative for below sea level, positive for land
        None if dataset not available or out of bounds
    """
    emodnet_depth = query_depth_single(lat, lon, "EMODNET")
    gebco_depth = query_depth_single(lat, lon, "GEBCO")
    return emodnet_depth, gebco_depth


@app.on_event("startup")
async def startup():
    """Load COG datasets on startup."""
    global _emodnet_dataset, _gebco_dataset
    
    # Load EMODnet (optional, higher resolution for coastal areas)
    emodnet_path = get_emodnet_cog_path()
    if emodnet_path:
        try:
            _emodnet_dataset = rasterio.open(emodnet_path)
            print(f"✓ Loaded EMODnet COG: {emodnet_path}")
        except Exception as e:
            print(f"⚠ Warning: Failed to load EMODnet COG: {e}")
    else:
        print("ℹ EMODnet COG not found (optional, using GEBCO only)")
    
    # Load GEBCO (required fallback)
    gebco_path = get_gebco_cog_path()
    if gebco_path.exists():
        try:
            _gebco_dataset = rasterio.open(gebco_path)
            print(f"✓ Loaded GEBCO COG: {gebco_path}")
        except Exception as e:
            print(f"⚠ Warning: Failed to load GEBCO COG: {e}")
    else:
        print(f"⚠ Warning: GEBCO COG file not found: {gebco_path}")
    
    
    if _emodnet_dataset is None and _gebco_dataset is None:
        print("✗ ERROR: No bathymetry datasets loaded!")


@app.on_event("shutdown")
async def shutdown():
    """Close COG datasets on shutdown."""
    global _emodnet_dataset, _gebco_dataset
    if _emodnet_dataset:
        _emodnet_dataset.close()
    if _gebco_dataset:
        _gebco_dataset.close()


# Response models
class DepthDataPoint(BaseModel):
    depth_m: float
    source: str  # "EMODNET_2024" or "GEBCO_2024"
    resolution_m: int  # Approximate resolution in meters


class DepthResponse(BaseModel):
    depth_m: float  # Primary depth
    source: str = "GEBCO_2024"  # Primary source
    resolution_m: int = 450  # Primary resolution in meters
    source_used: Optional[str] = None  # "emodnet", "gebco"
    confidence: Optional[float] = None  # 0..1
    emodnet: Optional[DepthDataPoint] = None  # EMODnet data if available
    gebco: Optional[DepthDataPoint] = None  # GEBCO data if available
    not_for_navigation: bool = True  # Safety warning


class ScoreReason(BaseModel):
    type: str  # "depth", "optimal_band", "penalty", etc.
    message: str


class WeatherData(BaseModel):
    seaTemperature: Optional[float] = None
    windSpeed: Optional[float] = None
    waveHeight: Optional[float] = None
    pressure: Optional[float] = None
    uvi: Optional[float] = None


class ScoreRequest(BaseModel):
    lat: float
    lon: float
    species: str
    weather: Optional[WeatherData] = None
    current_time: Optional[int] = None  # Unix timestamp


class ScoreResponse(BaseModel):
    depth_m: float
    score_0_100: float
    zone_label: str  # "shallow", "optimal", "deep", "land"
    reasons: list[ScoreReason]
    species: str
    depth_score: Optional[float] = None
    weather_score: Optional[float] = None
    time_score: Optional[float] = None


# Endpoints
@app.get("/health")
async def health():
    """Health check."""
    return {
        "status": "ok",
        "emodnet_loaded": _emodnet_dataset is not None,
        "gebco_loaded": _gebco_dataset is not None
    }




@app.get("/v1/depth", response_model=DepthResponse)
@limiter.limit("100/minute")
async def get_depth(
    request: Request,
    lat: float = Query(..., ge=-90, le=90, description="Latitude (WGS84)"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude (WGS84)"),
    mode: str = Query("auto", description="Depth source mode: auto, emodnet, gebco"),
    debug: bool = Query(False, description="Include debug information")
):
    """
    Query depth at lat/lon from available datasets.
    
    Modes:
    - auto: Default behavior (EMODnet > GEBCO)
    - emodnet: Force EMODnet only
    - gebco: Force GEBCO only
    
    Returns:
        Depth data with source information and quality metrics.
        Depth in meters (negative = below sea level, positive = land/above sea)
    """
    # Validate mode parameter
    valid_modes = ["auto", "emodnet", "gebco"]
    if mode not in valid_modes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mode '{mode}'. Must be one of: {', '.join(valid_modes)}"
        )
    
    # Round coordinates for cache key (0.001° ≈ 111m)
    lat_rounded = round(lat, 3)
    lon_rounded = round(lon, 3)
    
    response_data: Dict[str, Any] = {
        "not_for_navigation": True
    }
    
    # Handle different modes
    if mode == "emodnet":
        # Force EMODnet
        emodnet_depth = query_depth_single(lat_rounded, lon_rounded, "EMODNET")
        if emodnet_depth is None:
            raise HTTPException(status_code=404, detail="EMODnet data not available at this point")
        response_data.update({
            "depth_m": emodnet_depth,
            "source": "EMODNET_2024",
            "resolution_m": 115,
            "source_used": "emodnet",
            "confidence": 0.9,
        })
        return DepthResponse(**response_data)
    
    elif mode == "gebco":
        # Force GEBCO
        gebco_depth = query_depth_single(lat_rounded, lon_rounded, "GEBCO")
        if gebco_depth is None:
            raise HTTPException(status_code=404, detail="GEBCO data not available at this point")
        response_data.update({
            "depth_m": gebco_depth,
            "source": "GEBCO_2024",
            "resolution_m": 450,
            "source_used": "gebco",
            "confidence": 0.9,
        })
        return DepthResponse(**response_data)
    
    else:
        # Default: auto mode (EMODnet > GEBCO)
        emodnet_depth, gebco_depth = query_depth_both(lat_rounded, lon_rounded)
        primary_depth = emodnet_depth if emodnet_depth is not None else gebco_depth
        primary_source = "EMODNET_2024" if emodnet_depth is not None else "GEBCO_2024"
        
        if primary_depth is None:
            raise HTTPException(status_code=404, detail="Point out of bounds or no data available")
        
        response_data.update({
            "depth_m": primary_depth,
            "source": primary_source,
            "resolution_m": 115 if primary_source == "EMODNET_2024" else 450,
            "source_used": "emodnet" if emodnet_depth is not None else "gebco",
            "confidence": 0.9,
        })
        
        if emodnet_depth is not None:
            response_data["emodnet"] = DepthDataPoint(
                depth_m=emodnet_depth, source="EMODNET_2024", resolution_m=115
            )
        if gebco_depth is not None:
            response_data["gebco"] = DepthDataPoint(
                depth_m=gebco_depth, source="GEBCO_2024", resolution_m=450
            )
        
        return DepthResponse(**response_data)


@app.post("/v1/score", response_model=ScoreResponse)
@limiter.limit("50/minute")
async def get_score(request: Request, score_request: ScoreRequest):
    """
    Get comprehensive score for a species at lat/lon with weather and time factors.
    
    Returns:
        Depth, combined score (0-100), zone label, reasons, and component scores
    """
    # Validate lat/lon ranges
    if not (-90 <= score_request.lat <= 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if not (-180 <= score_request.lon <= 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
    
    # Get depth
    lat_rounded = round(score_request.lat, 3)
    lon_rounded = round(score_request.lon, 3)
    depth, _ = query_depth(lat_rounded, lon_rounded)
    
    if depth is None:
        raise HTTPException(
            status_code=404,
            detail="Point out of bounds or no data available"
        )
    
    # Get species profile
    profile = get_species_profile(score_request.species)
    if not profile:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown species: {score_request.species}. Available: chipura, levrek, sargoz, karagoz, mirmir"
        )
    
    # Prepare weather data dict
    weather_dict = None
    if score_request.weather:
        weather_dict = {
            "seaTemperature": score_request.weather.seaTemperature,
            "windSpeed": score_request.weather.windSpeed,
            "waveHeight": score_request.weather.waveHeight,
            "pressure": score_request.weather.pressure,
            "uvi": score_request.weather.uvi,
        }
    
    # Score with weather and time
    scorer = DepthScorer(profile)
    result = scorer.score(depth, weather=weather_dict, current_time=score_request.current_time)
    
    return ScoreResponse(
        depth_m=depth,
        score_0_100=result.score,
        zone_label=result.zone,
        reasons=[
            ScoreReason(type=r.type, message=r.message)
            for r in result.reasons
        ],
        species=score_request.species,
        depth_score=result.depth_score,
        weather_score=result.weather_score,
        time_score=result.time_score
    )


# Keep GET endpoint for backward compatibility (depth-only scoring)
@app.get("/v1/score", response_model=ScoreResponse)
@limiter.limit("50/minute")
async def get_score_get(
    request: Request,
    lat: float = Query(..., ge=-90, le=90, description="Latitude (WGS84)"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude (WGS84)"),
    species: str = Query(..., description="Species ID (e.g., 'chipura', 'levrek', 'sargoz')")
):
    """
    Get depth-based score for a species at lat/lon (legacy endpoint, depth-only).
    
    Returns:
        Depth, score (0-100), zone label, and reasons
    """
    # Get depth
    lat_rounded = round(lat, 3)
    lon_rounded = round(lon, 3)
    depth, _ = query_depth(lat_rounded, lon_rounded)
    
    if depth is None:
        raise HTTPException(
            status_code=404,
            detail="Point out of bounds or no data available"
        )
    
    # Get species profile
    profile = get_species_profile(species)
    if not profile:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown species: {species}. Available: chipura, levrek, sargoz, karagoz, mirmir"
        )
    
    # Score (depth only)
    scorer = DepthScorer(profile)
    result = scorer.score(depth)
    
    return ScoreResponse(
        depth_m=depth,
        score_0_100=result.score,
        zone_label=result.zone,
        reasons=[
            ScoreReason(type=r.type, message=r.message)
            for r in result.reasons
        ],
        species=species,
        depth_score=result.depth_score,
        weather_score=result.weather_score,
        time_score=result.time_score
    )


class BathymetrySourceInfo(BaseModel):
    name: str
    available: bool
    resolution_m: Optional[int] = None
    bbox: Optional[List[float]] = None  # [min_lon, min_lat, max_lon, max_lat]


class SourcesResponse(BaseModel):
    sources: Dict[str, BathymetrySourceInfo]


class WindFieldResponse(BaseModel):
    bbox: List[float]  # [west, south, east, north]
    nx: int
    ny: int
    u: List[float]  # Eastward wind component (m/s), flattened array of size nx*ny
    v: List[float]  # Northward wind component (m/s), flattened array of size nx*ny
    units: str = "m/s"
    ts: int  # Unix timestamp


# Wind field cache: keyed by (west, south, east, north, nx, ny, time_bucket)
_wind_field_cache: Dict[str, Tuple[WindFieldResponse, float]] = {}
_cache_ttl = 300  # 5 minutes


def _get_time_bucket() -> int:
    """Get time bucket (hour) for caching."""
    return int(time.time() // 3600)


def _generate_wind_field_from_openmeteo(
    west: float, south: float, east: float, north: float, nx: int, ny: int
) -> WindFieldResponse:
    """
    Fetch wind u/v components from Open-Meteo weather model API.
    Falls back to generating synthetic grid from single point if API fails.
    """
    try:
        # Open-Meteo weather model API (free, no API key needed)
        # Uses ECMWF IFS model for wind data
        url = "https://api.open-meteo.com/v1/forecast"
        
        # Calculate grid points
        lons = np.linspace(west, east, nx)
        lats = np.linspace(south, north, ny)
        
        # Open-Meteo has a limit on number of points, so we'll sample a subset
        # and interpolate. For large grids, sample every Nth point.
        max_points = 100  # Open-Meteo limit
        if nx * ny > max_points:
            # Sample subset
            lon_step = max(1, nx // int(np.sqrt(max_points)))
            lat_step = max(1, ny // int(np.sqrt(max_points)))
            sample_lons = lons[::lon_step]
            sample_lats = lats[::lat_step]
        else:
            sample_lons = lons
            sample_lats = lats
        
        # Fetch wind data for sampled points
        u_grid = np.zeros((ny, nx))
        v_grid = np.zeros((ny, nx))
        
        # Fetch data point by point (Open-Meteo supports multiple points in one call)
        all_points = []
        for lat in sample_lats:
            for lon in sample_lons:
                all_points.append(f"{lat},{lon}")
        
        # Batch requests (Open-Meteo supports up to ~100 points)
        batch_size = 50
        u_samples = []
        v_samples = []
        sample_coords = []
        
        for i in range(0, len(all_points), batch_size):
            batch = all_points[i:i + batch_size]
            # Use first point in batch as representative
            lat, lon = map(float, batch[0].split(","))
            
            params = {
                "latitude": lat,
                "longitude": lon,
                "hourly": "wind_speed_10m,wind_direction_10m",
                "forecast_days": 1,
            }
            
            response = requests.get(url, params=params, timeout=5)
            if response.ok:
                data = response.json()
                if "hourly" in data and len(data["hourly"]["wind_speed_10m"]) > 0:
                    # Get current hour's data
                    speed = data["hourly"]["wind_speed_10m"][0] or 0.0
                    direction = data["hourly"]["wind_direction_10m"][0] or 0.0
                    
                    # Convert speed/direction to u/v components
                    # direction: 0° = North, clockwise
                    # u: positive = eastward, v: positive = northward
                    direction_rad = np.deg2rad(direction)
                    u_val = -speed * np.sin(direction_rad)  # Eastward
                    v_val = -speed * np.cos(direction_rad)  # Northward
                    
                    u_samples.append(u_val)
                    v_samples.append(v_val)
                    sample_coords.append((lat, lon))
        
        # If we got samples, interpolate to full grid using simple bilinear approach
        if len(u_samples) > 0:
            sample_lats_arr = np.array([c[0] for c in sample_coords])
            sample_lons_arr = np.array([c[1] for c in sample_coords])
            u_samples_arr = np.array(u_samples)
            v_samples_arr = np.array(v_samples)
            
            # Create full grid
            lon_grid, lat_grid = np.meshgrid(lons, lats)
            
            # Simple nearest-neighbor interpolation (can be improved with bilinear)
            for i in range(ny):
                for j in range(nx):
                    lat_val = lat_grid[i, j]
                    lon_val = lon_grid[i, j]
                    
                    # Find closest sample point
                    distances = np.sqrt(
                        (sample_lats_arr - lat_val) ** 2 + (sample_lons_arr - lon_val) ** 2
                    )
                    closest_idx = np.argmin(distances)
                    
                    u_grid[i, j] = u_samples_arr[closest_idx]
                    v_grid[i, j] = v_samples_arr[closest_idx]
        else:
            # Fallback: generate uniform field from center point
            center_lat = (south + north) / 2
            center_lon = (west + east) / 2
            params = {
                "latitude": center_lat,
                "longitude": center_lon,
                "hourly": "wind_speed_10m,wind_direction_10m",
                "forecast_days": 1,
            }
            response = requests.get(url, params=params, timeout=5)
            if response.ok:
                data = response.json()
                if "hourly" in data and len(data["hourly"]["wind_speed_10m"]) > 0:
                    speed = data["hourly"]["wind_speed_10m"][0] or 0.0
                    direction = data["hourly"]["wind_direction_10m"][0] or 0.0
                    direction_rad = np.deg2rad(direction)
                    u_val = -speed * np.sin(direction_rad)
                    v_val = -speed * np.cos(direction_rad)
                    u_grid.fill(u_val)
                    v_grid.fill(v_val)
        
        # Flatten arrays (row-major: first row, then second row, etc.)
        u_flat = u_grid.flatten().tolist()
        v_flat = v_grid.flatten().tolist()
        
        return WindFieldResponse(
            bbox=[west, south, east, north],
            nx=nx,
            ny=ny,
            u=u_flat,
            v=v_flat,
            units="m/s",
            ts=int(time.time())
        )
    except Exception as e:
        # Fallback: return zero field
        print(f"Warning: Failed to fetch wind field from Open-Meteo: {e}")
        u_flat = [0.0] * (nx * ny)
        v_flat = [0.0] * (nx * ny)
        return WindFieldResponse(
            bbox=[west, south, east, north],
            nx=nx,
            ny=ny,
            u=u_flat,
            v=v_flat,
            units="m/s",
            ts=int(time.time())
        )


@app.get("/v1/wind/field", response_model=WindFieldResponse)
@limiter.limit("20/minute")
async def get_wind_field(
    request: Request,
    west: float = Query(..., ge=-180, le=180, description="West longitude (WGS84)"),
    south: float = Query(..., ge=-90, le=90, description="South latitude (WGS84)"),
    east: float = Query(..., ge=-180, le=180, description="East longitude (WGS84)"),
    north: float = Query(..., ge=-90, le=90, description="North latitude (WGS84)"),
    nx: int = Query(32, ge=2, le=128, description="Grid resolution in X (longitude) direction"),
    ny: int = Query(32, ge=2, le=128, description="Grid resolution in Y (latitude) direction"),
):
    """
    Get wind vector field (u/v components) for a bounding box.
    
    Returns:
        Wind field with u (eastward) and v (northward) components in m/s.
        Grid is flattened row-major: first row (west->east), then second row, etc.
    """
    # Validate bbox
    if west >= east:
        raise HTTPException(status_code=400, detail="Invalid bbox: west must be less than east")
    if south >= north:
        raise HTTPException(status_code=400, detail="Invalid bbox: south must be less than north")
    
    # Check cache
    cache_key = f"{west:.3f},{south:.3f},{east:.3f},{north:.3f},{nx},{ny},{_get_time_bucket()}"
    if cache_key in _wind_field_cache:
        cached_response, cached_time = _wind_field_cache[cache_key]
        if time.time() - cached_time < _cache_ttl:
            return cached_response
    
    # Generate wind field
    wind_field = _generate_wind_field_from_openmeteo(west, south, east, north, nx, ny)
    
    # Cache it
    _wind_field_cache[cache_key] = (wind_field, time.time())
    
    # Clean old cache entries (keep last 100)
    if len(_wind_field_cache) > 100:
        oldest_key = min(_wind_field_cache.keys(), key=lambda k: _wind_field_cache[k][1])
        del _wind_field_cache[oldest_key]
    
    return wind_field


@app.get("/v1/bathymetry/sources", response_model=SourcesResponse)
async def get_sources():
    """
    Get information about available bathymetry sources.
    
    Returns:
        Dictionary of source names and their availability/bbox/resolution info
    """
    global _emodnet_dataset, _gebco_dataset
    
    sources = {}
    
    # EMODnet
    sources["emodnet"] = BathymetrySourceInfo(
        name="EMODnet",
        available=_emodnet_dataset is not None,
        resolution_m=115 if _emodnet_dataset else None,
        bbox=list(_emodnet_dataset.bounds) if _emodnet_dataset else None
    )
    
    # GEBCO
    sources["gebco"] = BathymetrySourceInfo(
        name="GEBCO",
        available=_gebco_dataset is not None,
        resolution_m=450 if _gebco_dataset else None,
        bbox=list(_gebco_dataset.bounds) if _gebco_dataset else None
    )
    
    return SourcesResponse(sources=sources)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
