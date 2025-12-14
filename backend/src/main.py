"""
FastAPI backend service for bathymetry depth queries and species scoring.
"""

import os
from pathlib import Path
from typing import Optional, Dict, Any, List
from functools import lru_cache
import rasterio
import numpy as np
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import scoring module
from .scoring import DepthScorer, get_species_profile

app = FastAPI(
    title="Bathymetry API",
    description="Depth queries and species-based scoring for fishing app",
    version="1.0.0"
)

# CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global COG dataset (loaded once at startup)
_cog_dataset: Optional[rasterio.DatasetReader] = None


def get_cog_path() -> Path:
    """Get path to COG file from environment or default."""
    cog_path = os.getenv("COG_PATH", "data/processed/gebco_turkey_cog.tif")
    return Path(cog_path)


@lru_cache(maxsize=1000)
def query_depth(lat: float, lon: float) -> Optional[float]:
    """
    Query depth at lat/lon from COG.
    Uses LRU cache keyed by rounded coordinates (0.001° ≈ 111m).
    
    Returns:
        Depth in meters (negative for below sea level, positive for land)
        None if out of bounds
    """
    global _cog_dataset
    
    if _cog_dataset is None:
        cog_path = get_cog_path()
        if not cog_path.exists():
            raise RuntimeError(f"COG file not found: {cog_path}")
        _cog_dataset = rasterio.open(cog_path)
    
    try:
        # Sample at point (returns array)
        values = list(_cog_dataset.sample([(lon, lat)]))
        if not values:
            return None
        depth = float(values[0])
        return depth
    except Exception as e:
        # Out of bounds or other error
        return None


@app.on_event("startup")
async def startup():
    """Load COG dataset on startup."""
    global _cog_dataset
    cog_path = get_cog_path()
    if cog_path.exists():
        _cog_dataset = rasterio.open(cog_path)
        print(f"✓ Loaded COG: {cog_path}")
    else:
        print(f"⚠ Warning: COG file not found: {cog_path}")


@app.on_event("shutdown")
async def shutdown():
    """Close COG dataset on shutdown."""
    global _cog_dataset
    if _cog_dataset:
        _cog_dataset.close()


# Response models
class DepthResponse(BaseModel):
    depth_m: float
    source: str = "GEBCO_2024"
    resolution_m: int = 450


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
    return {"status": "ok", "cog_loaded": _cog_dataset is not None}


@app.get("/v1/depth", response_model=DepthResponse)
async def get_depth(
    lat: float = Query(..., description="Latitude (WGS84)"),
    lon: float = Query(..., description="Longitude (WGS84)")
):
    """
    Query depth at lat/lon.
    
    Returns:
        Depth in meters (negative = below sea level, positive = land/above sea)
    """
    # Round coordinates for cache key (0.001° ≈ 111m)
    lat_rounded = round(lat, 3)
    lon_rounded = round(lon, 3)
    
    depth = query_depth(lat_rounded, lon_rounded)
    
    if depth is None:
        raise HTTPException(
            status_code=404,
            detail="Point out of bounds or no data available"
        )
    
    return DepthResponse(
        depth_m=depth,
        source="GEBCO_2024",
        resolution_m=450
    )


@app.post("/v1/score", response_model=ScoreResponse)
async def get_score(request: ScoreRequest):
    """
    Get comprehensive score for a species at lat/lon with weather and time factors.
    
    Returns:
        Depth, combined score (0-100), zone label, reasons, and component scores
    """
    # Get depth
    lat_rounded = round(request.lat, 3)
    lon_rounded = round(request.lon, 3)
    depth = query_depth(lat_rounded, lon_rounded)
    
    if depth is None:
        raise HTTPException(
            status_code=404,
            detail="Point out of bounds or no data available"
        )
    
    # Get species profile
    profile = get_species_profile(request.species)
    if not profile:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown species: {request.species}. Available: chipura, levrek, sargoz, karagoz, mirmir"
        )
    
    # Prepare weather data dict
    weather_dict = None
    if request.weather:
        weather_dict = {
            "seaTemperature": request.weather.seaTemperature,
            "windSpeed": request.weather.windSpeed,
            "waveHeight": request.weather.waveHeight,
            "pressure": request.weather.pressure,
            "uvi": request.weather.uvi,
        }
    
    # Score with weather and time
    scorer = DepthScorer(profile)
    result = scorer.score(depth, weather=weather_dict, current_time=request.current_time)
    
    return ScoreResponse(
        depth_m=depth,
        score_0_100=result.score,
        zone_label=result.zone,
        reasons=[
            ScoreReason(type=r.type, message=r.message)
            for r in result.reasons
        ],
        species=request.species,
        depth_score=result.depth_score,
        weather_score=result.weather_score,
        time_score=result.time_score
    )


