/**
 * Zustand store for bathymetry data (depth + scores) with caching.
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DepthResponse, ScoreResponse, SpeciesKey, BathymetryCacheEntry, WeatherData, ContourLine } from "@/types/bathymetry";
import { getDepth, getScore, getContours, roundForCache } from "@/services/bathymetry-service";

interface BathymetryState {
  // Cache: keyed by rounded lat/lon
  cache: Map<string, BathymetryCacheEntry>;
  
  // Current query state
  selectedCoord: { lat: number; lon: number } | null;
  depth: DepthResponse | null;
  scores: Record<SpeciesKey, ScoreResponse | null>;
  loading: boolean;
  error: string | null;
  
  // Contour lines
  contours: ContourLine[];
  loadingContours: boolean;
  
  // Actions
  setSelectedCoord: (coord: { lat: number; lon: number } | null) => void;
  queryDepth: (lat: number, lon: number) => Promise<void>;
  queryScore: (lat: number, lon: number, species: SpeciesKey, weather?: WeatherData) => Promise<void>;
  queryContours: (minLat: number, maxLat: number, minLon: number, maxLon: number) => Promise<void>;
  clearError: () => void;
  
  // Cache management
  loadCache: () => Promise<void>;
  saveCache: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const CACHE_KEY = "@bathymetry_cache";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(lat: number, lon: number): string {
  const rounded = roundForCache(lat, lon);
  return `${rounded.lat},${rounded.lon}`;
}

export const useBathymetryStore = create<BathymetryState>((set, get) => ({
  cache: new Map(),
  selectedCoord: null,
  depth: null,
  scores: {},
  loading: false,
  error: null,
  contours: [],
  loadingContours: false,

  setSelectedCoord: (coord) => {
    set({ selectedCoord: coord, error: null });
    
    if (coord) {
      // Check cache first
      const key = getCacheKey(coord.lat, coord.lon);
      const cached = get().cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < CACHE_MAX_AGE) {
        // Use cached data
        set({
          depth: cached.depth,
          scores: cached.score,
        });
      } else {
        // Query new data
        get().queryDepth(coord.lat, coord.lon);
      }
    } else {
      set({ depth: null, scores: {} });
    }
  },

  queryDepth: async (lat, lon) => {
    const key = getCacheKey(lat, lon);
    
    set({ loading: true, error: null });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2f8b3f43-cf07-4027-b869-304f9e7401b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bathymetry-store.tsx:queryDepth:entry',message:'queryDepth called',data:{lat,lon,key},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    try {
      const depth = await getDepth(lat, lon);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2f8b3f43-cf07-4027-b869-304f9e7401b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bathymetry-store.tsx:queryDepth:success',message:'getDepth returned',data:{depth_m:depth.depth_m,source:depth.source,isMock:depth.source==='MOCK_DATA'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
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
      console.error("[BathymetryStore] queryDepth error:", errorMessage);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2f8b3f43-cf07-4027-b869-304f9e7401b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'bathymetry-store.tsx:queryDepth:error',message:'Error in queryDepth',data:{error:errorMessage,lat,lon,hasCache:!!get().cache.get(key)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Try to use stale cache if available
      const cached = get().cache.get(key);
      if (cached?.depth) {
        console.log("[BathymetryStore] Using cached depth data");
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
      console.error("[BathymetryStore] queryScore error:", errorMessage);
      
      // Only set error if it's not a network error (mock data handles that)
      if (!errorMessage.includes("Network request failed") && !errorMessage.includes("Backend")) {
        set({ error: errorMessage });
      }
      
      // Try to use stale cache if available
      const cached = get().cache.get(key);
      if (cached?.score[species]) {
        console.log("[BathymetryStore] Using cached score data");
        const scores = { ...get().scores, [species]: cached.score[species] };
        set({ scores });
      }
    }
  },

  queryContours: async (minLat, maxLat, minLon, maxLon) => {
    set({ loadingContours: true });
    
    try {
      const response = await getContours(minLat, maxLat, minLon, maxLon);
      set({ contours: response.contours, loadingContours: false });
    } catch (error) {
      console.error("[BathymetryStore] Error fetching contours:", error);
      set({ loadingContours: false });
      // Don't set error for contours - it's optional
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
      console.error("Failed to load bathymetry cache:", error);
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
      console.error("Failed to save bathymetry cache:", error);
    }
  },

  clearCache: () => {
    set({ cache: new Map() });
    AsyncStorage.removeItem(CACHE_KEY);
  },
}));

