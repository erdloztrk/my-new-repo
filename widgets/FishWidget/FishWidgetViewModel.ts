/**
 * ViewModel hook for FishWidget.
 * Handles fishing score calculations and business logic.
 * This is a SECONDARY/OPTIONAL feature - should not dominate the UI.
 */

import { useMemo } from "react";
import type { CurrentWeather } from "@/components/weather/weatherTypes";
import { getSeaRegion } from "@/components/weather/fishingUtils";
import type { SeaRegion } from "@/components/weather/fishingUtils";
import type { ShoreType } from "@/components/weather/fishProfiles";
import {
  computeOverallScore,
  computeSpeciesScore,
  explainScore,
  type WeatherSnapshot,
  type FactorExplanation,
} from "@/utils/fishing/fishingScore";
import { MARMARA_CORE_PROFILES } from "@/components/weather/fishProfiles";

// Target species for micro scores - Kıyı avcılığı türleri
const TARGET_SPECIES = ["seabass"];

interface FishWidgetViewModelOptions {
  weather: CurrentWeather | null;
  coordinates?: { latitude: number; longitude: number };
  cityName?: string;
  provinceName?: string;
}

interface FishWidgetViewModelResult {
  overallScore: number | null;
  speciesScores: Array<{
    id: string;
    score: number;
    trName: string;
    latinShort: string;
  }>;
  factorExplanations: FactorExplanation[];
  seaRegion: SeaRegion | null;
  snapshot: WeatherSnapshot | null;
  isValid: boolean;
}

export function useFishWidgetViewModel({
  weather,
  coordinates,
  cityName,
  provinceName,
}: FishWidgetViewModelOptions): FishWidgetViewModelResult {
  // Compute sea region and shore type
  const seaRegion: SeaRegion | null = useMemo(() => {
    if (!coordinates) return null;
    return getSeaRegion(coordinates.latitude, coordinates.longitude);
  }, [coordinates]);

  // Infer shore type (simplified - could be enhanced with location data)
  const shoreType: ShoreType = useMemo(() => {
    // Default to "unknown" - can be enhanced with reverse geocoding data
    return "unknown";
  }, []);

  // Create weather snapshot
  const snapshot: WeatherSnapshot | null = useMemo(() => {
    if (!weather) return null;

    return {
      airTempC: weather.temp,
      seaTempC: weather.seaTemperature ?? undefined,
      windKmh: Math.round(weather.wind_speed * 3.6),
      waveM: weather.waveHeight ?? undefined,
      pressureHpa: weather.pressure ?? undefined,
      cloudiness: undefined, // Not available in CurrentWeather
    };
  }, [weather]);

  // Compute overall score
  const overallScore = useMemo(() => {
    if (!snapshot || !weather) return null;
    return computeOverallScore(snapshot, seaRegion, shoreType, weather, coordinates, provinceName);
  }, [snapshot, seaRegion, shoreType, weather, coordinates, provinceName]);

  // Compute species scores
  const speciesScores = useMemo(() => {
    if (!snapshot || !weather) return [];

    return TARGET_SPECIES.map((speciesId) => {
      const profile = MARMARA_CORE_PROFILES.find((p) => p.id === speciesId);
      if (!profile) return null;

      const score = computeSpeciesScore(
        snapshot,
        speciesId,
        seaRegion,
        shoreType,
        weather,
        coordinates
      );

      return {
        id: speciesId,
        score: score.score,
        trName: profile.trName,
        latinShort: profile.latinShort,
      };
    }).filter((s): s is NonNullable<typeof s> => s !== null);
  }, [snapshot, seaRegion, shoreType, weather, coordinates]);

  // Get factor explanations for first species
  const factorExplanations = useMemo(() => {
    if (!snapshot || !weather) {
      return [];
    }
    const targetSpecies = speciesScores[0]?.id || "";
    try {
      return explainScore(snapshot, targetSpecies, seaRegion, shoreType, weather, coordinates);
    } catch (error) {
      console.error("[FishWidget] Error computing factorExplanations:", error);
      return [];
    }
  }, [snapshot, weather, speciesScores, seaRegion, shoreType, coordinates]);

  const isValid = !!(weather && snapshot && overallScore);

  return {
    overallScore: overallScore?.score ?? null,
    speciesScores,
    factorExplanations,
    seaRegion,
    snapshot,
    isValid,
  };
}

