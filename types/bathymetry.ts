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
  depth_m: number; // Primary depth (EMODnet > Copernicus > GEBCO priority)
  source: string; // Primary source
  resolution_m: number; // Primary resolution
  emodnet?: DepthDataPoint; // EMODnet data if available
  gebco?: DepthDataPoint; // GEBCO data if available
  copernicus?: DepthDataPoint; // Copernicus data if available
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

export interface ContourLine {
  interval: number;
  coordinates: Array<[number, number]>; // [lat, lon]
}

export interface ContourResponse {
  contours: ContourLine[];
}

export interface BathymetryCacheEntry {
  lat: number;
  lon: number;
  depth: DepthResponse | null;
  score: Record<SpeciesKey, ScoreResponse | null>;
  timestamp: number;
}

