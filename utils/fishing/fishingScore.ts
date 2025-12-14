import type { CurrentWeather } from "@/components/weather/weatherTypes";
import { scoreFishingNow, type FishRecommendation } from "@/components/weather/fishScoring";
import { getSeaRegion } from "@/components/weather/fishingUtils";
import type { SeaRegion } from "@/components/weather/fishingUtils";
import type { ShoreType } from "@/components/weather/fishProfiles";

/**
 * Weather snapshot for fishing score computation
 */
export interface WeatherSnapshot {
  airTempC: number;
  seaTempC?: number; // Optional - may be missing
  windKmh: number;
  waveM?: number; // Optional - may be missing
  pressureHpa?: number; // Optional
  cloudiness?: number; // Optional (0-100)
}

/**
 * Factor explanation for score breakdown
 */
export interface FactorExplanation {
  key: string; // e.g., "wave", "wind", "sst", "pressure"
  labelKey: string; // i18n key for label
  value: string; // Display value (e.g., "0.2m", "15 km/h")
  impact: number; // Impact on score (-5 to +5)
  noteKey?: string; // Optional i18n key for additional note
}

/**
 * Species score result
 */
export interface SpeciesScore {
  id: string;
  trName: string;
  latinShort: string;
  score: number; // 0-10, one decimal
  color: string;
}

/**
 * Overall fishing score result
 */
export interface OverallScore {
  score: number; // 0-10, one decimal
  label: string; // "Kötü", "Orta", "İyi", "Çok İyi"
  color: string;
  summary: string; // One-line summary from top 2 impacts
}

/**
 * Compute species-specific score (0-10, one decimal)
 */
export function computeSpeciesScore(
  snapshot: WeatherSnapshot,
  speciesId: string,
  seaRegion: SeaRegion | null,
  shoreType: ShoreType,
  weather: CurrentWeather,
  coordinates?: { latitude: number; longitude: number }
): SpeciesScore {
  const now = new Date();
  const waveHeightM = snapshot.waveM ?? null;
  const seaTempC = snapshot.seaTempC ?? null;

  const input = {
    coords: coordinates,
    seaRegion,
    shoreType,
    now,
    weather,
    waveHeightM,
    seaTempC,
    windSpeedKmh: snapshot.windKmh,
  };

  // Use existing scoring logic
  const results = scoreFishingNow(input);
  const speciesResult = results.find((r) => r.id === speciesId);

  if (!speciesResult) {
    // Species not found in results, return neutral score
    return {
      id: speciesId,
      trName: "Bilinmiyor",
      latinShort: "",
      score: 5.0,
      color: "#F59E0B",
    };
  }

  return {
    id: speciesResult.id,
    trName: speciesResult.trName,
    latinShort: speciesResult.latinShort,
    score: speciesResult.score,
    color: speciesResult.color,
  };
}

/**
 * Compute overall fishing score (0-10, one decimal)
 * Based on average of top 3 species scores
 */
export function computeOverallScore(
  snapshot: WeatherSnapshot,
  seaRegion: SeaRegion | null,
  shoreType: ShoreType,
  weather: CurrentWeather,
  coordinates?: { latitude: number; longitude: number },
  provinceName?: string
): OverallScore {
  const now = new Date();
  const waveHeightM = snapshot.waveM ?? null;
  const seaTempC = snapshot.seaTempC ?? null;

  const input = {
    coords: coordinates,
    seaRegion,
    shoreType,
    now,
    weather,
    waveHeightM,
    seaTempC,
    windSpeedKmh: snapshot.windKmh,
  };

  // Get top 5 species recommendations
  const results = scoreFishingNow(input, undefined, provinceName);
  const top3 = results.slice(0, 3);

  if (top3.length === 0) {
    return {
      score: 5.0,
      label: "Orta",
      color: "#F59E0B",
      summary: "Veri yetersiz",
    };
  }

  // Average of top 3 species
  const avgScore = top3.reduce((sum, r) => sum + r.score, 0) / top3.length;
  const score = Math.round(avgScore * 10) / 10;

  // Determine label and color
  let label: string;
  let color: string;
  if (score >= 8) {
    label = "Çok İyi";
    color = "#10B981"; // green
  } else if (score >= 6) {
    label = "İyi";
    color = "#3B82F6"; // blue
  } else if (score >= 4) {
    label = "Orta";
    color = "#F59E0B"; // amber
  } else {
    label = "Kötü";
    color = "#EF4444"; // red
  }

  // Generate summary from top 2 impacts
  const factors = explainScore(snapshot, top3[0]?.id || "", seaRegion, shoreType, weather, coordinates);
  const top2Impacts = factors
    .filter((f) => Math.abs(f.impact) > 0.5)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 2);

  let summary = "";
  if (top2Impacts.length > 0) {
    const parts = top2Impacts.map((f) => {
      if (f.key === "wave") return `Dalga: ${f.value}`;
      if (f.key === "wind") return `Rüzgar: ${f.value}`;
      if (f.key === "sst") return `Deniz: ${f.value}`;
      if (f.key === "pressure") return `Basınç: ${f.value}`;
      return f.value;
    });
    summary = parts.join(" · ");
  } else {
    summary = "Genel koşullar değerlendiriliyor";
  }

  return {
    score,
    label,
    color,
    summary,
  };
}

