/**
 * Wind service for fetching wind vector field data from backend.
 */

import { Platform } from "react-native";
import { logError, logWarn } from "@/lib/logger";
import type { WindFieldData } from "@/src/features/wind/VectorField";

let _cachedApiBaseUrl: string | null = null;

function resolveHostFromExpo(): string | null {
  try {
    const { expo } = require("expo-constants");
    if (expo?.hostUri) {
      const hostname = expo.hostUri.split(":")[0];
      return `http://${hostname}:8000`;
    }
  } catch {
    return null;
  }
  return null;
}

const getApiBaseUrl = (): string => {
  if (_cachedApiBaseUrl) {
    return _cachedApiBaseUrl;
  }
  
  if (process.env.EXPO_PUBLIC_BATHYMETRY_API_URL) {
    _cachedApiBaseUrl = process.env.EXPO_PUBLIC_BATHYMETRY_API_URL;
    return _cachedApiBaseUrl;
  }
  
  const expoHostBase = resolveHostFromExpo();
  if (expoHostBase) {
    _cachedApiBaseUrl = expoHostBase;
    return _cachedApiBaseUrl;
  }

  try {
    if (Platform.OS === "ios") {
      _cachedApiBaseUrl = "http://127.0.0.1:8000";
      return _cachedApiBaseUrl;
    }
    if (Platform.OS === "android") {
      _cachedApiBaseUrl = "http://10.0.2.2:8000";
      return _cachedApiBaseUrl;
    }
  } catch (e) {
    logWarn("[WindService] Platform not available, using default localhost");
  }
  
  _cachedApiBaseUrl = "http://localhost:8000";
  return _cachedApiBaseUrl;
};

/**
 * Fetch wind vector field for a bounding box.
 */
export async function getWindField(
  west: number,
  south: number,
  east: number,
  north: number,
  nx: number = 32,
  ny: number = 32
): Promise<WindFieldData | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/v1/wind/field?west=${west}&south=${south}&east=${east}&north=${north}&nx=${nx}&ny=${ny}`;
    
    logDebug(`[WindService] Fetching wind field from: ${url}`);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logError(`[WindService] Wind field API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data: WindFieldData = await response.json();
    logDebug(`[WindService] Successfully fetched wind field: ${data.nx}x${data.ny} grid`);
    return data;
  } catch (error: any) {
    // Log all errors for debugging
    if (error.name === "AbortError") {
      logError(`[WindService] Request timeout after 10s - backend may be slow or unavailable`);
    } else if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      logError(`[WindService] Network error - cannot connect to backend at ${getApiBaseUrl()}`);
    } else {
      logError(`[WindService] Error fetching wind field:`, error.message || error);
    }
    return null;
  }
}

