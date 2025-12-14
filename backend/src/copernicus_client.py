"""
Copernicus Marine Service WMTS client for bathymetry data.
Uses WMTS GetFeatureInfo to query depth at specific coordinates.
"""

import requests
from typing import Optional
from functools import lru_cache
import math

# Copernicus WMTS endpoint
COPERNICUS_WMTS_BASE = "https://wmts.marine.copernicus.eu/teroWmts"

# Layer identifier for composite bathymetry (best quality)
# Options: it_my (intertidal), comp_my (composite), irte_my (physical-based), wk_my (wave kinematics)
LAYER_HEIGHT = "BATHYMETRY_GLO_PHY_COASTAL_L4_MY_016_001/cmems_obs-sdb_glo_phy_comp_my_100m-l4-s2_static_202511/height"

# Resolution: ~100m
COPERNICUS_RESOLUTION_M = 100


def lat_lon_to_tile_coords(lat: float, lon: float, zoom: int = 10) -> tuple[int, int, int, int]:
    """
    Convert lat/lon to WMTS tile coordinates for EPSG:4326.
    Based on WMTS 1.0.0 specification for EPSG:4326.
    
    Args:
        lat: Latitude (-90 to 90)
        lon: Longitude (-180 to 180)
        zoom: Zoom level (0-10, higher = more detail)
    
    Returns:
        Tuple of (tile_col, tile_row, pixel_x, pixel_y) within the tile
    """
    # Normalize coordinates
    lat = max(-90, min(90, lat))
    lon = max(-180, min(180, lon))
    
    # EPSG:4326 tile matrix dimensions
    # At zoom level z: 2^(z+1) columns, 2^z rows
    num_cols = 2 ** (zoom + 1)
    num_rows = 2 ** zoom
    
    # Calculate tile column (longitude-based)
    # Longitude -180 to 180 maps to column 0 to num_cols-1
    tile_col = int((lon + 180.0) / 360.0 * num_cols)
    tile_col = max(0, min(num_cols - 1, tile_col))
    
    # Calculate tile row (latitude-based, using Mercator projection formula)
    # Latitude 90 to -90 maps to row 0 to num_rows-1
    lat_rad = math.radians(lat)
    # Mercator projection formula for EPSG:4326
    mercator_y = math.log(math.tan(math.pi / 4 + lat_rad / 2))
    # Normalize to 0-1 range (90° to -90°)
    normalized_y = (1 - (mercator_y / math.pi)) / 2
    tile_row = int(normalized_y * num_rows)
    tile_row = max(0, min(num_rows - 1, tile_row))
    
    # Calculate pixel position within tile (512x512 pixels per tile)
    tile_width_deg = 360.0 / num_cols
    tile_col_start_lon = -180.0 + tile_col * tile_width_deg
    
    # Pixel X: position within tile based on longitude
    pixel_x = int(((lon - tile_col_start_lon) / tile_width_deg) * 512)
    pixel_x = max(0, min(511, pixel_x))
    
    # Pixel Y: position within tile based on latitude
    # Use inverse Mercator to find tile row boundaries
    tile_row_normalized_start = tile_row / num_rows
    tile_row_normalized_end = (tile_row + 1) / num_rows
    
    # Convert normalized Y back to latitude for tile boundaries
    mercator_y_start = math.pi * (1 - 2 * tile_row_normalized_start)
    mercator_y_end = math.pi * (1 - 2 * tile_row_normalized_end)
    lat_start = math.degrees(2 * math.atan(math.exp(mercator_y_start)) - math.pi / 2)
    lat_end = math.degrees(2 * math.atan(math.exp(mercator_y_end)) - math.pi / 2)
    
    # Pixel Y within tile
    if lat_end != lat_start:
        pixel_y = int(((lat_start - lat) / (lat_start - lat_end)) * 512)
    else:
        pixel_y = 256  # Center if tile has no height
    pixel_y = max(0, min(511, pixel_y))
    
    return tile_col, tile_row, pixel_x, pixel_y


@lru_cache(maxsize=1000)
def query_copernicus_depth(lat: float, lon: float) -> Optional[float]:
    """
    Query depth from Copernicus WMTS service using GetFeatureInfo.
    
    Args:
        lat: Latitude (WGS84)
        lon: Longitude (WGS84)
    
    Returns:
        Depth in meters (negative for below sea level, positive for land)
        None if query fails or out of bounds
    """
    try:
        # Use zoom level 10 for good resolution (~100m)
        zoom = 10
        tile_col, tile_row, pixel_x, pixel_y = lat_lon_to_tile_coords(lat, lon, zoom)
        
        # WMTS GetFeatureInfo request
        params = {
            "SERVICE": "WMTS",
            "REQUEST": "GetFeatureInfo",
            "VERSION": "1.0.0",
            "LAYER": LAYER_HEIGHT,
            "STYLE": "default",
            "TILEMATRIXSET": "EPSG:4326",
            "TILEMATRIX": str(zoom),
            "TILEROW": str(tile_row),
            "TILECOL": str(tile_col),
            "I": str(pixel_x),  # Pixel X in tile
            "J": str(pixel_y),  # Pixel Y in tile
            "INFOFORMAT": "application/json",
            "FORMAT": "image/png"
        }
        
        response = requests.get(COPERNICUS_WMTS_BASE, params=params, timeout=3)  # Reduced timeout for faster fallback
        response.raise_for_status()
        
        # Parse JSON response
        try:
            data = response.json()
        except ValueError:
            # Not JSON, might be HTML error page
            return None
        
        # Extract depth value from response
        # WMTS GetFeatureInfo can return different formats
        if isinstance(data, dict):
            # Try GeoJSON-like structure (features array)
            if "features" in data and isinstance(data["features"], list) and len(data["features"]) > 0:
                feature = data["features"][0]
                if isinstance(feature, dict) and "properties" in feature:
                    props = feature["properties"]
                    # Try common property names for depth/elevation
                    for key in ["height", "depth", "elevation", "value", "bathymetry", "SDB_height"]:
                        if key in props and props[key] is not None:
                            try:
                                depth = float(props[key])
                                # Skip NaN or invalid values
                                if not math.isnan(depth) and math.isfinite(depth):
                                    # Copernicus returns elevation (positive up), convert to depth (negative down)
                                    # If value is positive, it's elevation above sea level (land)
                                    # If value is negative, it's already depth
                                    return -abs(depth) if depth >= 0 else depth
                            except (ValueError, TypeError):
                                continue
            
            # Try direct value access in root object
            for key in ["height", "depth", "elevation", "value", "SDB_height"]:
                if key in data and data[key] is not None:
                    try:
                        depth = float(data[key])
                        if not math.isnan(depth) and math.isfinite(depth):
                            return -abs(depth) if depth >= 0 else depth
                    except (ValueError, TypeError):
                        continue
            
            # Try values array (some WMTS services return arrays)
            if "values" in data and isinstance(data["values"], list) and len(data["values"]) > 0:
                try:
                    depth = float(data["values"][0])
                    if not math.isnan(depth) and math.isfinite(depth):
                        return -abs(depth) if depth >= 0 else depth
                except (ValueError, TypeError, IndexError):
                    pass
        
        # If no depth found, return None
        return None
        
    except requests.exceptions.RequestException:
        # Network error or timeout
        return None
    except (ValueError, KeyError, TypeError, IndexError):
        # Parsing error or unexpected response format
        return None
    except Exception:
        # Any other error
        return None

