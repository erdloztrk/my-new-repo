/**
 * Daily Forecast Bar component.
 * Shows 6-day forecast summary with icons and temperatures.
 */

import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { MeteoconsIcon } from "@/components/weather/MeteoconsIcon";
import type { DailyForecast } from "@/components/weather/weatherTypes";
import { getMeteoconsIcon } from "@/components/weather/weatherIconMap";

interface DailyForecastBarProps {
  dailyForecasts: DailyForecast[];
  selectedIndex: number;
  onSelectDay: (index: number) => void;
  isDark: boolean;
}

const DAY_NAMES = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];

function getDayName(date: Date): string {
  return DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

export function DailyForecastBar({
  dailyForecasts,
  selectedIndex,
  onSelectDay,
  isDark,
}: DailyForecastBarProps) {
  if (dailyForecasts.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dailyForecasts.map((forecast, index) => {
          const date = new Date(forecast.dt * 1000);
          const dayName = getDayName(date);
          const isSelected = index === selectedIndex;
          const iconName = getMeteoconsIcon(forecast.weather[0]?.icon || "01d");

          return (
            <Pressable
              key={forecast.dt}
              onPress={() => onSelectDay(index)}
              style={[
                styles.dayCard,
                isSelected && {
                  backgroundColor: isDark ? "#334155" : "#F1F5F9",
                  borderColor: "#6C63FF",
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayName,
                  {
                    color: isSelected
                      ? "#6C63FF"
                      : isDark
                      ? "#94A3B8"
                      : "#64748B",
                    fontWeight: isSelected ? "700" : "600",
                  },
                ]}
              >
                {dayName}
              </Text>
              <View style={styles.iconContainer}>
                <MeteoconsIcon name={iconName} size={32} />
              </View>
              <View style={styles.tempContainer}>
                <Text
                  style={[
                    styles.tempHigh,
                    {
                      color: isDark ? "#ECEDEE" : "#11181C",
                    },
                  ]}
                >
                  {Math.round(forecast.temp.max)}°
                </Text>
                <Text
                  style={[
                    styles.tempLow,
                    {
                      color: isDark ? "#94A3B8" : "#64748B",
                    },
                  ]}
                >
                  {Math.round(forecast.temp.min)}°
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Gradient Bar - Temperature/Wind Intensity Scale */}
      <View style={styles.gradientBarContainer}>
        <View style={styles.gradientBar}>
          <View style={[styles.gradientSegment, { backgroundColor: "#EF4444", flex: 1 }]} />
          <View style={[styles.gradientSegment, { backgroundColor: "#3B82F6", flex: 1 }]} />
          <View style={[styles.gradientSegment, { backgroundColor: "#10B981", flex: 1 }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  dayCard: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    minWidth: 70,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayName: {
    fontSize: 12,
    marginBottom: 4,
  },
  iconContainer: {
    marginVertical: 4,
  },
  tempContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tempHigh: {
    fontSize: 14,
    fontWeight: "700",
  },
  tempLow: {
    fontSize: 12,
    fontWeight: "500",
  },
  gradientBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  gradientBar: {
    flexDirection: "row",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  gradientSegment: {
    height: "100%",
  },
});

