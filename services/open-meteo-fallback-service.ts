/**
 * Open-Meteo Fallback Service
 * Used when MET weather fails
 */

import { logDebug, logError } from "@/lib/logger";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

export interface OpenMeteoWeatherData {
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
    expires: null;
    lastModified: null;
    provider: "open-meteo";
  };
}

/**
 * Round coordinate to 4 decimals
 */
function roundCoord(x: number): number {
  return Number(x.toFixed(4));
}

/**
 * Get Open-Meteo weather data (fallback)
 */
export async function getOpenMeteoWeather(
  lat: number,
  lon: number
): Promise<OpenMeteoWeatherData> {
  const lat4 = roundCoord(lat);
  const lon4 = roundCoord(lon);
  
  const url = `${BASE_URL}?latitude=${lat4}&longitude=${lon4}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=auto`;

  try {
    logDebug(`[OpenMeteo] Fetching: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const json = await response.json();
    
    const hourly = json.hourly || {};
    const times = hourly.time || [];
    const temps = hourly.temperature_2m || [];
    const humidities = hourly.relative_humidity_2m || [];
    const windSpeeds = hourly.wind_speed_10m || [];
    const windDirs = hourly.wind_direction_10m || [];

    if (times.length === 0) {
      throw new Error("No hourly data in Open-Meteo response");
    }

    // Current data (first entry)
    const now = {
      tempC: temps[0] ?? 0,
      humidity: humidities[0] ?? 0,
      windMs: windSpeeds[0] ?? 0,
      windFromDeg: windDirs[0] ?? 0,
    };

    // Hourly data (next 24 entries)
    const hourlyData: OpenMeteoWeatherData["hourly"] = [];
    for (let i = 0; i < Math.min(24, times.length); i++) {
      hourlyData.push({
        time: times[i],
        tempC: temps[i] ?? 0,
        humidity: humidities[i] ?? 0,
        windMs: windSpeeds[i] ?? 0,
        windFromDeg: windDirs[i] ?? 0,
      });
    }

    return {
      now,
      hourly: hourlyData,
      meta: {
        expires: null,
        lastModified: null,
        provider: "open-meteo",
      },
    };
  } catch (error) {
    logError(`[OpenMeteo] Fetch error:`, error);
    throw error;
  }
}

