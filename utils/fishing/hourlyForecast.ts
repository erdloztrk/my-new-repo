/**
 * Utilities for processing hourly forecast data from 3-hour intervals
 */

import type { WeatherSnapshot, TimeWeatherData } from "@/src/features/fishing/fishingScore";
import type { FishProfile } from "@/components/weather/fishProfiles";
import { computeSpeciesScore } from "@/src/features/fishing/fishingScore";
import type { SeaRegion } from "@/components/weather/fishingUtils";
import type { ShoreType } from "@/components/weather/fishProfiles";

/**
 * Hourly forecast data point
 */
export interface HourlyForecastPoint {
  timestamp: number; // Unix timestamp (seconds)
  snapshot: WeatherSnapshot;
  score: number; // 0-10
}

/**
 * Best time window
 */
export interface BestTimeWindow {
  start: Date;
  end: Date;
  avgScore: number;
  peakScore: number;
}

/**
 * Convert 3-hour forecast data to hourly-like data points
 * Since we only have 3-hour intervals, we'll interpolate or use nearest
 */
export function processForecastToHourly(
  forecastList: Array<{
    dt: number;
    main: { temp: number; pressure?: number; humidity: number };
    wind: { speed: number; deg?: number };
    weather: Array<{ icon: string }>;
  }>,
  currentWeather: {
    temp: number;
    wind_speed: number;
    pressure?: number;
    humidity: number;
    seaTemperature?: number;
    waveHeight?: number;
    sunrise: number;
    sunset: number;
  },
  seaRegion: SeaRegion | null,
  shoreType: ShoreType,
  timeWeather: TimeWeatherData,
  profile: FishProfile,
  now: Date = new Date()
): HourlyForecastPoint[] {
  const points: HourlyForecastPoint[] = [];
  const nowTimestamp = Math.floor(now.getTime() / 1000);

  // Add current time point
  const currentSnapshot: WeatherSnapshot = {
    airTempC: currentWeather.temp,
    seaTempC: currentWeather.seaTemperature,
    windKmh: Math.round(currentWeather.wind_speed * 3.6),
    waveM: currentWeather.waveHeight,
    pressureHpa: currentWeather.pressure,
  };

  const currentScore = computeSpeciesScore(
    currentSnapshot,
    profile,
    seaRegion,
    shoreType,
    timeWeather,
    now
  );

  points.push({
    timestamp: nowTimestamp,
    snapshot: currentSnapshot,
    score: currentScore.score,
  });

  // Process forecast list (3-hour intervals)
  // Take next 12 hours worth (4-5 data points)
  const next12Hours = nowTimestamp + 12 * 3600;
  
  forecastList
    .filter((item) => {
      const itemTime = item.dt;
      return itemTime > nowTimestamp && itemTime <= next12Hours;
    })
    .slice(0, 5) // Max 5 points (15 hours)
    .forEach((item) => {
      const snapshot: WeatherSnapshot = {
        airTempC: item.main.temp,
        seaTempC: currentWeather.seaTemperature, // Use current SST (forecast doesn't have it)
        windKmh: Math.round(item.wind.speed * 3.6),
        waveM: currentWeather.waveHeight, // Use current wave (forecast doesn't have it)
        pressureHpa: item.main.pressure,
      };

      const forecastTime = new Date(item.dt * 1000);
      // Use timeWeather directly (it has sunrise/sunset)
      const score = computeSpeciesScore(
        snapshot,
        profile,
        seaRegion,
        shoreType,
        timeWeather,
        forecastTime
      );

      points.push({
        timestamp: item.dt,
        snapshot,
        score: score.score,
      });
    });

  return points.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Find best time window from hourly forecast points
 * Looks for consecutive hours with scores >= threshold
 */
export function findBestTimeWindow(
  points: HourlyForecastPoint[],
  minScore: number = 6.0,
  minWindowHours: number = 1.5
): BestTimeWindow | null {
  if (points.length === 0) return null;

  let bestWindow: BestTimeWindow | null = null;
  let bestAvgScore = 0;

  // Find all windows where score >= minScore
  for (let i = 0; i < points.length; i++) {
    let windowStart = i;
    let windowEnd = i;
    let sumScore = points[i].score;
    let maxScore = points[i].score;

    // Extend window forward while score is good
    for (let j = i + 1; j < points.length; j++) {
      if (points[j].score >= minScore) {
        windowEnd = j;
        sumScore += points[j].score;
        maxScore = Math.max(maxScore, points[j].score);
      } else {
        break;
      }
    }

    // Check if window is long enough
    const windowHours = (points[windowEnd].timestamp - points[windowStart].timestamp) / 3600;
    if (windowHours >= minWindowHours) {
      const avgScore = sumScore / (windowEnd - windowStart + 1);
      if (avgScore > bestAvgScore) {
        bestWindow = {
          start: new Date(points[windowStart].timestamp * 1000),
          end: new Date(points[windowEnd].timestamp * 1000),
          avgScore,
          peakScore: maxScore,
        };
        bestAvgScore = avgScore;
      }
    }
  }

  // If no good window found, return the time with highest score
  if (!bestWindow && points.length > 0) {
    const bestPoint = points.reduce((best, current) =>
      current.score > best.score ? current : best
    );
    const bestTime = new Date(bestPoint.timestamp * 1000);
    return {
      start: bestTime,
      end: new Date(bestTime.getTime() + 3600 * 1000), // 1 hour window
      avgScore: bestPoint.score,
      peakScore: bestPoint.score,
    };
  }

  return bestWindow;
}

/**
 * Format time for display (HH:MM)
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

