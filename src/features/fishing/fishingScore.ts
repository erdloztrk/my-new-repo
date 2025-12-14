/**
 * Fishing Activity Scoring Engine
 * 
 * Pure TypeScript module for computing fishing activity scores based on weather conditions.
 * No UI dependencies - can be used in Node.js, React Native, or web environments.
 * 
 * @module fishingScore
 */

// ============================================================================
// Types
// ============================================================================

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
 * Sea region type
 */
export type SeaRegion = "Marmara" | "Ege" | "Akdeniz" | "Karadeniz" | "Unknown";

/**
 * Shore type
 */
export type ShoreType = "beach" | "rocky" | "pier" | "unknown";

/**
 * Fish profile with environmental preferences
 */
export interface FishProfile {
  id: string;
  trName: string;
  latinShort: string;
  latinFull: string;
  primaryRegions: SeaRegion[];
  seasonMonths: number[]; // 1-12
  activity: {
    dawnWeight: number; // 0..1
    duskWeight: number; // 0..1
    dayWeight: number; // 0..1
    nightWeight: number; // 0..1
  };
  sstPreferred?: { min: number; max: number }; // °C
  wavePreferred?: { max: number }; // meters
  windPreferred?: { maxKmh: number }; // km/h
  shorePreference: Partial<Record<ShoreType, number>>; // 0..1
}

/**
 * Time-based weather data (sunrise/sunset timestamps)
 */
