/**
 * Map projection utilities for converting between lat/lon and screen coordinates.
 * Uses Web Mercator projection (same as most web maps).
 */

/**
 * Convert longitude/latitude to Web Mercator normalized coordinates (0..1).
 */
export function lonLatToMercator(lon: number, lat: number): { x: number; y: number } {
  const x = (lon + 180) / 360;
  
  const latRad = (lat * Math.PI) / 180;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
  
  return { x, y };
}

/**
 * Convert Web Mercator normalized coordinates to longitude/latitude.
 */
export function mercatorToLonLat(x: number, y: number): { lon: number; lat: number } {
  const lon = x * 360 - 180;
  
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y)));
  const lat = (latRad * 180) / Math.PI;
  
  return { lon, lat };
}

/**
 * Convert lat/lon to screen pixel coordinates given a map region and screen dimensions.
 * @param lat Latitude
 * @param lon Longitude
 * @param region Map region {latitude, longitude, latitudeDelta, longitudeDelta}
 * @param screenWidth Screen width in pixels
 * @param screenHeight Screen height in pixels
 * @returns Screen pixel coordinates {sx, sy}
 */
export function lonLatToScreen(
  lat: number,
  lon: number,
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  screenWidth: number,
  screenHeight: number
): { sx: number; sy: number } {
  // Convert region center and tapped point to Mercator
  const centerMerc = lonLatToMercator(region.longitude, region.latitude);
  const pointMerc = lonLatToMercator(lon, lat);

  // Calculate region bounds in Mercator
  const westMerc = lonLatToMercator(
    region.longitude - region.longitudeDelta / 2,
    region.latitude
  ).x;
  const eastMerc = lonLatToMercator(
    region.longitude + region.longitudeDelta / 2,
    region.latitude
  ).x;
  const southMerc = lonLatToMercator(
    region.longitude,
    region.latitude - region.latitudeDelta / 2
  ).y;
  const northMerc = lonLatToMercator(
    region.longitude,
    region.latitude + region.latitudeDelta / 2
  ).y;

  // Map Mercator coordinates to screen pixels
  const sx = ((pointMerc.x - westMerc) / (eastMerc - westMerc)) * screenWidth;
  const sy = ((pointMerc.y - southMerc) / (northMerc - southMerc)) * screenHeight;

  return { sx, sy };
}

/**
 * Convert screen pixel coordinates to lat/lon given a map region.
 */
export function screenToLonLat(
  sx: number,
  sy: number,
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  screenWidth: number,
  screenHeight: number
): { lat: number; lon: number } {
  // Calculate region bounds in Mercator
  const westMerc = lonLatToMercator(
    region.longitude - region.longitudeDelta / 2,
    region.latitude
  ).x;
  const eastMerc = lonLatToMercator(
    region.longitude + region.longitudeDelta / 2,
    region.latitude
  ).x;
  const southMerc = lonLatToMercator(
    region.longitude,
    region.latitude - region.latitudeDelta / 2
  ).y;
  const northMerc = lonLatToMercator(
    region.longitude,
    region.latitude + region.latitudeDelta / 2
  ).y;

  // Convert screen coordinates to Mercator
  const mercX = westMerc + (sx / screenWidth) * (eastMerc - westMerc);
  const mercY = southMerc + (sy / screenHeight) * (northMerc - southMerc);

  // Convert Mercator to lat/lon
  return mercatorToLonLat(mercX, mercY);
}

