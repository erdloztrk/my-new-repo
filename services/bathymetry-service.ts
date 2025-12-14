/**
 * Bathymetry API service for depth queries and species scoring.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";
import type { DepthResponse, ScoreResponse, SpeciesKey, WeatherData, ContourResponse } from "@/types/bathymetry";
import { logDebug, logWarn, logError } from "@/lib/logger";

// For development: use localhost for iOS simulator, 10.0.2.2 for Android emulator, or your computer's IP for physical device
// Lazy evaluation to avoid Platform access at module load time
let _cachedApiBaseUrl: string | null = null;

function resolveHostFromExpo(): string | null {
  // In Expo Go or dev client, hostUri usually contains LAN IP (e.g., 192.168.x.x:19000)
  const hostUri =
    // SDK 49/50+: expoConfig is available
    (Constants.expoConfig as { hostUri?: string } | undefined)?.hostUri ||
    // Legacy fallback
    (Constants as { manifest?: { hostUri?: string } }).manifest?.hostUri;

  if (!hostUri) return null;

  try {
    const url = hostUri.includes("://") ? new URL(hostUri) : new URL(`http://${hostUri}`);
    const host = url.hostname;
    return host ? `http://${host}:8000` : null;
  } catch {
    return null;
  }
}

const getApiBaseUrl = (): string => {
  if (_cachedApiBaseUrl) {
    return _cachedApiBaseUrl;
  }
  
  if (process.env.EXPO_PUBLIC_BATHYMETRY_API_URL) {
    _cachedApiBaseUrl = process.env.EXPO_PUBLIC_BATHYMETRY_API_URL;
    return _cachedApiBaseUrl;
  }
  // If running in Expo Go/dev client on LAN, derive backend host from Expo hostUri
  const expoHostBase = resolveHostFromExpo();
  if (expoHostBase) {
    _cachedApiBaseUrl = expoHostBase;
    return _cachedApiBaseUrl;
  }

  // iOS simulator sometimes needs 127.0.0.1 instead of localhost; Android emulator needs 10.0.2.2
  try {
    if (Platform.OS === "ios") {
      _cachedApiBaseUrl = "http://127.0.0.1:8000";
      return _cachedApiBaseUrl;
    }
    // Android emulator needs 10.0.2.2
    if (Platform.OS === "android") {
      _cachedApiBaseUrl = "http://10.0.2.2:8000";
      return _cachedApiBaseUrl;
    }
  } catch (e) {
    // Platform not available yet, use default
    logWarn("[BathymetryService] Platform not available, using default localhost");
  }
  
  // Default: localhost
  _cachedApiBaseUrl = "http://localhost:8000";
  return _cachedApiBaseUrl;
};

/**
 * Mock depth data for testing when backend is unavailable.
 * Uses realistic depth values for Marmara Sea region.
 */
function getMockDepth(lat: number, lon: number): DepthResponse {
  // Marmara Sea depth characteristics:
  // - Average depth: ~200m
  // - Coastal areas (near shore): 5-30m
  // - Deep areas: 100-1300m
  // - Most fishing areas: 10-50m
  
  // Simple heuristic: closer to typical Turkish coast = shallower
  // For Marmara region (lat ~40-41, lon ~26-30):
  const isNearCoast = Math.abs(lat - 40.5) < 0.1 && Math.abs(lon - 28.5) < 0.5;
  
  let mockDepth: number;
  if (isNearCoast) {
    // Coastal area: 8-25m (typical shore fishing depth)
    mockDepth = -(8 + Math.random() * 17); // -8 to -25 meters
  } else {
    // Open sea: 30-80m (moderate depth)
    mockDepth = -(30 + Math.random() * 50); // -30 to -80 meters
  }
  
  return {
    depth_m: mockDepth,
    source: "MOCK_DATA",
    resolution_m: 450,
  };
}

/**
 * Query depth at lat/lon.
 */
