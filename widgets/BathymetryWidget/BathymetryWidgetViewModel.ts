/**
 * ViewModel hook for BathymetryWidget.
 * Handles depth and species score queries.
 * This is a SECONDARY/OPTIONAL feature - should not dominate the UI.
 */

import { useEffect, useRef } from "react";
import { useBathymetryStore } from "@/stores/bathymetry-store";
import type { SpeciesKey, WeatherData } from "@/types/bathymetry";
import type { CurrentWeather } from "@/components/weather/weatherTypes";

interface BathymetryWidgetViewModelOptions {
  selectedCoord: { lat: number; lon: number } | null;
  weather: CurrentWeather | null;
}

interface BathymetryWidgetViewModelResult {
  depth: number | null; // depth_m in meters
  scores: Record<SpeciesKey, number | null>; // Simplified scores
  loading: boolean;
  error: string | null;
  isValid: boolean;
}

export function useBathymetryWidgetViewModel({
  selectedCoord,
  weather,
}: BathymetryWidgetViewModelOptions): BathymetryWidgetViewModelResult {
  const {
    depth,
    scores,
    loading,
    error,
    queryScore,
    setSelectedCoord,
  } = useBathymetryStore();

  // Track which coord+weather combination we've fetched scores for
  const fetchedKeyRef = useRef<string | null>(null);

  // Set selected coord when it changes
  useEffect(() => {
    if (selectedCoord) {
      setSelectedCoord(selectedCoord);
    }
  }, [selectedCoord, setSelectedCoord]);

  // Load all species scores when depth is available
  useEffect(() => {
    if (selectedCoord && depth && !loading && weather) {
      // Create a unique key for this coord+weather combination
      const fetchKey = `${selectedCoord.lat.toFixed(6)},${selectedCoord.lon.toFixed(6)},${weather.wind_speed?.toFixed(1) || '0'}`;
      
      // Only fetch if this is a new combination
      if (fetchedKeyRef.current !== fetchKey) {
        fetchedKeyRef.current = fetchKey;
        
        // Convert CurrentWeather to WeatherData format
        const weatherData: WeatherData = {
          seaTemperature: weather.seaTemperature,
          windSpeed: weather.wind_speed,
          waveHeight: weather.waveHeight,
          pressure: weather.pressure,
          uvi: weather.uvi,
        };
        
        const speciesList: SpeciesKey[] = ["chipura", "levrek", "sargoz", "karagoz", "mirmir"];
        const currentScores = scores; // Capture at fetch time
        speciesList.forEach((species) => {
          // Only fetch if score doesn't exist
          if (!currentScores[species]) {
            queryScore(selectedCoord.lat, selectedCoord.lon, species, weatherData);
          }
        });
      }
    }
  }, [selectedCoord?.lat, selectedCoord?.lon, depth?.depth_m, loading, queryScore, weather?.wind_speed, scores]);

  // Simplify scores to just numbers
  const simplifiedScores: Record<SpeciesKey, number | null> = {
    chipura: scores.chipura?.score ?? null,
    levrek: scores.levrek?.score ?? null,
    sargoz: scores.sargoz?.score ?? null,
    karagoz: scores.karagoz?.score ?? null,
    mirmir: scores.mirmir?.score ?? null,
  };

  const isValid = !!(selectedCoord && depth);

  return {
    depth: depth?.depth_m ?? null,
    scores: simplifiedScores,
    loading,
    error,
    isValid,
  };
}

