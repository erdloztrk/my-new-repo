/**
 * Weather Forecast Panel component.
 * Shows 6-day forecast and hourly details for selected location.
 */

import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from "react-native";
import { X } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import type { WeatherResponse } from "@/components/weather/weatherTypes";
import { DailyForecastBar } from "./DailyForecastBar";
import { HourlyForecastTable } from "./HourlyForecastTable";

interface WeatherForecastPanelProps {
  weatherData: WeatherResponse | null;
  loading: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function WeatherForecastPanel({
  weatherData,
  loading,
  onClose,
}: WeatherForecastPanelProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Get daily forecasts (first 6 days)
  const dailyForecasts = useMemo(() => {
    if (!weatherData?.daily) return [];
    return weatherData.daily.slice(0, 6);
  }, [weatherData]);

  // Get hourly forecast for selected day
  const hourlyForecast = useMemo(() => {
    if (!weatherData?.forecastList || !dailyForecasts[selectedDayIndex]) {
      return [];
    }

    const selectedDay = dailyForecasts[selectedDayIndex];
    const selectedDayStart = new Date(selectedDay.dt * 1000);
    selectedDayStart.setHours(0, 0, 0, 0);
    const selectedDayEnd = new Date(selectedDayStart);
    selectedDayEnd.setDate(selectedDayEnd.getDate() + 1);

    // Filter forecast list for selected day
    return weatherData.forecastList
      .filter((item) => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate >= selectedDayStart && itemDate < selectedDayEnd;
      })
      .map((item) => ({
        dt: item.dt,
        temp: item.main.temp,
        weather: item.weather[0],
        windSpeed: item.wind.speed * 3.6, // Convert m/s to km/h
        windDeg: item.wind.deg,
        // Estimate gusts (typically 1.5-2x wind speed)
        windGust: (item.wind.speed * 3.6) * 1.8,
        // Precipitation not available in free tier, set to 0
        precipitation: 0,
      }));
  }, [weatherData, selectedDayIndex, dailyForecasts]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          },
        ]}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: isDark ? "#ECEDEE" : "#11181C",
              },
            ]}
          >
            Hava Durumu
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={20} color={isDark ? "#94A3B8" : "#64748B"} />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <Text
            style={{
              color: isDark ? "#94A3B8" : "#64748B",
            }}
          >
            Yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  if (!weatherData) {
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
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color: isDark ? "#ECEDEE" : "#11181C",
            },
          ]}
        >
          Hava Durumu
        </Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X size={20} color={isDark ? "#94A3B8" : "#64748B"} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 6-Day Forecast Bar */}
        <DailyForecastBar
          dailyForecasts={dailyForecasts}
          selectedIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
          isDark={isDark}
        />

        {/* Hourly Forecast Table */}
        <HourlyForecastTable
          hourlyForecast={hourlyForecast}
          selectedDay={dailyForecasts[selectedDayIndex]}
          isDark={isDark}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_WIDTH * 1.2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(148, 163, 184, 0.1)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

