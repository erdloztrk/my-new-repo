/**
 * Weather Data Card Component
 * Shows detailed weather information (temperature, wind, pressure, sea temp, wave height)
 * Used in bathymetry analysis screen
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Thermometer, Wind, Gauge, Waves } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import type { CurrentWeather, WeatherResponse } from "@/components/weather/weatherTypes";
import { getTurkishWindName } from "@/components/weather/weatherTypes";
import { MeteoconsIcon } from "@/components/weather/MeteoconsIcon";
import { getMeteoconsIcon } from "@/components/weather/weatherIconMap";

interface WeatherDataCardProps {
  weather: CurrentWeather;
  forecastList?: WeatherResponse["forecastList"];
}

export function WeatherDataCard({ weather, forecastList }: WeatherDataCardProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  // Process hourly forecast (next 24 hours from forecastList)
  const hourlyForecast = useMemo(() => {
    if (!forecastList || forecastList.length === 0) {
      return [];
    }

    const now = Math.floor(Date.now() / 1000);
    const next24Hours = now + 24 * 3600;

    return forecastList
      .filter((item) => item.dt > now && item.dt <= next24Hours)
      .slice(0, 8) // Show next 8 forecast points (24 hours = 8 * 3 hours)
      .map((item) => ({
        dt: item.dt,
        temp: item.main.temp,
        icon: item.weather[0]?.icon || "01d",
        windSpeed: item.wind?.speed || 0,
        windDeg: item.wind?.deg,
        precipitation: (item as any).rain?.["3h"] || 0, // 3-hour precipitation
      }));
  }, [forecastList]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
          borderColor: isDark ? "#334155" : "#E2E8F0",
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: isDark ? "#F8FAFC" : "#0F172A",
          },
        ]}
      >
        Hava Durumu
      </Text>
      <View style={styles.grid}>
        {weather.temp !== undefined && (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Thermometer size={16} color="#EF4444" weight="fill" />
              <Text
                style={[
                  styles.label,
                  {
                    color: isDark ? "#94A3B8" : "#64748B",
                  },
                ]}
              >
                Sıcaklık
              </Text>
            </View>
            <Text
              style={[
                styles.value,
                {
                  color: isDark ? "#F8FAFC" : "#0F172A",
                },
              ]}
            >
              {Math.round(weather.temp)}°C
            </Text>
          </View>
        )}
        {weather.wind_speed !== undefined && (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Wind size={16} color="#3B82F6" weight="fill" />
              <Text
                style={[
                  styles.label,
                  {
                    color: isDark ? "#94A3B8" : "#64748B",
                  },
                ]}
              >
                Rüzgar
              </Text>
            </View>
            <Text
              style={[
                styles.value,
                {
                  color: isDark ? "#F8FAFC" : "#0F172A",
                },
              ]}
            >
              {Math.round(weather.wind_speed * 3.6)} km/h
            </Text>
          </View>
        )}
        {weather.wind_deg !== undefined && (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Wind size={16} color="#8B5CF6" weight="regular" />
              <Text
                style={[
                  styles.label,
                  {
                    color: isDark ? "#94A3B8" : "#64748B",
                  },
                ]}
              >
                Rüzgar Yönü
              </Text>
            </View>
            <Text
              style={[
                styles.value,
                {
                  color: isDark ? "#F8FAFC" : "#0F172A",
                },
              ]}
            >
              {getTurkishWindName(weather.wind_deg)}
            </Text>
          </View>
        )}
        {weather.pressure !== undefined && (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Gauge size={16} color="#10B981" weight="fill" />
              <Text
                style={[
                  styles.label,
                  {
                    color: isDark ? "#94A3B8" : "#64748B",
                  },
                ]}
              >
                Basınç
              </Text>
            </View>
            <Text
              style={[
                styles.value,
                {
                  color: isDark ? "#F8FAFC" : "#0F172A",
                },
              ]}
            >
              {weather.pressure} hPa
            </Text>
          </View>
        )}
        {weather.seaTemperature !== undefined && (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Waves size={16} color="#06B6D4" weight="fill" />
              <Text
                style={[
                  styles.label,
                  {
                    color: isDark ? "#94A3B8" : "#64748B",
                  },
                ]}
              >
                Deniz Sıcaklığı
              </Text>
            </View>
            <Text
              style={[
                styles.value,
                {
                  color: isDark ? "#F8FAFC" : "#0F172A",
                },
              ]}
            >
              {weather.seaTemperature}°C
            </Text>
          </View>
        )}
        {weather.waveHeight !== undefined && (
          <View style={styles.item}>
            <View style={styles.itemHeader}>
              <Waves size={16} color="#8B5CF6" weight="fill" />
              <Text
                style={[
                  styles.label,
                  {
                    color: isDark ? "#94A3B8" : "#64748B",
                  },
                ]}
              >
                Dalga Yüksekliği
              </Text>
            </View>
            <Text
              style={[
                styles.value,
                {
                  color: isDark ? "#F8FAFC" : "#0F172A",
                },
              ]}
            >
              {weather.waveHeight} m
            </Text>
          </View>
        )}
      </View>

      {/* Hourly Forecast Section */}
      {hourlyForecast.length > 0 && (
        <View style={styles.hourlySection}>
          <Text
            style={[
              styles.hourlyTitle,
              {
                color: isDark ? "#F8FAFC" : "#0F172A",
              },
            ]}
          >
            Saatlik Tahmin
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyScroll}>
            {hourlyForecast.map((item, index) => {
              const date = new Date(item.dt * 1000);
              const hour = date.getHours();
              const isNow = index === 0;
              const iconName = getMeteoconsIcon(item.icon);

              return (
                <View
                  key={item.dt}
                  style={[
                    styles.hourlyItem,
                    {
                      backgroundColor: isNow
                        ? isDark
                          ? "rgba(108, 99, 255, 0.2)"
                          : "rgba(108, 99, 255, 0.1)"
                        : "transparent",
                      borderColor: isNow ? "#6C63FF" : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.hourlyTime,
                      {
                        color: isNow
                          ? "#6C63FF"
                          : isDark
                          ? "#94A3B8"
                          : "#64748B",
                        fontWeight: isNow ? "700" : "600",
                      },
                    ]}
                  >
                    {isNow ? t("weather.now") : `${hour}:00`}
                  </Text>
                  <View style={styles.hourlyIcon}>
                    <MeteoconsIcon name={iconName} size={32} />
                  </View>
                  <Text
                    style={[
                      styles.hourlyTemp,
                      {
                        color: isNow
                          ? "#6C63FF"
                          : isDark
                          ? "#F8FAFC"
                          : "#0F172A",
                        fontWeight: isNow ? "700" : "600",
                      },
                    ]}
                  >
                    {Math.round(item.temp)}°
                  </Text>
                  {item.precipitation > 0 && (
                    <Text
                      style={[
                        styles.hourlyPrecip,
                        {
                          color: isDark ? "#60A5FA" : "#3B82F6",
                        },
                      ]}
                    >
                      {item.precipitation.toFixed(1)}mm
                    </Text>
                  )}
                  <View style={styles.hourlyWind}>
                    <Wind size={12} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
                    <Text
                      style={[
                        styles.hourlyWindText,
                        {
                          color: isDark ? "#94A3B8" : "#64748B",
                        },
                      ]}
                    >
                      {Math.round(item.windSpeed * 3.6)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  item: {
    flex: 1,
    minWidth: "45%",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
  },
  hourlySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.2)",
  },
  hourlyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  hourlyScroll: {
    paddingRight: 20,
  },
  hourlyItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 80,
  },
  hourlyTime: {
    fontSize: 12,
    marginBottom: 8,
  },
  hourlyIcon: {
    marginBottom: 8,
  },
  hourlyTemp: {
    fontSize: 16,
    marginBottom: 4,
  },
  hourlyPrecip: {
    fontSize: 10,
    marginBottom: 4,
  },
  hourlyWind: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hourlyWindText: {
    fontSize: 10,
  },
});