export interface TimeWeatherData {
  sunrise: number; // Unix timestamp (seconds)
  sunset: number; // Unix timestamp (seconds)
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

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clamp a number between min and max
 */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Get score color based on 0-10 score
 */
function getScoreColor(score0to10: number): string {
  if (score0to10 >= 8) return "#10B981"; // green-500
  if (score0to10 >= 6) return "#3B82F6"; // blue-500
  if (score0to10 >= 4) return "#F59E0B"; // amber-500
  return "#EF4444"; // red-500
}

/**
 * Calculate minutes between two dates
 */
function minutesBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

/**
 * Calculate proximity score based on time difference
 */
function proximityScoreMinutes(deltaMinAbs: number, goodWithin: number, fadeOutAt: number): number {
  if (deltaMinAbs <= goodWithin) return 1;
  if (deltaMinAbs >= fadeOutAt) return 0;
  const t = (deltaMinAbs - goodWithin) / (fadeOutAt - goodWithin);
  return 1 - t;
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate activity score based on time of day and fish profile
 */
function calculateActivityScore(
  profile: FishProfile,
  now: Date,
  sunrise: Date,
  sunset: Date
): number {
  const dawnDeltaAbs = Math.abs(minutesBetween(now, sunrise));
  const duskDeltaAbs = Math.abs(minutesBetween(now, sunset));
  const isDay = now >= sunrise && now <= sunset;

  const dawnProx = proximityScoreMinutes(dawnDeltaAbs, 30, 120);
  const duskProx = proximityScoreMinutes(duskDeltaAbs, 30, 120);

  let s = 0;
  s += profile.activity.dawnWeight * dawnProx;
  s += profile.activity.duskWeight * duskProx;
  s += profile.activity.dayWeight * (isDay ? 1 : 0);
  s += profile.activity.nightWeight * (!isDay ? 1 : 0);

  const max = profile.activity.dawnWeight + profile.activity.duskWeight + 
              profile.activity.dayWeight + profile.activity.nightWeight;
  return max > 0 ? clamp(s / max, 0, 1) : 0;
}

/**
 * Calculate season and region score
 */
function calculateSeasonRegionScore(
  profile: FishProfile,
  seaRegion: SeaRegion | null,
  month: number
): number {
  let s = 0;

  if (seaRegion && profile.primaryRegions.includes(seaRegion)) {
    s += 0.6;
  }

  if (profile.seasonMonths.includes(month)) {
    s += 0.4;
  }

  return clamp(s, 0, 1);
}

/**
 * Calculate sea surface temperature score
 */
function calculateSSTScore(
  profile: FishProfile,
  seaTempC: number | null
): number {
  if (seaTempC === null || !profile.sstPreferred) {
    return 0.5; // neutral if no data
  }

  const { min, max } = profile.sstPreferred;
  if (seaTempC >= min && seaTempC <= max) {
    return 1.0;
  }

  const dist = seaTempC < min ? min - seaTempC : seaTempC - max;
  return clamp(1 - dist / 6, 0, 1);
}

/**
 * Calculate sea state score (wave + wind)
 */
function calculateSeaStateScore(
  profile: FishProfile,
  waveHeightM: number | null,
  windSpeedKmh: number
): number {
  let s = 1.0;

  if (waveHeightM !== null && profile.wavePreferred) {
    const maxWave = profile.wavePreferred.max;
    if (waveHeightM > maxWave) {
      const over = waveHeightM - maxWave;
      s *= clamp(1 - over / 1.5, 0, 1);
    }
  }

  if (profile.windPreferred) {
    if (windSpeedKmh > profile.windPreferred.maxKmh) {
      const over = windSpeedKmh - profile.windPreferred.maxKmh;
      s *= clamp(1 - over / 40, 0, 1);
    }
  }

  return clamp(s, 0, 1);
}

/**
 * Calculate shore type score
 */
function calculateShoreTypeScore(
  profile: FishProfile,
  shoreType: ShoreType
): number {
  if (shoreType === "unknown") {
    return 0.5; // neutral
  }
  return profile.shorePreference[shoreType] ?? 0.5;
}

/**
 * Compute species-specific score (0-10, one decimal)
 * 
 * @param snapshot - Weather conditions snapshot
 * @param profile - Fish species profile
 * @param seaRegion - Sea region (Marmara, Ege, etc.)
 * @param shoreType - Shore type (beach, rocky, pier, unknown)
 * @param timeWeather - Time-based weather data (sunrise/sunset)
 * @param now - Current time (defaults to now)
 * @returns Species score with metadata
 */
export function computeSpeciesScore(
  snapshot: WeatherSnapshot,
  profile: FishProfile,
  seaRegion: SeaRegion | null,
  shoreType: ShoreType,
  timeWeather: TimeWeatherData,
  now: Date = new Date()
): SpeciesScore {
  const month = now.getMonth() + 1;
  const sunrise = new Date(timeWeather.sunrise * 1000);
  const sunset = new Date(timeWeather.sunset * 1000);
  
  const waveHeightM = snapshot.waveM ?? null;
  const seaTempC = snapshot.seaTempC ?? null;

  // Calculate component scores (0..1)
  const seasonScore = calculateSeasonRegionScore(profile, seaRegion, month);
  const activityScore = calculateActivityScore(profile, now, sunrise, sunset);
  const seaStateScore = calculateSeaStateScore(profile, waveHeightM, snapshot.windKmh);
  const sstScore = calculateSSTScore(profile, seaTempC);
  const shoreScore = calculateShoreTypeScore(profile, shoreType);

  // Weighted combination (weights sum to 10 points)
  const score0to10 =
    2.5 * seasonScore +
    3.5 * activityScore +
    2.0 * seaStateScore +
    1.5 * sstScore +
    0.5 * shoreScore;

  const score = Math.round(clamp(score0to10, 0, 10) * 10) / 10;

  return {
    id: profile.id,
    trName: profile.trName,
    latinShort: profile.latinShort,
    score,
    color: getScoreColor(score),
  };
}

/**
 * Compute overall fishing score (0-10, one decimal)
 * Based on average of top 3 species scores
 * 
 * @param snapshot - Weather conditions snapshot
 * @param profiles - Array of fish species profiles to evaluate
 * @param seaRegion - Sea region
 * @param shoreType - Shore type
 * @param timeWeather - Time-based weather data
 * @param now - Current time (defaults to now)
 * @returns Overall score with label, color, and summary
 */
export function computeOverallScore(
  snapshot: WeatherSnapshot,
  profiles: FishProfile[],
  seaRegion: SeaRegion | null,
  shoreType: ShoreType,
  timeWeather: TimeWeatherData,
  now: Date = new Date()
): OverallScore {
  // Score all profiles
  const scored = profiles.map((profile) =>
    computeSpeciesScore(snapshot, profile, seaRegion, shoreType, timeWeather, now)
  );

  // Sort by score and take top 3
  const sorted = scored.sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);

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
  const factors = explainScore(snapshot, undefined, seaRegion, shoreType);
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
 * 
 * @param snapshot - Weather conditions snapshot
 * @param profile - Fish species profile (optional, for future species-specific explanations)
 * @param seaRegion - Sea region
 * @param shoreType - Shore type
 * @returns Array of factor explanations
 */
export function explainScore(
  snapshot: WeatherSnapshot,
  profile?: FishProfile,
  seaRegion?: SeaRegion | null,
  shoreType?: ShoreType
): FactorExplanation[] {
  const factors: FactorExplanation[] = [];

  if (!snapshot) {
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

