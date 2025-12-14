"""
FastAPI backend service for bathymetry depth queries and species scoring.
"""

import os
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from functools import lru_cache
import rasterio
import numpy as np
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import scoring module
from .scoring import DepthScorer, get_species_profile
# Import Copernicus client
from .copernicus_client import query_copernicus_depth, COPERNICUS_RESOLUTION_M

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
    
    dataset = _emodnet_dataset if source == "EMODNET" else _gebco_dataset
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
def query_depth_both(lat: float, lon: float) -> Tuple[Optional[float], Optional[float], Optional[float]]:
    """
    Query depth from EMODnet and GEBCO datasets.
    Copernicus is disabled due to slow WMTS service performance.
    
    Returns:
        Tuple of (emodnet_depth, gebco_depth, copernicus_depth)
        copernicus_depth is always None (disabled)
        Each depth is negative for below sea level, positive for land
        None if dataset not available or out of bounds
    """
    emodnet_depth = query_depth_single(lat, lon, "EMODNET")
    gebco_depth = query_depth_single(lat, lon, "GEBCO")
    
    # Copernicus disabled - WMTS service is too slow
    copernicus_depth = None
    
    return emodnet_depth, gebco_depth, copernicus_depth


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
    source: str  # "EMODNET_2024", "GEBCO_2024", or "COPERNICUS_2024"
    resolution_m: int  # Approximate resolution in meters


class DepthResponse(BaseModel):
    depth_m: float  # Primary depth (EMODnet > Copernicus > GEBCO priority)
    source: str = "GEBCO_2024"  # Primary source: "EMODNET_2024", "COPERNICUS_2024", or "GEBCO_2024"
    resolution_m: int = 450  # Primary resolution in meters
    emodnet: Optional[DepthDataPoint] = None  # EMODnet data if available
    gebco: Optional[DepthDataPoint] = None  # GEBCO data if available
    copernicus: Optional[DepthDataPoint] = None  # Copernicus data if available


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
async def get_depth(
    lat: float = Query(..., description="Latitude (WGS84)"),
    lon: float = Query(..., description="Longitude (WGS84)")
):
    """
    Query depth at lat/lon from EMODnet, GEBCO, and Copernicus datasets.
    
    Returns:
        Depth data from all available sources, with primary depth priority:
        EMODnet > Copernicus > GEBCO (based on resolution/quality)
        Depth in meters (negative = below sea level, positive = land/above sea)
    """
    # Round coordinates for cache key (0.001° ≈ 111m)
    lat_rounded = round(lat, 3)
    lon_rounded = round(lon, 3)
    
    # Query all three datasets
    emodnet_depth, gebco_depth, copernicus_depth = query_depth_both(lat_rounded, lon_rounded)
    
    # Determine primary depth (priority: EMODnet > Copernicus > GEBCO)
    if emodnet_depth is not None:
        primary_depth = emodnet_depth
        primary_source = "EMODNET_2024"
        primary_resolution = 115
    elif copernicus_depth is not None:
        primary_depth = copernicus_depth
        primary_source = "COPERNICUS_2024"
        primary_resolution = COPERNICUS_RESOLUTION_M
    elif gebco_depth is not None:
        primary_depth = gebco_depth
        primary_source = "GEBCO_2024"
        primary_resolution = 450
    else:
        raise HTTPException(
            status_code=404,
            detail="Point out of bounds or no data available"
        )
    
    # Build response with all available datasets
    response_data = {
        "depth_m": primary_depth,
        "source": primary_source,
        "resolution_m": primary_resolution,
    }
    
    # Add EMODnet data if available
    if emodnet_depth is not None:
        response_data["emodnet"] = DepthDataPoint(
            depth_m=emodnet_depth,
            source="EMODNET_2024",
            resolution_m=115
        )
    
    # Add Copernicus data if available
    if copernicus_depth is not None:
        response_data["copernicus"] = DepthDataPoint(
            depth_m=copernicus_depth,
            source="COPERNICUS_2024",
            resolution_m=COPERNICUS_RESOLUTION_M
        )
    
    # Add GEBCO data if available
    if gebco_depth is not None:
        response_data["gebco"] = DepthDataPoint(
            depth_m=gebco_depth,
            source="GEBCO_2024",
            resolution_m=450
        )
    
    return DepthResponse(**response_data)


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
    depth, _ = query_depth(lat_rounded, lon_rounded)
    
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
    global _emodnet_dataset, _gebco_dataset
    
    # Use EMODnet if available, otherwise GEBCO
    dataset = _emodnet_dataset if _emodnet_dataset is not None else _gebco_dataset
    
    if dataset is None:
        raise HTTPException(
            status_code=503,
            detail="No bathymetry dataset loaded"
        )
    
    try:
        # Parse intervals
        depth_intervals = [float(x.strip()) for x in intervals.split(",")]
        depth_intervals = sorted(set(depth_intervals))  # Remove duplicates and sort
        
        # Get bounding box
        bbox = (min_lon, min_lat, max_lon, max_lat)
        
        # Read data window from COG
        window = rasterio.windows.from_bounds(*bbox, dataset.transform)
        window = window.intersection(rasterio.windows.Window(0, 0, dataset.width, dataset.height))
        
        if window.width == 0 or window.height == 0:
            raise HTTPException(
                status_code=400,
                detail="Bounding box is outside dataset bounds"
            )
        
        # Read depth data
        data = dataset.read(1, window=window)
        transform = rasterio.windows.transform(window, dataset.transform)
        
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