# Keep GET endpoint for backward compatibility (depth-only scoring)
@app.get("/v1/score", response_model=ScoreResponse)
async def get_score_get(
    lat: float = Query(..., description="Latitude (WGS84)"),
    lon: float = Query(..., description="Longitude (WGS84)"),
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
    depth = query_depth(lat_rounded, lon_rounded)
    
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


class ContourResponse(BaseModel):
    contours: List[Dict[str, Any]]  # [{interval: float, coordinates: [[lat, lon], ...]}]


@app.get("/v1/contours", response_model=ContourResponse)
async def get_contours(
    min_lat: float = Query(..., description="Minimum latitude (south)"),
    max_lat: float = Query(..., description="Maximum latitude (north)"),
    min_lon: float = Query(..., description="Minimum longitude (west)"),
    max_lon: float = Query(..., description="Maximum longitude (east)"),
    intervals: str = Query("5,10,15,20,30,50,100", description="Comma-separated depth intervals in meters")
):
    """
    Get depth contour lines for a bounding box.
    
    Returns:
        Contour lines for each specified depth interval
    """
    global _cog_dataset
    
    if _cog_dataset is None:
        raise HTTPException(
            status_code=503,
            detail="COG dataset not loaded"
        )
    
    try:
        # Parse intervals
        depth_intervals = [float(x.strip()) for x in intervals.split(",")]
        depth_intervals = sorted(set(depth_intervals))  # Remove duplicates and sort
        
        # Get bounding box
        bbox = (min_lon, min_lat, max_lon, max_lat)
        
        # Read data window from COG
        window = rasterio.windows.from_bounds(*bbox, _cog_dataset.transform)
        window = window.intersection(rasterio.windows.Window(0, 0, _cog_dataset.width, _cog_dataset.height))
        
        if window.width == 0 or window.height == 0:
            raise HTTPException(
                status_code=400,
                detail="Bounding box is outside dataset bounds"
            )
        
        # Read depth data
        data = _cog_dataset.read(1, window=window)
        transform = rasterio.windows.transform(window, _cog_dataset.transform)
        
        # Convert to positive depths for contour calculation (we want negative values as positive)
        depth_data = -data  # Negative depths become positive
        
        # Calculate contours for each interval
        contours_result = []
        
        for interval in depth_intervals:
            # Find contour at this depth level
            # Using simple thresholding and edge detection
            mask = (depth_data >= interval - 0.5) & (depth_data < interval + 0.5)
            
            if not np.any(mask):
                continue  # No contour at this level
            
            # Get coordinates of contour points
            # Convert pixel coordinates to lat/lon
            rows, cols = np.where(mask)
            
            if len(rows) == 0:
                continue
            
            # Sample points (reduce density for performance)
            step = max(1, len(rows) // 500)  # Max 500 points per contour
            sampled_rows = rows[::step]
            sampled_cols = cols[::step]
            
            # Convert to lat/lon
            coordinates = []
            for row, col in zip(sampled_rows, sampled_cols):
                lon, lat = rasterio.transform.xy(transform, row, col)
                coordinates.append([lat, lon])  # Note: lat, lon order for frontend
            
            if len(coordinates) > 0:
                contours_result.append({
                    "interval": interval,
                    "coordinates": coordinates
                })
        
        return ContourResponse(contours=contours_result)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating contours: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

