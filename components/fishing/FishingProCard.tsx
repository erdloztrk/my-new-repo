import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import type { CurrentWeather } from "@/components/weather/weatherTypes";
import { getSeaRegion } from "@/components/weather/fishingUtils";
import type { SeaRegion } from "@/components/weather/fishingUtils";
import type { ShoreType } from "@/components/weather/fishProfiles";
import { MARMARA_CORE_PROFILES } from "@/components/weather/fishProfiles";
// Target species for micro scores - Kıyı avcılığı türleri
const TARGET_SPECIES = ["seabass", "white_sea_bream", "common_two_banded_sea_bream", "gilthead_seabream", "sand_steenbras"];
import {
  processForecastToHourly,
  findBestTimeWindow,
  formatTime,
  type HourlyForecastPoint,
} from "@/utils/fishing/hourlyForecast";
import type { WeatherSnapshot, TimeWeatherData } from "@/src/features/fishing/fishingScore";
import { computeSpeciesScore } from "@/src/features/fishing/fishingScore";
import { getBaitSuggestion } from "@/utils/fishing/baitSuggestions";
import { TablerIcon } from "@/components/icons/TablerIcon";
import { Sparkle } from "phosphor-react-native";
import Svg, { Polyline, Circle, Line } from "react-native-svg";

interface FishingProCardProps {
  weather: CurrentWeather | null;
  forecastList?: Array<{
    dt: number;
    main: { temp: number; pressure?: number; humidity: number };
    wind: { speed: number; deg?: number };
    weather: Array<{ icon: string }>;
  }>;
  coordinates?: { latitude: number; longitude: number };
  cityName?: string;
  enabled?: boolean; // Feature flag
}

const CHART_WIDTH = Dimensions.get("window").width - 48 - 32; // Screen width - padding - margins
const CHART_HEIGHT = 120;

