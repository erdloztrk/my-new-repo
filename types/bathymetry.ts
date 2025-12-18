/**
 * TypeScript types for bathymetry API.
 */

export type SpeciesKey = "chipura" | "levrek" | "sargoz" | "karagoz" | "mirmir";

export interface DepthDataPoint {
  depth_m: number;
  source: string;
  resolution_m: number;
}

export interface DepthResponse {
  depth_m: number; // Primary depth
  source: string; // Primary source
  resolution_m: number; // Primary resolution
  source_used?: string; // "emodnet", "gebco"
  confidence?: number; // 0..1
  emodnet?: DepthDataPoint; // EMODnet data if available
  gebco?: DepthDataPoint; // GEBCO data if available
  not_for_navigation: boolean; // Safety warning
}

export interface ScoreReason {
  type: string;
  message: string;
}

export interface WeatherData {
  seaTemperature?: number;
  windSpeed?: number;
  waveHeight?: number;
  pressure?: number;
  uvi?: number;
}

export interface ScoreResponse {
  depth_m: number;
  score_0_100: number;
  zone_label: "shallow" | "optimal" | "deep" | "land";
  reasons: ScoreReason[];
  species: string;
  depth_score?: number;
  weather_score?: number;
  time_score?: number;
}


export interface BathymetrySourceInfo {
  name: string;
  available: boolean;
  resolution_m?: number;
  bbox?: number[]; // [min_lon, min_lat, max_lon, max_lat]
}

export interface SourcesResponse {
  sources: Record<string, BathymetrySourceInfo>;
}

export type DepthMode = "auto" | "emodnet" | "gebco";

export interface BathymetryCacheEntry {
  lat: number;
  lon: number;
  depth: DepthResponse | null;
  score: Record<SpeciesKey, ScoreResponse | null>;
  timestamp: number;
}

