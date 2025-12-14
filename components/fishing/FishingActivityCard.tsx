import React, { useState, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Modal, Animated } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
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
import { TablerIcon } from "@/components/icons/TablerIcon";
import { X } from "phosphor-react-native";

interface FishingActivityCardProps {
  weather: CurrentWeather | null;
  coordinates?: { latitude: number; longitude: number };
  cityName?: string;
  provinceName?: string;
}

// Target species for micro scores - Kıyı avcılığı türleri
const TARGET_SPECIES = ["seabass", "white_sea_bream", "common_two_banded_sea_bream", "gilthead_seabream", "sand_steenbras"];

export function FishingActivityCard({
  weather,
  coordinates,
  cityName,
  provinceName,
}: FishingActivityCardProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);

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
        ...score,
        trName: profile.trName,
        latinShort: profile.latinShort,
      };
    }).filter((s): s is NonNullable<typeof s> => s !== null);
  }, [snapshot, seaRegion, shoreType, weather, coordinates]);

  // Get factor explanations for selected species or overall
  const factorExplanations = useMemo(() => {
    if (!snapshot || !weather) {
      console.log("[FishingActivityCard] factorExplanations: snapshot or weather is null", { snapshot, weather });
      return [];
    }
    const targetSpecies = selectedSpeciesId || speciesScores[0]?.id || "";
    try {
      const factors = explainScore(snapshot, targetSpecies, seaRegion, shoreType, weather, coordinates);
      console.log("[FishingActivityCard] factorExplanations computed:", factors.length, factors);
      return factors;
    } catch (error) {
      console.error("[FishingActivityCard] Error computing factorExplanations:", error);
      return [];
    }
  }, [snapshot, weather, selectedSpeciesId, speciesScores, seaRegion, shoreType, coordinates]);

  if (!weather || !snapshot || !overallScore) {
    return null;
  }

  return (
    <>
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
          <Text
            className={`text-lg font-semibold ${
              isDark ? "text-card-foreground-dark" : "text-card-foreground"
            }`}
          >
            {t("fishing.activity.title")}
          </Text>
          {cityName && (
            <View className="flex-row items-center">
              <TablerIcon name="map-pin" size={14} color={isDark ? "#94A3B8" : "#64748B"} strokeWidth={2} />
              <Text className={`text-sm ml-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                {cityName}
              </Text>
            </View>
          )}
        </View>

        {/* Overall Score */}
        <View className="items-center mb-4 pb-4 border-b" style={{ borderBottomColor: isDark ? "#2E303C" : "#E2E8F0" }}>
          <View className="flex-row items-baseline mb-2">
            <Text
              className={`text-5xl font-bold`}
              style={{ color: overallScore.color }}
            >
              {overallScore.score.toFixed(1)}
            </Text>
            <Text className={`text-2xl ml-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              /10
            </Text>
          </View>
          <Text
            className={`text-base font-semibold mb-2`}
            style={{ color: overallScore.color }}
          >
            {overallScore.label}
          </Text>
          <Text
            className={`text-sm text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}
          >
            {overallScore.summary}
          </Text>
        </View>

        {/* Species Micro Scores */}
        <View className="mb-4">
          <Text
            className={`text-sm font-semibold mb-3 ${
              isDark ? "text-card-foreground-dark" : "text-card-foreground"
            }`}
          >
            {t("fishing.activity.species")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {speciesScores.map((species) => (
              <View
                key={species.id}
                className={`rounded-xl p-3 border ${
                  isDark ? "bg-muted-dark border-border-dark" : "bg-muted border-border"
                }`}
                style={{ minWidth: "30%", flex: 1, maxWidth: "48%" }}
              >
                <Text
                  className={`text-xs font-semibold mb-1 ${
                    isDark ? "text-card-foreground-dark" : "text-card-foreground"
                  }`}
                  numberOfLines={1}
                >
                  {species.trName}
                </Text>
                <Text
                  className={`text-[10px] mb-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}
                >
                  {species.latinShort}
                </Text>
                {/* Score Bar */}
                <View className="h-1.5 rounded-full mb-1" style={{ backgroundColor: isDark ? "#2E303C" : "#E2E8F0" }}>
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${(species.score / 10) * 100}%`,
                      backgroundColor: species.color,
                    }}
                  />
                </View>
                <Text className={`text-xs font-bold`} style={{ color: species.color }}>
                  {species.score.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Why? Button */}
        <Pressable
          onPress={() => {
            setSelectedSpeciesId(null);
            setShowBreakdown(true);
          }}
          className={`flex-row items-center justify-center py-3 rounded-xl ${
            isDark ? "bg-muted-dark" : "bg-muted"
          } active:opacity-80`}
        >
          <Text
            className={`text-sm font-semibold ${
              isDark ? "text-card-foreground-dark" : "text-card-foreground"
            }`}
          >
            {t("fishing.activity.why")}
          </Text>
        </Pressable>
      </View>

      {/* Breakdown Modal */}
      <Modal
        visible={showBreakdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBreakdown(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <Pressable
            className="flex-1"
            onPress={() => setShowBreakdown(false)}
          />
          <View
            className={`rounded-t-3xl ${
              isDark ? "bg-card-dark" : "bg-card"
            }`}
            style={{
              maxHeight: "80%",
              paddingBottom: 32,
            }}
          >
            {/* Handle Bar */}
            <View className="items-center py-3">
              <View
                className="w-12 h-1 rounded-full"
                style={{ backgroundColor: isDark ? "#2E303C" : "#E2E8F0" }}
              />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pb-4 border-b" style={{ borderBottomColor: isDark ? "#2E303C" : "#E2E8F0" }}>
              <Text
                className={`text-xl font-bold ${
                  isDark ? "text-card-foreground-dark" : "text-card-foreground"
                }`}
              >
                {t("fishing.breakdown.title")}
              </Text>
              <Pressable onPress={() => setShowBreakdown(false)}>
                <X size={24} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
              </Pressable>
            </View>

            {/* Factors List */}
            <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
              {factorExplanations.length === 0 ? (
                <View className="items-center py-8">
                  <Text
                    className={`text-sm text-center ${
                      isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                    }`}
                  >
                    {t("fishing.breakdown.no_data")}
                  </Text>
                </View>
              ) : (
                factorExplanations.map((factor, index) => (
                  <View
                    key={factor.key}
                    className={`mb-4 p-4 rounded-xl border ${
                      isDark ? "bg-muted-dark border-border-dark" : "bg-muted border-border"
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text
                        className={`text-base font-semibold ${
                          isDark ? "text-card-foreground-dark" : "text-card-foreground"
                        }`}
                      >
                        {t(factor.labelKey)}
                      </Text>
                      <Text
                        className={`text-base font-bold ${
                          factor.impact > 0
                            ? "text-green-500"
                            : factor.impact < 0
                            ? "text-red-500"
                            : isDark
                            ? "text-muted-foreground-dark"
                            : "text-muted-foreground"
                        }`}
                      >
                        {factor.impact > 0 ? "+" : ""}
                        {factor.impact.toFixed(1)}
                      </Text>
                    </View>
                    <Text
                      className={`text-sm mb-1 ${
                        isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                      }`}
                    >
                      {t("fishing.breakdown.value")}: {factor.value}
                    </Text>
                    {factor.noteKey && (
                      <Text
                        className={`text-xs ${
                          isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                        }`}
                      >
                        {t(factor.noteKey)}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

