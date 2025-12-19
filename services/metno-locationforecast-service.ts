/**
 * MET Norway Locationforecast Service
 * Fetches weather data with caching support
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMetJson } from "./metno-http";
import { logDebug, logWarn, logError } from "@/lib/logger";

const BASE_URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
const CACHE_PREFIX = "@metno_weather_";
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes default TTL

interface MetWeatherData {
  now: {
    tempC: number;
    humidity: number;
    windMs: number;
    windFromDeg: number;
  };
  hourly: Array<{
    time: string;
    tempC: number;
    humidity: number;
    windMs: number;
    windFromDeg: number;
  }>;
  meta: {
    expires: string | null;
    lastModified: string | null;
    provider: "metno";
  };
}

interface CacheEntry {
  data: MetWeatherData;
  cachedAt: number;
  expires?: string;
  lastModified?: string;
}

/**
 * Round coordinate to 4 decimals for caching
 */
function roundCoord(x: number): number {
  return Number(x.toFixed(4));
}

/**
 * Get cache key for coordinates
 */
function getCacheKey(lat: number, lon: number): string {
  const lat4 = roundCoord(lat);
  const lon4 = roundCoord(lon);
  return `${CACHE_PREFIX}${lat4}_${lon4}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  // If expires header exists, use it
  if (entry.expires) {
    const expiresDate = new Date(entry.expires);
    if (Date.now() < expiresDate.getTime()) {
      return true;
    }
  }
  
  // Otherwise use default TTL
  const age = Date.now() - entry.cachedAt;
  return age < CACHE_TTL_MS;
}

/**
 * Parse MET locationforecast response
 */
function parseMetResponse(json: any): MetWeatherData {
  const timeseries = json.properties?.timeseries || [];
  if (timeseries.length === 0) {
    throw new Error("No timeseries data in MET response");
  }

  // Current data (first entry)
  const nowData = timeseries[0].data?.instant?.details;
  if (!nowData) {
    throw new Error("No instant data in MET response");
  }

  const now = {
    tempC: nowData.air_temperature ?? 0,
    humidity: nowData.relative_humidity ?? 0,
    windMs: nowData.wind_speed ?? 0,
    windFromDeg: nowData.wind_from_direction ?? 0,
  };

  // Hourly data (next 24 entries, or filter by hourly step)
  const hourly: MetWeatherData["hourly"] = [];
  for (let i = 0; i < Math.min(24, timeseries.length); i++) {
    const entry = timeseries[i];
    const instant = entry.data?.instant?.details;
    if (instant) {
      hourly.push({
        time: entry.time,
        tempC: instant.air_temperature ?? 0,
        humidity: instant.relative_humidity ?? 0,
        windMs: instant.wind_speed ?? 0,
        windFromDeg: instant.wind_from_direction ?? 0,
      });
    }
  }

  return {
    now,
    hourly,
    meta: {
      expires: null, // Will be set from response headers
      lastModified: null,
      provider: "metno",
    },
  };
}

/**
 * Get MET weather data with caching
 */
export async function getMetWeather(
  lat: number,
  lon: number
): Promise<MetWeatherData> {
  const lat4 = roundCoord(lat);
  const lon4 = roundCoord(lon);
  const cacheKey = getCacheKey(lat4, lon4);

  // Check cache first
  try {
    const cachedStr = await AsyncStorage.getItem(cacheKey);
    if (cachedStr) {
      const cached: CacheEntry = JSON.parse(cachedStr);
      if (isCacheValid(cached)) {
        logDebug(`[MetWeather] Serving from cache: ${cacheKey}`);
        return cached.data;
      }
    }
  } catch (error) {
    logWarn(`[MetWeather] Cache read error:`, error);
  }

  // Fetch from API
  const url = `${BASE_URL}?lat=${lat4}&lon=${lon4}`;
  
  // Get If-Modified-Since from cache if available
  let ifModifiedSince: string | undefined;
  try {
    const cachedStr = await AsyncStorage.getItem(cacheKey);
    if (cachedStr) {
      const cached: CacheEntry = JSON.parse(cachedStr);
      if (cached.lastModified) {
        ifModifiedSince = cached.lastModified;
      }
    }
  } catch (error) {
    // Ignore cache read errors
  }

  try {
    const response = await fetchMetJson(url, {
      ifModifiedSince,
    });

    // Handle 304 Not Modified
    if (response.status === 304) {
      logDebug(`[MetWeather] 304 Not Modified, extending cache validity`);
      // Update cache with new expires if available
      try {
        const cachedStr = await AsyncStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached: CacheEntry = JSON.parse(cachedStr);
          if (response.headers.expires) {
            cached.expires = response.headers.expires;
          }
          await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
        }
      } catch (error) {
        // Ignore cache update errors
      }
      // Return cached data
      const cachedStr = await AsyncStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached: CacheEntry = JSON.parse(cachedStr);
        return cached.data;
      }
      throw new Error("304 but no cache available");
    }

    // Parse response
    if (!response.json) {
      throw new Error("No JSON in response");
    }

    const data = parseMetResponse(response.json);
    
    // Update meta with headers
    data.meta.expires = response.headers.expires || null;
    data.meta.lastModified = response.headers.lastModified || null;

    // Save to cache
    const cacheEntry: CacheEntry = {
      data,
      cachedAt: Date.now(),
      expires: response.headers.expires,
      lastModified: response.headers.lastModified,
    };

    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      logDebug(`[MetWeather] Cached data for: ${cacheKey}`);
    } catch (error) {
      logWarn(`[MetWeather] Cache write error:`, error);
    }

    return data;
  } catch (error) {
    logError(`[MetWeather] Fetch error:`, error);
    throw error;
  }
}

