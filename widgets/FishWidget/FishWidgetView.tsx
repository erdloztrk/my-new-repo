/**
 * FishWidget View Component.
 * Minimal UI widget for fishing scores - SECONDARY feature.
 * Should not dominate the city guide experience.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { Card } from "@/components/ui/Card";
import { Fish } from "phosphor-react-native";
import { useFishWidgetViewModel } from "./FishWidgetViewModel";
import type { CurrentWeather } from "@/components/weather/weatherTypes";

interface FishWidgetViewProps {
  weather: CurrentWeather | null;
  coordinates?: { latitude: number; longitude: number };
  cityName?: string;
  provinceName?: string;
  onPress?: () => void; // Optional: navigate to detailed view
}

export function FishWidgetView({
  weather,
  coordinates,
  cityName,
  provinceName,
  onPress,
}: FishWidgetViewProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  // ViewModel - Business logic extracted
  const { overallScore, isValid } = useFishWidgetViewModel({
    weather,
    coordinates,
    cityName,
    provinceName,
  });

  // Don't render if invalid
  if (!isValid || overallScore === null) {
    return null;
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#10B981"; // green
    if (score >= 60) return "#F59E0B"; // amber
    if (score >= 40) return "#EF4444"; // red
    return "#6B7280"; // gray
  };

  const scoreColor = getScoreColor(overallScore);

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card variant="default" padding="md" className="mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Fish size={20} color={scoreColor} weight="fill" />
            <Text
              className={`ml-2 text-sm font-semibold ${
                isDark ? "text-foreground-dark" : "text-foreground"
              }`}
            >
              {t("fishing.activity.title") || "Balık Avlama Skoru"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text
              className="text-lg font-bold"
              style={{ color: scoreColor }}
            >
              {Math.round(overallScore)}
            </Text>
            <Text
              className={`text-xs ml-1 ${
                isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
              }`}
            >
              /100
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

