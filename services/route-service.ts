/**
 * Route Service - OpenRouteService API wrapper
 * Provides route calculation for walking and driving
 */

export type RouteProfile = "foot-walking" | "driving-car";

export interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResponse {
  coordinates: RouteCoordinates[];
  distance: number; // in meters
  duration: number; // in seconds
}

const OPENROUTESERVICE_API_KEY = process.env.EXPO_PUBLIC_OPENROUTESERVICE_KEY || "";
const BASE_URL = "https://api.openrouteservice.org/v2/directions";

/**
 * Calculate route between two points using OpenRouteService
 */
export async function calculateRoute(
  start: RouteCoordinates,
  end: RouteCoordinates,
  profile: RouteProfile = "foot-walking"
): Promise<RouteResponse> {
  try {
    // If no API key, fall back to simple straight line calculation
    if (!OPENROUTESERVICE_API_KEY) {
      console.warn("⚠️ OpenRouteService API key not set. Using fallback route calculation.");
      return calculateFallbackRoute(start, end);
    }

    const url = `${BASE_URL}/${profile}?api_key=${OPENROUTESERVICE_API_KEY}&start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouteService API error:", response.status, errorText);
      // Fall back to simple route if API fails
      return calculateFallbackRoute(start, end);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error("No route found");
    }

    const feature = data.features[0];
    const geometry = feature.geometry;
    const properties = feature.properties;

    // Convert GeoJSON coordinates [lng, lat] to [lat, lng]
    const coordinates: RouteCoordinates[] = geometry.coordinates.map((coord: [number, number]) => ({
      longitude: coord[0],
      latitude: coord[1],
    }));

    return {
      coordinates,
      distance: properties.segments?.[0]?.distance || 0,
      duration: properties.segments?.[0]?.duration || 0,
    };
  } catch (error) {
    console.error("Error calculating route:", error);
    // Fall back to simple route calculation
    return calculateFallbackRoute(start, end);
  }
}

/**
 * Fallback route calculation (straight line)
 * Used when API is unavailable or fails
 */
function calculateFallbackRoute(
  start: RouteCoordinates,
  end: RouteCoordinates
): RouteResponse {
  const steps = 50;
  const coordinates: RouteCoordinates[] = [];

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    coordinates.push({
      latitude: start.latitude + (end.latitude - start.latitude) * ratio,
      longitude: start.longitude + (end.longitude - start.longitude) * ratio,
    });
  }

  // Calculate approximate distance using Haversine formula
  const distance = calculateDistance(start, end);

  return {
    coordinates,
    distance,
    duration: Math.round(distance / 1.4), // Approximate walking speed: 1.4 m/s
  };
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(point1: RouteCoordinates, point2: RouteCoordinates): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance in meters to readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} sa ${minutes} dk`;
  }
  return `${minutes} dk`;
}

