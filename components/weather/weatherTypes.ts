// TypeScript types for OpenWeather API responses

export interface CurrentWeather {
  dt: number;
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_deg?: number; // Wind direction in degrees (0-360)
  pressure?: number; // hPa
  uvi?: number; // UV Index (0-11+)
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  sunrise: number;
  sunset: number;
  // Extended data (may not be available from API)
  seaTemperature?: number; // Sea water temperature in Celsius
  waveHeight?: number; // Wave height in meters
}

export interface DailyForecast {
  dt: number;
  temp: {
    min: number;
    max: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
}

export interface AirQuality {
  list: Array<{
    main: {
      aqi: number; // 1-5
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      pm2_5: number;
      pm10: number;
    };
  }>;
}

export interface WeatherResponse {
  current: CurrentWeather;
  daily: DailyForecast[];
  timezone: string;
  timezone_offset: number;
  forecastList?: Array<{
    dt: number;
    main: { temp: number; pressure?: number; humidity: number };
    wind: { speed: number; deg?: number };
    weather: Array<{ icon: string }>;
  }>; // 3-hour forecast intervals
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface AQIData {
  aqi: number; // 1-5
  label: string;
  color: string;
  description: string;
}

export const AQI_MAP: Record<number, AQIData> = {
  1: {
    aqi: 1,
    label: "Mükemmel",
    color: "#10B981", // green-500
    description: "Hava kalitesi mükemmel",
  },
  2: {
    aqi: 2,
    label: "İyi",
    color: "#3B82F6", // blue-500
    description: "Hava kalitesi iyi",
  },
  3: {
    aqi: 3,
    label: "Orta",
    color: "#F59E0B", // amber-500
    description: "Hava kalitesi orta",
  },
  4: {
    aqi: 4,
    label: "Kötü",
    color: "#EF4444", // red-500
    description: "Hava kalitesi kötü",
  },
  5: {
    aqi: 5,
    label: "Sağlıksız",
    color: "#8B5CF6", // purple-500
    description: "Hava kalitesi sağlıksız",
  },
};

// Moon phases
export type MoonPhase =
  | "moon-new"
  | "moon-waxing-crescent"
  | "moon-first-quarter"
  | "moon-waxing-gibbous"
  | "moon-full"
  | "moon-waning-gibbous"
  | "moon-last-quarter"
  | "moon-waning-crescent";

// Beaufort Wind Scale (0-12)
export interface BeaufortData {
  scale: number; // 0-12
  label: string;
  description: string;
  windSpeedKmh: { min: number; max: number };
}

export const BEAUFORT_SCALE: Record<number, BeaufortData> = {
  0: { scale: 0, label: "Sakin", description: "Duman dikey yükselir", windSpeedKmh: { min: 0, max: 1 } },
  1: { scale: 1, label: "Esinti", description: "Rüzgâr yönü dumanla görülür", windSpeedKmh: { min: 1, max: 5 } },
  2: { scale: 2, label: "Hafif Rüzgâr", description: "Yüzde hissedilir, yapraklar hışırdar", windSpeedKmh: { min: 6, max: 11 } },
  3: { scale: 3, label: "Hafif Meltem", description: "Yapraklar ve ince dallar sürekli hareket eder", windSpeedKmh: { min: 12, max: 19 } },
  4: { scale: 4, label: "Orta Meltem", description: "Toz ve kağıtlar kalkar, küçük dallar hareket eder", windSpeedKmh: { min: 20, max: 28 } },
  5: { scale: 5, label: "Sert Meltem", description: "Küçük ağaçlar sallanır, iç sularda dalgacıklar oluşur", windSpeedKmh: { min: 29, max: 38 } },
  6: { scale: 6, label: "Kuvvetli Rüzgâr", description: "Büyük dallar hareket eder, tellerde ses duyulur", windSpeedKmh: { min: 39, max: 49 } },
  7: { scale: 7, label: "Fırtına", description: "Bütün ağaçlar sallanır, yürümek zorlaşır", windSpeedKmh: { min: 50, max: 61 } },
  8: { scale: 8, label: "Kuvvetli Fırtına", description: "Dallar kırılır, yürümek çok zor", windSpeedKmh: { min: 62, max: 74 } },
  9: { scale: 9, label: "Şiddetli Fırtına", description: "Hafif yapı hasarları, çatı kiremitleri uçar", windSpeedKmh: { min: 75, max: 88 } },
  10: { scale: 10, label: "Tam Fırtına", description: "Ağaçlar kökünden sökülür, binalarda hasar", windSpeedKmh: { min: 89, max: 102 } },
  11: { scale: 11, label: "Çok Şiddetli Fırtına", description: "Yaygın hasar", windSpeedKmh: { min: 103, max: 117 } },
  12: { scale: 12, label: "Kasırga", description: "Çok yaygın yıkım", windSpeedKmh: { min: 118, max: Infinity } },
};

// UV Index levels
export interface UVIndexData {
  level: number;
  label: string;
  color: string;
  description: string;
}

export const UV_INDEX_LEVELS: Record<number, UVIndexData> = {
  0: { level: 0, label: "Düşük", color: "#3B82F6", description: "UV indeksi düşük" },
  1: { level: 1, label: "Düşük", color: "#3B82F6", description: "UV indeksi düşük" },
  2: { level: 2, label: "Düşük", color: "#3B82F6", description: "UV indeksi düşük" },
  3: { level: 3, label: "Orta", color: "#10B981", description: "UV indeksi orta" },
  4: { level: 4, label: "Orta", color: "#10B981", description: "UV indeksi orta" },
  5: { level: 5, label: "Orta", color: "#10B981", description: "UV indeksi orta" },
  6: { level: 6, label: "Yüksek", color: "#F59E0B", description: "UV indeksi yüksek" },
  7: { level: 7, label: "Yüksek", color: "#F59E0B", description: "UV indeksi yüksek" },
  8: { level: 8, label: "Çok Yüksek", color: "#EF4444", description: "UV indeksi çok yüksek" },
  9: { level: 9, label: "Çok Yüksek", color: "#EF4444", description: "UV indeksi çok yüksek" },
  10: { level: 10, label: "Aşırı", color: "#8B5CF6", description: "UV indeksi aşırı" },
  11: { level: 11, label: "Aşırı", color: "#8B5CF6", description: "UV indeksi aşırı" },
};

/**
 * Calculate moon phase based on date
 * Returns moon phase icon name
 */
export function getMoonPhase(date: Date = new Date()): MoonPhase {
  // Simplified moon phase calculation
  // This is a basic approximation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Julian day calculation (simplified)
  const jd = (1461 * (year + 4800 + (month - 14) / 12)) / 4 +
    (367 * (month - 2 - 12 * ((month - 14) / 12))) / 12 -
    (3 * ((year + 4900 + (month - 14) / 12) / 100)) / 4 +
    day - 32075;
  
  // Days since last new moon (approximate, 29.5 day cycle)
  const daysSinceNewMoon = (jd - 2451549.5) % 29.53058867;
  
  if (daysSinceNewMoon < 1.84) return "moon-new";
  if (daysSinceNewMoon < 5.53) return "moon-waxing-crescent";
  if (daysSinceNewMoon < 9.22) return "moon-first-quarter";
  if (daysSinceNewMoon < 12.91) return "moon-waxing-gibbous";
  if (daysSinceNewMoon < 16.61) return "moon-full";
  if (daysSinceNewMoon < 20.30) return "moon-waning-gibbous";
  if (daysSinceNewMoon < 23.99) return "moon-last-quarter";
  return "moon-waning-crescent";
}

/**
 * Get Beaufort scale from wind speed (km/h)
 */
export function getBeaufortScale(windSpeedKmh: number): number {
  for (let i = 12; i >= 0; i--) {
    const scale = BEAUFORT_SCALE[i];
    if (windSpeedKmh >= scale.windSpeedKmh.min) {
      return i;
    }
  }
  return 0;
}

/**
 * Get UV Index level (0-11+)
 */
export function getUVIndexLevel(uvi: number): number {
  return Math.min(Math.max(Math.round(uvi), 0), 11);
}

/**
 * Convert wind direction degrees to Turkish wind name
 * @param deg Wind direction in degrees (0-360)
 * @returns Turkish wind name (Poyraz, Lodos, Karayel, Yıldız, etc.)
 */
export function getTurkishWindName(deg: number | undefined): string {
  if (deg === undefined || deg === null) {
    return "Bilinmiyor";
  }

  // Normalize degrees to 0-360
  const normalizedDeg = ((deg % 360) + 360) % 360;

  // Turkish wind directions (8 main directions)
  // North: 0°, Northeast: 45°, East: 90°, Southeast: 135°, South: 180°, Southwest: 225°, West: 270°, Northwest: 315°
  
  if (normalizedDeg >= 337.5 || normalizedDeg < 22.5) {
    return "Yıldız"; // North (N)
  } else if (normalizedDeg >= 22.5 && normalizedDeg < 67.5) {
    return "Poyraz"; // Northeast (NE)
  } else if (normalizedDeg >= 67.5 && normalizedDeg < 112.5) {
    return "Gündoğusu"; // East (E)
  } else if (normalizedDeg >= 112.5 && normalizedDeg < 157.5) {
    return "Keşişleme"; // Southeast (SE)
  } else if (normalizedDeg >= 157.5 && normalizedDeg < 202.5) {
    return "Lodos"; // South (S)
  } else if (normalizedDeg >= 202.5 && normalizedDeg < 247.5) {
    return "Günbatısı"; // Southwest (SW)
  } else if (normalizedDeg >= 247.5 && normalizedDeg < 292.5) {
    return "Karayel"; // West (W)
  } else if (normalizedDeg >= 292.5 && normalizedDeg < 337.5) {
    return "Kıble"; // Northwest (NW)
  }

  return "Bilinmiyor";
}

/**
 * Get wind direction abbreviation (N, NE, E, SE, S, SW, W, NW)
 */
export function getWindDirectionAbbr(deg: number | undefined): string {
  if (deg === undefined || deg === null) {
    return "-";
  }

  const normalizedDeg = ((deg % 360) + 360) % 360;

  if (normalizedDeg >= 337.5 || normalizedDeg < 22.5) return "K";
  if (normalizedDeg >= 22.5 && normalizedDeg < 67.5) return "KD";
  if (normalizedDeg >= 67.5 && normalizedDeg < 112.5) return "D";
  if (normalizedDeg >= 112.5 && normalizedDeg < 157.5) return "GD";
  if (normalizedDeg >= 157.5 && normalizedDeg < 202.5) return "G";
  if (normalizedDeg >= 202.5 && normalizedDeg < 247.5) return "GB";
  if (normalizedDeg >= 247.5 && normalizedDeg < 292.5) return "B";
  if (normalizedDeg >= 292.5 && normalizedDeg < 337.5) return "KB";

  return "-";
}