export async function getDepth(
  lat: number,
  lon: number
): Promise<DepthResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/v1/depth?lat=${lat}&lon=${lon}`;
  logDebug("[BathymetryService] Fetching depth from:", url);
  
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (increased for slow backend)
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Point out of bounds or no data available");
      }
      const errorText = await response.text();
      throw new Error(`Depth query failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    logDebug("[BathymetryService] Backend response received, source:", data.source);
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        // Use mock data on timeout
        logWarn(`[BathymetryService] Request timeout after 30s (${url}), using mock data`);
        return getMockDepth(lat, lon);
      }
      if (error.message.includes("Network request failed")) {
        // Use mock data when backend is unavailable (for UI testing)
        logWarn("[BathymetryService] Network request failed, using mock data");
        return getMockDepth(lat, lon);
      }
      // For other errors, log and throw
      logError("[BathymetryService] Error fetching depth:", error);
      throw error;
    }
    throw new Error("Unknown error fetching depth");
  }
}

/**
 * Mock score data for testing when backend is unavailable.
 * Uses realistic depth-based scoring for different species.
 */
function getMockScore(lat: number, lon: number, species: SpeciesKey): ScoreResponse {
  // First get a realistic depth (same logic as getMockDepth)
  const isNearCoast = Math.abs(lat - 40.5) < 0.1 && Math.abs(lon - 28.5) < 0.5;
  const mockDepth = isNearCoast 
    ? -(8 + Math.random() * 17)  // -8 to -25m (coastal)
    : -(30 + Math.random() * 50); // -30 to -80m (open sea)
  
  const depthAbs = Math.abs(mockDepth);
  
  // Species-specific depth preferences (simplified)
  // These match the backend scoring profiles
  let score: number;
  let zone: "shallow" | "optimal" | "deep" | "land";
  let reason: string;
  
  switch (species) {
    case "chipura": // Çipura: prefers 5-30m
      if (depthAbs >= 5 && depthAbs <= 30) {
        score = 75 + Math.random() * 20; // 75-95
        zone = "optimal";
        reason = `Derinlik ${depthAbs.toFixed(1)}m çipura için optimal aralıkta (5-30m).`;
      } else if (depthAbs < 5) {
        score = 40 + Math.random() * 20; // 40-60
        zone = "shallow";
        reason = `Derinlik ${depthAbs.toFixed(1)}m çipura için çok sığ (tercih: 5-30m).`;
      } else {
        score = 30 + Math.random() * 20; // 30-50
        zone = "deep";
        reason = `Derinlik ${depthAbs.toFixed(1)}m çipura için derin (tercih: 5-30m).`;
      }
      break;
      
    case "levrek": // Levrek: prefers 3-20m
      if (depthAbs >= 3 && depthAbs <= 20) {
        score = 80 + Math.random() * 15; // 80-95
        zone = "optimal";
        reason = `Derinlik ${depthAbs.toFixed(1)}m levrek için optimal aralıkta (3-20m).`;
      } else if (depthAbs < 3) {
        score = 35 + Math.random() * 20; // 35-55
        zone = "shallow";
        reason = `Derinlik ${depthAbs.toFixed(1)}m levrek için çok sığ (tercih: 3-20m).`;
      } else {
        score = 25 + Math.random() * 20; // 25-45
        zone = "deep";
        reason = `Derinlik ${depthAbs.toFixed(1)}m levrek için derin (tercih: 3-20m).`;
      }
      break;
      
    case "sargoz": // Sargoz: prefers 10-40m (rocky)
      if (depthAbs >= 10 && depthAbs <= 40) {
        score = 70 + Math.random() * 20; // 70-90
        zone = "optimal";
        reason = `Derinlik ${depthAbs.toFixed(1)}m sargoz için optimal aralıkta (10-40m).`;
      } else {
        score = 40 + Math.random() * 25; // 40-65
        zone = depthAbs < 10 ? "shallow" : "deep";
        reason = `Derinlik ${depthAbs.toFixed(1)}m sargoz için uygun değil (tercih: 10-40m).`;
      }
      break;
      
    case "karagoz": // Karagöz: prefers 8-35m (rocky)
      if (depthAbs >= 8 && depthAbs <= 35) {
        score = 72 + Math.random() * 18; // 72-90
        zone = "optimal";
        reason = `Derinlik ${depthAbs.toFixed(1)}m karagöz için optimal aralıkta (8-35m).`;
      } else {
        score = 42 + Math.random() * 23; // 42-65
        zone = depthAbs < 8 ? "shallow" : "deep";
        reason = `Derinlik ${depthAbs.toFixed(1)}m karagöz için uygun değil (tercih: 8-35m).`;
      }
      break;
      
    case "mirmir": // Mırmır: prefers 5-25m (sandy)
      if (depthAbs >= 5 && depthAbs <= 25) {
        score = 68 + Math.random() * 22; // 68-90
        zone = "optimal";
        reason = `Derinlik ${depthAbs.toFixed(1)}m mırmır için optimal aralıkta (5-25m).`;
      } else {
        score = 38 + Math.random() * 25; // 38-63
        zone = depthAbs < 5 ? "shallow" : "deep";
        reason = `Derinlik ${depthAbs.toFixed(1)}m mırmır için uygun değil (tercih: 5-25m).`;
      }
      break;
      
    default:
      score = 50;
      zone = "shallow";
      reason = "Tür için skor hesaplanamadı.";
  }
  
  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  return {
    depth_m: mockDepth,
    score_0_100: score,
    zone_label: zone,
    species,
    reasons: [
      { type: "depth", message: reason },
      { type: "mock", message: "Mock veri - Backend çalışmıyor." },
    ],
  };
}

