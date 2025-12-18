/**
 * BathymetryWidget View Component.
 * Minimal UI widget for depth information - SECONDARY feature.
 * Should not dominate the city guide experience.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { Card } from "@/components/ui/Card";
import { Waves } from "phosphor-react-native";
import { useBathymetryWidgetViewModel } from "./BathymetryWidgetViewModel";
import type { CurrentWeather } from "@/components/weather/weatherTypes";

interface BathymetryWidgetViewProps {
  selectedCoord: { lat: number; lon: number } | null;
  weather: CurrentWeather | null;
  onPress?: () => void; // Optional: navigate to detailed view
}

const SPECIES_LABELS: Record<string, string> = {
  chipura: "Çipura",
  levrek: "Levrek",
  sargoz: "Sargoz",
  karagoz: "Karagöz",
  mirmir: "Mırmır",
};

export function BathymetryWidgetView({
  selectedCoord,
  weather,
  onPress,
}: BathymetryWidgetViewProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  // ViewModel - Business logic extracted
  const { depth, scores, loading, isValid } = useBathymetryWidgetViewModel({
    selectedCoord,
    weather,
  });

  // Don't render if invalid
  if (!isValid || depth === null) {
    return null;
  }

  // Get best score (highest)
  const bestScore = Math.max(
    ...Object.values(scores).filter((s): s is number => s !== null),
    -Infinity
  );
  const bestSpecies = Object.entries(scores).find(
    ([_, score]) => score === bestScore
  )?.[0];

  const getScoreColor = (score: number | null): string => {
    if (score === null) return isDark ? "#94A3B8" : "#64748B";
    if (score >= 80) return "#10B981"; // green
    if (score >= 60) return "#F59E0B"; // amber
    if (score >= 40) return "#EF4444"; // red
    return "#6B7280"; // gray
  };

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card variant="default" padding="md" className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <Waves size={20} color={isDark ? "#60A5FA" : "#3B82F6"} weight="fill" />
            <Text
              className={`ml-2 text-sm font-semibold ${
                isDark ? "text-foreground-dark" : "text-foreground"
              }`}
            >
              Derinlik
            </Text>
          </View>
          <Text
            className={`text-lg font-bold ${
              isDark ? "text-foreground-dark" : "text-foreground"
            }`}
          >
            {Math.abs(depth).toFixed(1)} m
          </Text>
        </View>
        {bestSpecies && bestScore > -Infinity && (
          <View className="flex-row items-center">
            <Text
              className={`text-xs ${
                isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
              }`}
            >
              {SPECIES_LABELS[bestSpecies]}:{" "}
            </Text>
            <Text
              className="text-xs font-semibold"
              style={{ color: getScoreColor(bestScore) }}
            >
              {Math.round(bestScore)}/100
            </Text>
          </View>
        )}
        {loading && (
          <Text
            className={`text-xs mt-1 ${
              isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
            }`}
          >
            Yükleniyor...
          </Text>
        )}
      </Card>
    </Pressable>
  );
}