export function FishingProCard({
  weather,
  forecastList,
  coordinates,
  cityName,
  enabled = false,
}: FishingProCardProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  // Compute sea region and shore type
  const seaRegion: SeaRegion | null = useMemo(() => {
    if (!coordinates) return null;
    return getSeaRegion(coordinates.latitude, coordinates.longitude);
  }, [coordinates]);

  const shoreType: ShoreType = useMemo(() => {
    return "unknown";
  }, []);

  // Get primary species profile (first target species)
  const primaryProfile = useMemo(() => {
    return MARMARA_CORE_PROFILES.find((p) => TARGET_SPECIES.includes(p.id));
  }, []);

  // Process hourly forecast
  const hourlyPoints = useMemo(() => {
    if (!weather || !primaryProfile) {
      console.log("[FishingProCard] Missing weather or profile", { weather: !!weather, primaryProfile: !!primaryProfile });
      return [];
    }

    const timeWeather: TimeWeatherData = {
      sunrise: weather.sunrise,
      sunset: weather.sunset,
    };

    // If no forecastList, create a stub with current time only
    if (!forecastList || forecastList.length === 0) {
      console.log("[FishingProCard] No forecastList, creating stub with current time");
      const currentSnapshot: WeatherSnapshot = {
        airTempC: weather.temp,
        seaTempC: weather.seaTemperature,
        windKmh: Math.round(weather.wind_speed * 3.6),
        waveM: weather.waveHeight,
        pressureHpa: weather.pressure,
      };

      const currentScore = computeSpeciesScore(
        currentSnapshot,
        primaryProfile,
        seaRegion,
        shoreType,
        timeWeather
      );

      return [{
        timestamp: Math.floor(new Date().getTime() / 1000),
        snapshot: currentSnapshot,
        score: currentScore.score,
      }];
    }

    const points = processForecastToHourly(
      forecastList,
      {
        temp: weather.temp,
        wind_speed: weather.wind_speed,
        pressure: weather.pressure,
        humidity: weather.humidity,
        seaTemperature: weather.seaTemperature,
        waveHeight: weather.waveHeight,
        sunrise: weather.sunrise,
        sunset: weather.sunset,
      },
      seaRegion,
      shoreType,
      timeWeather,
      primaryProfile
    );

    console.log("[FishingProCard] hourlyPoints computed", { count: points.length, points: points.map(p => ({ time: new Date(p.timestamp * 1000).toLocaleTimeString(), score: p.score })) });
    return points;
  }, [weather, forecastList, seaRegion, shoreType, primaryProfile]);

  // Find best time window
  const bestWindow = useMemo(() => {
    if (hourlyPoints.length === 0) return null;
    return findBestTimeWindow(hourlyPoints);
  }, [hourlyPoints]);

  // Get bait suggestions for top species
  const baitSuggestions = useMemo(() => {
    if (!primaryProfile) return null;
    return getBaitSuggestion(primaryProfile.id);
  }, [primaryProfile]);

  // Check if location is near boğaz/akıntı (Istanbul Bosphorus area)
  // Only show if we have coordinates and they're in the Bosphorus region
  const locationNote = useMemo(() => {
    if (!coordinates) return null;
    
    // Istanbul Bosphorus approximate coordinates
    // Latitude: 41.0-41.2, Longitude: 28.9-29.1
    const isNearBosphorus =
      coordinates.latitude >= 41.0 &&
      coordinates.latitude <= 41.2 &&
      coordinates.longitude >= 28.9 &&
      coordinates.longitude <= 29.1;

    if (isNearBosphorus) {
      return "Boğaz bölgesi: Akıntı ve derinlik değişimlerine dikkat edin.";
    }

    return null;
  }, [coordinates]);

  if (!enabled || !weather || !primaryProfile) {
    return null;
  }

  // Render score curve chart
  const renderScoreCurve = () => {
    if (hourlyPoints.length === 0) {
      return (
        <View className="items-center justify-center py-8">
          <Text
            className={`text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}
          >
            {t("fishing.pro.no_forecast")}
          </Text>
        </View>
      );
    }

    const scores = hourlyPoints.map((p) => p.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    // Ensure range is at least 2 points for better visualization
    const scoreRange = Math.max(maxScore - minScore, 2);

    const padding = 20;
    const chartInnerWidth = CHART_WIDTH - padding * 2;
    const chartInnerHeight = CHART_HEIGHT - padding * 2;

    // Generate points for the line
    const points = hourlyPoints.map((point, index) => {
      const x = hourlyPoints.length === 1 
        ? padding + chartInnerWidth / 2 // Center single point
        : padding + (index / (hourlyPoints.length - 1)) * chartInnerWidth;
      const y =
        padding +
        chartInnerHeight -
        ((point.score - minScore) / scoreRange) * chartInnerHeight;
      return { x, y, score: point.score, timestamp: point.timestamp };
    });
    
    console.log("[FishingProCard] Chart points:", {
      count: points.length,
      minScore,
      maxScore,
      scoreRange,
      points: points.map(p => ({ x: p.x.toFixed(1), y: p.y.toFixed(1), score: p.score })),
    });

    return (
      <View>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Grid lines */}
          {[0, 2.5, 5, 7.5, 10].map((score) => {
            const y =
              padding +
              chartInnerHeight -
              ((score - minScore) / scoreRange) * chartInnerHeight;
            return (
              <Line
                key={score}
                x1={padding}
                y1={y}
                x2={CHART_WIDTH - padding}
                y2={y}
                stroke={isDark ? "#2E303C" : "#E2E8F0"}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Score curve - using Polyline */}
          {points.length > 1 && (
            <Polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#6C63FF"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Single point: show as larger circle */}
          {points.length === 1 && (
            <Circle
              cx={points[0].x}
              cy={points[0].y}
              r={8}
              fill="#6C63FF"
              stroke={isDark ? "#1A1B26" : "#FFFFFF"}
              strokeWidth={3}
            />
          )}

          {/* Data points - only show if multiple points */}
          {points.length > 1 && points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill="#6C63FF"
              stroke={isDark ? "#1A1B26" : "#FFFFFF"}
              strokeWidth={2}
            />
          ))}
        </Svg>

        {/* Time labels */}
        <View className="flex-row justify-between mt-2">
          {hourlyPoints.map((point, index) => {
            // Show all labels if <= 5 points, otherwise every 2nd
            const shouldShow = hourlyPoints.length <= 5 || index % 2 === 0 || index === hourlyPoints.length - 1;
            if (shouldShow) {
              const time = new Date(point.timestamp * 1000);
              return (
                <Text
                  key={index}
                  className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}
                >
                  {formatTime(time)}
                </Text>
              );
            }
            return null;
          })}
        </View>
        
        {/* Debug info - remove in production */}
        {__DEV__ && (
          <Text className={`text-xs mt-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {hourlyPoints.length} nokta - Skor: {hourlyPoints.map(p => p.score.toFixed(1)).join(", ")}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View
      className={`rounded-2xl p-4 shadow-sm border ${
        isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Sparkle size={20} color="#6C63FF" weight="fill" />
          <Text
            className={`text-lg font-semibold ml-2 ${
              isDark ? "text-card-foreground-dark" : "text-card-foreground"
            }`}
          >
            {t("fishing.pro.title")}
          </Text>
        </View>
        {cityName && (
          <View className="flex-row items-center">
            <TablerIcon name="map-pin" size={14} color={isDark ? "#94A3B8" : "#64748B"} strokeWidth={2} />
            <Text className={`text-sm ml-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {cityName}
            </Text>
          </View>
        )}
      </View>

      {/* Hourly Score Curve */}
      <View className="mb-4 pb-4 border-b" style={{ borderBottomColor: isDark ? "#2E303C" : "#E2E8F0" }}>
        <Text
          className={`text-sm font-semibold mb-3 ${
            isDark ? "text-card-foreground-dark" : "text-card-foreground"
          }`}
        >
          {t("fishing.pro.hourly_curve")}
        </Text>
        {renderScoreCurve()}
      </View>

      {/* Best Time Window */}
      {bestWindow && (
        <View className="mb-4 pb-4 border-b" style={{ borderBottomColor: isDark ? "#2E303C" : "#E2E8F0" }}>
          <Text
            className={`text-sm font-semibold mb-2 ${
              isDark ? "text-card-foreground-dark" : "text-card-foreground"
            }`}
          >
            {t("fishing.pro.best_time")}
          </Text>
          <View
            className={`rounded-xl p-3 ${
              isDark ? "bg-primary/10 border border-primary/20" : "bg-primary/5 border border-primary/20"
            }`}
          >
            <Text
              className={`text-base font-bold mb-1`}
              style={{ color: "#6C63FF" }}
            >
              {formatTime(bestWindow.start)} - {formatTime(bestWindow.end)}
            </Text>
            <Text
              className={`text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}
            >
              {t("fishing.pro.avg_score")}: {bestWindow.avgScore.toFixed(1)}/10
            </Text>
          </View>
        </View>
      )}

      {/* Bait Suggestions */}
      {baitSuggestions && primaryProfile && (
        <View className="mb-4 pb-4 border-b" style={{ borderBottomColor: isDark ? "#2E303C" : "#E2E8F0" }}>
          <Text
            className={`text-sm font-semibold mb-2 ${
              isDark ? "text-card-foreground-dark" : "text-card-foreground"
            }`}
          >
            {t("fishing.pro.bait_suggestion")} - {primaryProfile.trName}
          </Text>
          <View className="gap-2">
            <View>
              <Text
                className={`text-xs font-semibold mb-1 ${
                  isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                }`}
              >
                {t("fishing.pro.primary_bait")}:
              </Text>
              {baitSuggestions.primary.map((bait, index) => (
                <Text
                  key={index}
                  className={`text-sm ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}
                >
                  • {bait}
                </Text>
              ))}
            </View>
            {baitSuggestions.secondary.length > 0 && (
              <View>
                <Text
                  className={`text-xs font-semibold mb-1 ${
                    isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                  }`}
                >
                  {t("fishing.pro.secondary_bait")}:
                </Text>
                {baitSuggestions.secondary.map((bait, index) => (
                  <Text
                    key={index}
                    className={`text-sm ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}
                  >
                    • {bait}
                  </Text>
                ))}
              </View>
            )}
            {baitSuggestions.notes && (
              <Text
                className={`text-xs mt-2 italic ${
                  isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                }`}
              >
                {baitSuggestions.notes}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Location Note */}
      {locationNote && (
        <View
          className={`rounded-xl p-3 ${
            isDark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200"
          }`}
        >
          <View className="flex-row items-start">
            <TablerIcon name="info-circle" size={16} color="#F59E0B" strokeWidth={2} />
            <Text
              className={`text-sm ml-2 flex-1 ${
                isDark ? "text-amber-300" : "text-amber-800"
              }`}
            >
              {locationNote}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

