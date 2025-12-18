/**
 * Zustand store for bathymetry data (depth + scores) with caching.
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DepthResponse, ScoreResponse, SpeciesKey, BathymetryCacheEntry, WeatherData } from "@/types/bathymetry";
import { getDepth, getScore, roundForCache } from "@/services/bathymetry-service";
import { logDebug, logError } from "@/lib/logger";

interface BathymetryState {
  // Cache: keyed by rounded lat/lon
  cache: Map<string, BathymetryCacheEntry>;
  
  // Current query state
  selectedCoord: { lat: number; lon: number } | null;
  depth: DepthResponse | null;
  scores: Record<SpeciesKey, ScoreResponse | null>;
  loading: boolean;
  error: string | null;
  
  // Actions
  setSelectedCoord: (coord: { lat: number; lon: number } | null) => void;
  queryDepth: (lat: number, lon: number) => Promise<void>;
  queryScore: (lat: number, lon: number, species: SpeciesKey, weather?: WeatherData) => Promise<void>;
  clearError: () => void;
  
  // Cache management
  loadCache: () => Promise<void>;
  saveCache: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const CACHE_KEY = "@bathymetry_cache";
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days - depth data doesn't change frequently

function getCacheKey(lat: number, lon: number): string {
  const rounded = roundForCache(lat, lon);
  return `${rounded.lat},${rounded.lon}`;
}

export const useBathymetryStore = create<BathymetryState>((set, get) => ({
  cache: new Map(),
  selectedCoord: null,
  depth: null,
  scores: {
    chipura: null,
    levrek: null,
    sargoz: null,
    karagoz: null,
    mirmir: null,
  },
  loading: false,
  error: null,

  setSelectedCoord: (coord) => {
    set({ selectedCoord: coord, error: null });
    
    if (coord) {
      // Check cache first - use cached data immediately if available (even if slightly stale)
      const key = getCacheKey(coord.lat, coord.lon);
      const cached = get().cache.get(key);
      
      if (cached) {
        // Always show cached data immediately if available (even if stale)
        set({
          depth: cached.depth,
          scores: cached.score,
        });
        
        // If cache is fresh, we're done. Otherwise, refresh in background
        const cacheAge = Date.now() - cached.timestamp;
        if (cacheAge < CACHE_MAX_AGE) {
          // Cache is fresh, no need to query
          return;
        } else {
          // Cache is stale, refresh in background (non-blocking)
          get().queryDepth(coord.lat, coord.lon).catch(() => {
            // Silent fail - we already have cached data displayed
          });
        }
      } else {
        // No cache, query new data
        get().queryDepth(coord.lat, coord.lon);
      }
    } else {
      set({
        depth: null,
        scores: {
          chipura: null,
          levrek: null,
          sargoz: null,
          karagoz: null,
          mirmir: null,
        },
      });
    }
  },

  queryDepth: async (lat, lon) => {
    const key = getCacheKey(lat, lon);
    
    set({ loading: true, error: null });

    try {
      const depth = await getDepth(lat, lon);
      
      // If we got mock data, don't show error (it's a fallback, not a real error)
      const isMockData = depth.source === "MOCK_DATA";
      
      // Update cache
      const cache = get().cache;
      const entry = cache.get(key) || {
        lat,
        lon,
        depth: null,
        score: {} as Record<SpeciesKey, ScoreResponse | null>,
        timestamp: Date.now(),
      };
      entry.depth = depth;
      entry.timestamp = Date.now();
      cache.set(key, entry);
      
      // Clear error if we got data (even if it's mock)
      set({ depth, cache: new Map(cache), loading: false, error: null });
      get().saveCache();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to query depth";
      logError("[BathymetryStore] queryDepth error:", errorMessage);

      // Try to use stale cache if available
      const cached = get().cache.get(key);
      if (cached?.depth) {
        logDebug("[BathymetryStore] Using cached depth data");
        set({ depth: cached.depth, loading: false, error: null });
      } else {
        // Only show error if we don't have any data
        set({ error: errorMessage, loading: false });
      }
    }
  },

  queryScore: async (lat, lon, species, weather) => {
    const key = getCacheKey(lat, lon);
    
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const score = await getScore(lat, lon, species, weather, currentTime);
      
      // Update cache
      const cache = get().cache;
      const entry = cache.get(key) || {
        lat,
        lon,
        depth: null,
        score: {} as Record<SpeciesKey, ScoreResponse | null>,
        timestamp: Date.now(),
      };
      entry.score[species] = score;
      entry.timestamp = Date.now();
      cache.set(key, entry);
      
      const scores = { ...get().scores, [species]: score };
      // Don't set error if we got mock data (it's a fallback, not a real error)
      set({ scores, cache: new Map(cache), error: null });
      get().saveCache();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to query score";
      logError("[BathymetryStore] queryScore error:", errorMessage);
      
      // Only set error if it's not a network error (mock data handles that)
      if (!errorMessage.includes("Network request failed") && !errorMessage.includes("Backend")) {
        set({ error: errorMessage });
      }
      
      // Try to use stale cache if available
      const cached = get().cache.get(key);
      if (cached?.score[species]) {
        logDebug("[BathymetryStore] Using cached score data");
        const scores = { ...get().scores, [species]: cached.score[species] };
        set({ scores });
      }
    }
  },


  clearError: () => set({ error: null }),

  loadCache: async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const cache = new Map<string, BathymetryCacheEntry>();
        
        // Filter out stale entries
        const now = Date.now();
        for (const [key, entry] of Object.entries(data)) {
          const entryTyped = entry as BathymetryCacheEntry;
          if (now - entryTyped.timestamp < CACHE_MAX_AGE) {
            cache.set(key, entryTyped);
          }
        }
        
        set({ cache });
      }
    } catch (error) {
      logError("[BathymetryStore] Failed to load bathymetry cache:", error);
    }
  },

  saveCache: async () => {
    try {
      const cache = get().cache;
      const data: Record<string, BathymetryCacheEntry> = {};
      for (const [key, entry] of cache.entries()) {
        data[key] = entry;
      }
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      logError("[BathymetryStore] Failed to save bathymetry cache:", error);
    }
  },

  clearCache: async () => {
    set({ cache: new Map() });
    await AsyncStorage.removeItem(CACHE_KEY);
  },
}));