/**
 * Get depth-based score for a species at lat/lon with weather and time factors.
 */
export async function getScore(
  lat: number,
  lon: number,
  species: SpeciesKey,
  weather?: WeatherData,
  currentTime?: number
): Promise<ScoreResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/v1/score`;
  logDebug("[BathymetryService] Fetching score from:", url);
  
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (increased for slow backend)
    
    const requestBody = {
      lat,
      lon,
      species,
      weather: weather || null,
      current_time: currentTime || Math.floor(Date.now() / 1000),
    };
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Point out of bounds or no data available");
      }
      if (response.status === 400) {
        throw new Error(`Invalid species: ${species}`);
      }
      const errorText = await response.text();
      throw new Error(`Score query failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    logDebug("[BathymetryService] Score response received");
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        // Use mock data on timeout
        logWarn(`[BathymetryService] Request timeout after 30s (${url}), using mock data`);
        return getMockScore(lat, lon, species);
      }
      if (error.message.includes("Network request failed")) {
        // Use mock data when backend is unavailable (for UI testing)
        // Don't log as error since we're handling it gracefully
        return getMockScore(lat, lon, species);
      }
      // For other errors, log and throw
      logError("[BathymetryService] Error fetching score:", error);
      throw error;
    }
    throw new Error("Unknown error fetching score");
  }
}

/**
 * Get depth contour lines for a bounding box.
 */
export async function getContours(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  intervals: string = "5,10,15,20,30,50,100"
): Promise<ContourResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/v1/contours?min_lat=${minLat}&max_lat=${maxLat}&min_lon=${minLon}&max_lon=${maxLon}&intervals=${intervals}`;
  logDebug("[BathymetryService] Fetching contours from:", url);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for contours
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Contour query failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logError("[BathymetryService] Error fetching contours:", error);
    throw error;
  }
}

/**
 * Round coordinates for cache key (0.001° ≈ 111m).
 */
export function roundForCache(lat: number, lon: number): { lat: number; lon: number } {
  return {
    lat: Math.round(lat * 1000) / 1000,
    lon: Math.round(lon * 1000) / 1000,
  };
}