/**
 * Explain score breakdown for a species
 * Returns list of factors with their impact
 */
export function explainScore(
  snapshot: WeatherSnapshot,
  speciesId: string,
  seaRegion: SeaRegion | null,
  shoreType: ShoreType,
  weather: CurrentWeather,
  coordinates?: { latitude: number; longitude: number }
): FactorExplanation[] {
  // Always return factors, even if some data is missing
  const factors: FactorExplanation[] = [];
  
  // Validate snapshot
  if (!snapshot) {
    console.warn("[explainScore] snapshot is null or undefined");
    return factors;
  }

  // Wave factor
  if (snapshot.waveM !== undefined && snapshot.waveM !== null) {
    const waveValue = snapshot.waveM;
    let impact = 0;
    let noteKey: string | undefined;

    // Ideal wave: 0.3-0.8m
    if (waveValue <= 0.8) {
      impact = 1.5;
      noteKey = "fishing.factor.wave.calm";
    } else if (waveValue <= 1.2) {
      impact = 0;
      noteKey = "fishing.factor.wave.moderate";
    } else if (waveValue <= 2.0) {
      impact = -1.5;
      noteKey = "fishing.factor.wave.high";
    } else {
      impact = -3.0;
      noteKey = "fishing.factor.wave.very_high";
    }

    factors.push({
      key: "wave",
      labelKey: "fishing.factor.wave",
      value: `${waveValue.toFixed(1)}m`,
      impact,
      noteKey,
    });
  } else {
    factors.push({
      key: "wave",
      labelKey: "fishing.factor.wave",
      value: "N/A",
      impact: 0,
      noteKey: "fishing.factor.wave.no_data",
    });
  }

  // Wind factor (always present)
  const windValue = snapshot.windKmh ?? 0;
  let windImpact = 0;
  let windNoteKey: string | undefined;

  // Ideal wind: 10-25 km/h
  if (windValue <= 25) {
    windImpact = 1.0;
    windNoteKey = "fishing.factor.wind.calm";
  } else if (windValue <= 40) {
    windImpact = -0.5;
    windNoteKey = "fishing.factor.wind.moderate";
  } else if (windValue <= 60) {
    windImpact = -2.0;
    windNoteKey = "fishing.factor.wind.strong";
  } else {
    windImpact = -4.0;
    windNoteKey = "fishing.factor.wind.very_strong";
  }

  factors.push({
    key: "wind",
    labelKey: "fishing.factor.wind",
    value: `${Math.round(windValue)} km/h`,
    impact: windImpact,
    noteKey: windNoteKey,
  });

  // Sea temperature factor
  if (snapshot.seaTempC !== undefined && snapshot.seaTempC !== null) {
    const sstValue = snapshot.seaTempC;
    let sstImpact = 0;
    let sstNoteKey: string | undefined;

    // Ideal SST: 14-22°C (varies by species, but general range)
    if (sstValue >= 14 && sstValue <= 22) {
      sstImpact = 1.5;
      sstNoteKey = "fishing.factor.sst.ideal";
    } else if (sstValue >= 10 && sstValue <= 26) {
      sstImpact = 0;
      sstNoteKey = "fishing.factor.sst.acceptable";
    } else if (sstValue < 10) {
      sstImpact = -1.5;
      sstNoteKey = "fishing.factor.sst.cold";
    } else {
      sstImpact = -1.0;
      sstNoteKey = "fishing.factor.sst.warm";
    }

    factors.push({
      key: "sst",
      labelKey: "fishing.factor.sst",
      value: `${Math.round(sstValue)}°C`,
      impact: sstImpact,
      noteKey: sstNoteKey,
    });
  } else {
    factors.push({
      key: "sst",
      labelKey: "fishing.factor.sst",
      value: "N/A",
      impact: 0,
      noteKey: "fishing.factor.sst.no_data",
    });
  }

  // Pressure factor (optional)
  if (snapshot.pressureHpa !== undefined && snapshot.pressureHpa !== null) {
    const pressureValue = snapshot.pressureHpa;
    let pressureImpact = 0;
    let pressureNoteKey: string | undefined;

    // Ideal pressure: 1010-1020 hPa
    if (pressureValue >= 1010 && pressureValue <= 1020) {
      pressureImpact = 0.5;
      pressureNoteKey = "fishing.factor.pressure.stable";
    } else if (pressureValue >= 1000 && pressureValue <= 1030) {
      pressureImpact = 0;
      pressureNoteKey = "fishing.factor.pressure.normal";
    } else if (pressureValue < 1000) {
      pressureImpact = -1.0;
      pressureNoteKey = "fishing.factor.pressure.low";
    } else {
      pressureImpact = -0.5;
      pressureNoteKey = "fishing.factor.pressure.high";
    }

    factors.push({
      key: "pressure",
      labelKey: "fishing.factor.pressure",
      value: `${Math.round(pressureValue)} hPa`,
      impact: pressureImpact,
      noteKey: pressureNoteKey,
    });
  }

  return factors;
}

