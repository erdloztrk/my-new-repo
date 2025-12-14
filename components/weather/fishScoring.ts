import type { CurrentWeather } from "./weatherTypes";
import type { SeaRegion } from "./fishingUtils";
import type { FishProfile, ShoreType } from "./fishProfiles";
import { MARMARA_CORE_PROFILES } from "./fishProfiles";

export interface FishRecommendation {
  id: string;
  trName: string;
  latinShort: string;
  score: number; // 0..10 (one decimal)
  color: string; // hex
  reasons: string[];
  confidence: number; // 0..100
}

export interface ScoreFishingNowInput {
  coords?: { latitude: number; longitude: number };
  seaRegion: SeaRegion | null;
  shoreType: ShoreType;
  now: Date;
  weather: CurrentWeather;
  waveHeightM: number | null;
  seaTempC: number | null;
  windSpeedKmh: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreColor(score0to10: number): string {
  if (score0to10 >= 8) return "#10B981"; // green-500
  if (score0to10 >= 5) return "#F59E0B"; // amber-500
  return "#EF4444"; // red-500
}

function minutesBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

function proximityScoreMinutes(deltaMinAbs: number, goodWithin: number, fadeOutAt: number): number {
  if (deltaMinAbs <= goodWithin) return 1;
  if (deltaMinAbs >= fadeOutAt) return 0;
  const t = (deltaMinAbs - goodWithin) / (fadeOutAt - goodWithin);
  return 1 - t;
}

function activityScore(profile: FishProfile, now: Date, sunrise: Date, sunset: Date): { score01: number; reasons: string[] } {
  const reasons: string[] = [];

  // Define windows
  const dawnDeltaAbs = Math.abs(minutesBetween(now, sunrise));
  const duskDeltaAbs = Math.abs(minutesBetween(now, sunset));
  const isDay = now >= sunrise && now <= sunset;

  // Weighted proximity around sunrise/sunset
  const dawnProx = proximityScoreMinutes(dawnDeltaAbs, 30, 120);
  const duskProx = proximityScoreMinutes(duskDeltaAbs, 30, 120);

  let s = 0;
  s += profile.activity.dawnWeight * dawnProx;
  s += profile.activity.duskWeight * duskProx;
  s += profile.activity.dayWeight * (isDay ? 1 : 0);
  s += profile.activity.nightWeight * (!isDay ? 1 : 0);

  // Normalize to 0..1 (max possible is sum of weights)
  const max = profile.activity.dawnWeight + profile.activity.duskWeight + profile.activity.dayWeight + profile.activity.nightWeight;
  const score01 = max > 0 ? clamp(s / max, 0, 1) : 0;

  const nearest = dawnDeltaAbs < duskDeltaAbs ? "Gün doğumu" : "Gün batımı";
  const nearestMin = Math.min(dawnDeltaAbs, duskDeltaAbs);
  if (nearestMin <= 120) reasons.push(`${nearest} yakın (${nearestMin} dk)`);
  else reasons.push(isDay ? "Gündüz zamanı" : "Gece zamanı");

  return { score01, reasons };
}

function seasonRegionScore(profile: FishProfile, seaRegion: SeaRegion | null, month: number): { score01: number; reasons: string[] } {
  const reasons: string[] = [];
  let s = 0;

  if (seaRegion && profile.primaryRegions.includes(seaRegion)) {
    s += 0.6;
    reasons.push(`${seaRegion} için uygun tür`);
  } else {
    reasons.push("Bölge eşleşmesi düşük");
  }

  if (profile.seasonMonths.includes(month)) {
    s += 0.4;
    reasons.push("Mevsim uygun");
  } else {
    reasons.push("Mevsim dışı olabilir");
  }

  return { score01: clamp(s, 0, 1), reasons };
}

function sstScore(profile: FishProfile, seaTempC: number | null): { score01: number; reasons: string[]; hasData: boolean } {
  const reasons: string[] = [];
  if (seaTempC === null || !profile.sstPreferred) {
    reasons.push("Deniz suyu sıcaklığı yok");
    return { score01: 0.5, reasons, hasData: false }; // neutral
  }

  const { min, max } = profile.sstPreferred;
  if (seaTempC >= min && seaTempC <= max) {
    reasons.push(`SST uygun (${seaTempC.toFixed(1)}°C)`);
    return { score01: 1, reasons, hasData: true };
  }

  const dist = seaTempC < min ? min - seaTempC : seaTempC - max;
  // fade to 0 at 6°C away
  const score01 = clamp(1 - dist / 6, 0, 1);
  reasons.push(`SST sınırda (${seaTempC.toFixed(1)}°C)`);
  return { score01, reasons, hasData: true };
}

function seaStateScore(profile: FishProfile, waveHeightM: number | null, windSpeedKmh: number): { score01: number; reasons: string[]; hasWave: boolean } {
  const reasons: string[] = [];
  let s = 1;

  const hasWave = waveHeightM !== null && profile.wavePreferred !== undefined;
  if (!hasWave) {
    reasons.push("Dalga verisi yok");
  } else {
    const maxWave = profile.wavePreferred!.max;
    if (waveHeightM! <= maxWave) {
      reasons.push(`Dalga uygun (${waveHeightM!.toFixed(1)}m)`);
    } else {
      const over = waveHeightM! - maxWave;
      s *= clamp(1 - over / 1.5, 0, 1);
      reasons.push(`Dalga yüksek (${waveHeightM!.toFixed(1)}m)`);
    }
  }

  if (profile.windPreferred) {
    if (windSpeedKmh <= profile.windPreferred.maxKmh) {
      reasons.push(`Rüzgar uygun (${Math.round(windSpeedKmh)} km/sa)`);
    } else {
      const over = windSpeedKmh - profile.windPreferred.maxKmh;
      s *= clamp(1 - over / 40, 0, 1);
      reasons.push(`Rüzgar güçlü (${Math.round(windSpeedKmh)} km/sa)`);
    }
  }

  return { score01: clamp(s, 0, 1), reasons, hasWave: hasWave };
}

function shoreTypeScore(profile: FishProfile, shoreType: ShoreType): { score01: number; reasons: string[]; hasType: boolean } {
  const reasons: string[] = [];
  if (shoreType === "unknown") {
    reasons.push("Kıyı tipi bilinmiyor");
    return { score01: 0.5, reasons, hasType: false }; // neutral
  }
  const pref = profile.shorePreference[shoreType] ?? 0.5;
  reasons.push(`Kıyı tipi: ${shoreType}`);
  return { score01: clamp(pref, 0, 1), reasons, hasType: true };
}

function computeConfidence(parts: { hasSst: boolean; hasWave: boolean; hasShoreType: boolean; hasCoords: boolean }): number {
  let c = 100;
  if (!parts.hasCoords) c -= 35;
  if (!parts.hasSst) c -= 20;
  if (!parts.hasWave) c -= 15;
  if (!parts.hasShoreType) c -= 15;
  return clamp(c, 0, 100);
}

function scoreProfile(input: ScoreFishingNowInput, profile: FishProfile): FishRecommendation {
  const sunrise = new Date(input.weather.sunrise * 1000);
  const sunset = new Date(input.weather.sunset * 1000);
  const month = input.now.getMonth() + 1;

  const season = seasonRegionScore(profile, input.seaRegion, month);
  const activity = activityScore(profile, input.now, sunrise, sunset);
  const sst = sstScore(profile, input.seaTempC);
  const seaState = seaStateScore(profile, input.waveHeightM, input.windSpeedKmh);
  const shore = shoreTypeScore(profile, input.shoreType);

  // Weights sum to 10 points (MVP)
  const score0to10 =
    2.5 * season.score01 +
    3.5 * activity.score01 +
    2.0 * seaState.score01 +
    1.5 * sst.score01 +
    0.5 * shore.score01;

  const score = Math.round(clamp(score0to10, 0, 10) * 10) / 10;

  const confidence = computeConfidence({
    hasSst: sst.hasData,
    hasWave: seaState.hasWave,
    hasShoreType: shore.hasType,
    hasCoords: !!input.coords,
  });

  const reasons = [
    ...season.reasons,
    ...activity.reasons,
    ...seaState.reasons,
    ...sst.reasons,
    ...shore.reasons,
  ].slice(0, 6);

  return {
    id: profile.id,
    trName: profile.trName,
    latinShort: profile.latinShort,
    score,
    color: scoreColor(score),
    reasons,
    confidence,
  };
}

// Province-based shore fishing mapping (kıyı balıkçılığı avları)
const PROVINCE_SHORE_FISHING: Record<string, string[]> = {
  // Marmara Bölgesi
  "İstanbul": ["bluefish", "horse_mackerel", "bonito", "gilthead_seabream"], // Lüfer, İstavrit, Palamut, Çipura
  "Çanakkale": ["bluefish", "horse_mackerel", "bonito", "seabass", "gilthead_seabream"], // Lüfer, İstavrit, Palamut, Levrek, Çipura
  "Balıkesir": ["bluefish", "horse_mackerel", "bonito", "gilthead_seabream"], // Lüfer, İstavrit, Palamut, Çipura
  "Bursa": ["bluefish", "horse_mackerel", "bonito", "gilthead_seabream"], // Lüfer, İstavrit, Palamut, Çipura
  "Kocaeli": ["bluefish", "horse_mackerel", "bonito", "gilthead_seabream"], // Lüfer, İstavrit, Palamut, Çipura
  "Yalova": ["bluefish", "horse_mackerel", "bonito", "gilthead_seabream"], // Lüfer, İstavrit, Palamut, Çipura
  
  // Ege Bölgesi
  "İzmir": ["gilthead_seabream", "seabass", "red_mullet"], // Çipura, Levrek, Barbun
  "Muğla": ["gilthead_seabream", "seabass", "red_mullet"], // Çipura, Levrek, Barbun
  "Aydın": ["gilthead_seabream", "seabass", "red_mullet"], // Çipura, Levrek, Barbun
  "Çanakkale": ["gilthead_seabream", "seabass", "red_mullet", "bluefish"], // Çipura, Levrek, Barbun, Lüfer
  
  // Akdeniz Bölgesi
  "Antalya": ["gilthead_seabream", "seabass", "red_mullet"], // Çipura, Levrek, Barbun
  "Mersin": ["gilthead_seabream", "seabass", "red_mullet"], // Çipura, Levrek, Barbun
  "Adana": ["gilthead_seabream", "seabass", "red_mullet"], // Çipura, Levrek, Barbun
  "Hatay": ["gilthead_seabream", "seabass", "red_mullet"], // Çipura, Levrek, Barbun
  
  // Karadeniz Bölgesi
  "Trabzon": ["anchovy", "horse_mackerel", "bonito", "bluefish", "whiting", "turbot"], // Hamsi, İstavrit, Palamut, Lüfer, Mezgit, Kalkan
  "Samsun": ["anchovy", "horse_mackerel", "bonito", "bluefish", "whiting", "turbot"], // Hamsi, İstavrit, Palamut, Lüfer, Mezgit, Kalkan
  "Ordu": ["anchovy", "horse_mackerel", "bonito", "bluefish", "whiting", "turbot"], // Hamsi, İstavrit, Palamut, Lüfer, Mezgit, Kalkan
  "Giresun": ["anchovy", "horse_mackerel", "bonito", "bluefish", "whiting", "turbot"], // Hamsi, İstavrit, Palamut, Lüfer, Mezgit, Kalkan
  "Rize": ["anchovy", "horse_mackerel", "bonito", "bluefish", "whiting", "turbot"], // Hamsi, İstavrit, Palamut, Lüfer, Mezgit, Kalkan
  "Zonguldak": ["anchovy", "horse_mackerel", "bonito", "bluefish", "whiting", "turbot"], // Hamsi, İstavrit, Palamut, Lüfer, Mezgit, Kalkan
  "Sinop": ["anchovy", "horse_mackerel", "bonito", "bluefish", "whiting", "turbot"], // Hamsi, İstavrit, Palamut, Lüfer, Mezgit, Kalkan
};

export function scoreFishingNow(input: ScoreFishingNowInput, profiles: FishProfile[] = MARMARA_CORE_PROFILES, provinceName?: string): FishRecommendation[] {
  // #region agent log
  console.log("[fishScoring] input", {
    seaRegion: input.seaRegion,
    shoreType: input.shoreType,
    seaTempC: input.seaTempC,
    waveHeightM: input.waveHeightM,
    windSpeedKmh: input.windSpeedKmh,
    hasCoords: !!input.coords,
    hasWeather: !!input.weather,
    weatherSunrise: input.weather?.sunrise,
    weatherSunset: input.weather?.sunset,
    profilesCount: profiles.length,
    provinceName,
  });
  // #endregion

  // Filter profiles by province-based shore fishing (kıyı balıkçılığı avları)
  let filteredProfiles = profiles;
  
  if (provinceName && PROVINCE_SHORE_FISHING[provinceName]) {
    const provinceFishIds = PROVINCE_SHORE_FISHING[provinceName];
    filteredProfiles = profiles.filter((p) => provinceFishIds.includes(p.id));
    // #region agent log
    console.log("[fishScoring] filtered by province shore fishing", {
      provinceName,
      provinceFishIds,
      originalCount: profiles.length,
      filteredCount: filteredProfiles.length,
      filteredIds: filteredProfiles.map(p => p.id),
    });
    // #endregion
  } else if (input.seaRegion && input.seaRegion !== "Unknown") {
    // Fallback to sea region filtering if province not found
    filteredProfiles = profiles.filter((p) => 
      p.primaryRegions.includes(input.seaRegion!)
    );
    // #region agent log
    console.log("[fishScoring] filtered by region (fallback)", {
      seaRegion: input.seaRegion,
      originalCount: profiles.length,
      filteredCount: filteredProfiles.length,
      filteredIds: filteredProfiles.map(p => p.id),
    });
    // #endregion
  } else {
    // If region is Unknown, use all profiles (fallback)
    // #region agent log
    console.log("[fishScoring] region unknown, using all profiles", {
      profilesCount: profiles.length,
    });
    // #endregion
  }

  try {
    const scored = filteredProfiles.map((p) => {
      try {
        const result = scoreProfile(input, p);
        // #region agent log
        console.log("[fishScoring] scored profile", { id: p.id, trName: p.trName, score: result.score });
        // #endregion
        return result;
      } catch (err) {
        // #region agent log
        console.error("[fishScoring] error scoring profile", { id: p.id, trName: p.trName, error: err });
        // #endregion
        throw err;
      }
    });
    const sorted = scored.sort((a, b) => b.score - a.score);
    const top5 = sorted.slice(0, 5);
    // #region agent log
    console.log("[fishScoring] final result", { top5Count: top5.length, allScores: sorted.map(s => ({ id: s.id, score: s.score })) });
    // #endregion
    return top5;
  } catch (error) {
    // #region agent log
    console.error("[fishScoring] error in scoreFishingNow", error);
    // #endregion
    return [];
  }
}


