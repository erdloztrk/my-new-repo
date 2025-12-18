/**
 * Geohash utility for geospatial queries
 * Based on geohash algorithm for efficient location-based searches
 * 
 * Reference: https://en.wikipedia.org/wiki/Geohash
 */

/**
 * Base32 encoding for geohash
 */
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Convert latitude/longitude to geohash
 * @param lat Latitude (-90 to 90)
 * @param lon Longitude (-180 to 180)
 * @param precision Number of characters (1-12, default 9)
 * @returns Geohash string
 */
export function encodeGeohash(lat: number, lon: number, precision: number = 9): string {
  let minLat = -90;
  let maxLat = 90;
  let minLon = -180;
  let maxLon = 180;
  
  let geohash = "";
  let bits = 0;
  let bit = 0;
  let ch = 0;
  let even = true;
  
  while (geohash.length < precision) {
    if (even) {
      // Longitude
      const mid = (minLon + maxLon) / 2;
      if (lon >= mid) {
        ch |= (1 << (4 - bit));
        minLon = mid;
      } else {
        maxLon = mid;
      }
    } else {
      // Latitude
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= (1 << (4 - bit));
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }
    
    even = !even;
    
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  
  return geohash;
}

/**
 * Decode geohash to latitude/longitude bounds
 * @param geohash Geohash string
 * @returns Bounding box { minLat, maxLat, minLon, maxLon }
 */
export function decodeGeohash(geohash: string): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  let minLat = -90;
  let maxLat = 90;
  let minLon = -180;
  let maxLon = 180;
  
  let even = true;
  
  for (let i = 0; i < geohash.length; i++) {
    const ch = BASE32.indexOf(geohash[i]);
    if (ch === -1) throw new Error("Invalid geohash");
    
    for (let j = 0; j < 5; j++) {
      const bit = (ch >> (4 - j)) & 1;
      
      if (even) {
        // Longitude
        const mid = (minLon + maxLon) / 2;
        if (bit === 1) {
          minLon = mid;
        } else {
          maxLon = mid;
        }
      } else {
        // Latitude
        const mid = (minLat + maxLat) / 2;
        if (bit === 1) {
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      
      even = !even;
    }
  }
  
  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Get center point from geohash
 * @param geohash Geohash string
 * @returns Center coordinates { lat, lon }
 */
export function geohashToCenter(geohash: string): { lat: number; lon: number } {
  const bounds = decodeGeohash(geohash);
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lon: (bounds.minLon + bounds.maxLon) / 2,
  };
}

/**
 * Get neighboring geohashes (8 neighbors + self)
 * @param geohash Geohash string
 * @returns Array of neighboring geohashes
 */
export function getNeighbors(geohash: string): string[] {
  const neighbors: string[] = [geohash];
  
  // North, South, East, West, NE, NW, SE, SW
  const directions = [
    { lat: 1, lon: 0 },   // North
    { lat: -1, lon: 0 },  // South
    { lat: 0, lon: 1 },   // East
    { lat: 0, lon: -1 },  // West
    { lat: 1, lon: 1 },  // NE
    { lat: 1, lon: -1 }, // NW
    { lat: -1, lon: 1 }, // SE
    { lat: -1, lon: -1 }, // SW
  ];
  
  const center = geohashToCenter(geohash);
  const precision = geohash.length;
  
  // Approximate lat/lon delta for this precision
  const latDelta = 90 / Math.pow(2, Math.floor((precision * 5) / 2));
  const lonDelta = 180 / Math.pow(2, Math.ceil((precision * 5) / 2));
  
  for (const dir of directions) {
    const newLat = center.lat + dir.lat * latDelta;
    const newLon = center.lon + dir.lon * lonDelta;
    
    // Clamp to valid ranges
    const clampedLat = Math.max(-90, Math.min(90, newLat));
    const clampedLon = Math.max(-180, Math.min(180, newLon));
    
    neighbors.push(encodeGeohash(clampedLat, clampedLon, precision));
  }
  
  return neighbors;
}

/**
 * Get geohash precision for a given radius (in km)
 * Approximate precision levels:
 * - precision 1: ~5000km
 * - precision 2: ~1250km
 * - precision 3: ~156km
 * - precision 4: ~39km
 * - precision 5: ~5km
 * - precision 6: ~1.2km
 * - precision 7: ~153m
 * - precision 8: ~38m
 * - precision 9: ~5m
 * 
 * @param radiusKm Radius in kilometers
 * @returns Recommended precision (1-9)
 */
export function getPrecisionForRadius(radiusKm: number): number {
  if (radiusKm >= 2500) return 1;
  if (radiusKm >= 625) return 2;
  if (radiusKm >= 78) return 3;
  if (radiusKm >= 20) return 4;
  if (radiusKm >= 2.5) return 5;
  if (radiusKm >= 0.6) return 6;
  if (radiusKm >= 0.15) return 7;
  if (radiusKm >= 0.04) return 8;
  return 9;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

