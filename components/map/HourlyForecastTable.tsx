/**
 * Hourly Forecast Table component.
 * Shows detailed hourly forecast with temperature, precipitation, wind speed, gusts, and direction.
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MeteoconsIcon } from "@/components/weather/MeteoconsIcon";
import Svg, { Path } from "react-native-svg";
import type { DailyForecast } from "@/components/weather/weatherTypes";
import { getMeteoconsIcon } from "@/components/weather/weatherIconMap";

interface HourlyForecastItem {
  dt: number;
  temp: number;
  weather: { icon: string };
  windSpeed: number; // km/h
  windDeg?: number;
  windGust: number; // km/h
  precipitation: number; // mm
}

interface HourlyForecastTableProps {
  hourlyForecast: HourlyForecastItem[];
  selectedDay: DailyForecast;
  isDark: boolean;
}

/**
 * Wind direction arrow component.
 */
function WindDirectionArrow({
  deg,
  size = 20,
  color = "#3B82F6",
}: {
  deg?: number;
  size?: number;
  color?: string;
}) {
  if (deg === undefined) {
    return (
      <View style={{ width: size, height: size }}>
        <Text style={{ fontSize: 10, color }}>-</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Path
          d="M10 2 L10 15 M6 10 L10 15 L14 10"
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={`rotate(${deg} 10 10)`}
        />
      </Svg>
    </View>
  );
}

/**
 * Color-coded bar for wind speed/gust intensity.
 */
function WindSpeedBar({
  value,
  maxValue = 50,
  color,
  isDark,
}: {
  value: number;
  maxValue?: number;
  color: string;
  isDark: boolean;
}) {
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  // Determine color based on intensity
  let barColor = color;
  if (value >= 30) {
    barColor = "#10B981"; // Green for high gusts
  } else if (value >= 20) {
    barColor = "#3B82F6"; // Blue for moderate
  } else {
    barColor = "#94A3B8"; // Gray for low
  }

  return (
    <View
      style={[
        styles.barContainer,
        {
          backgroundColor: isDark ? "#2E303C" : "#E2E8F0",
        },
      ]}
    >
      <View
        style={[
          styles.barFill,
          {
            width: `${percentage}%`,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
}

export function HourlyForecastTable({
  hourlyForecast,
  selectedDay,
  isDark,
}: HourlyForecastTableProps) {
  if (hourlyForecast.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text
          style={{
            color: isDark ? "#94A3B8" : "#64748B",
            fontSize: 14,
          }}
        >
          Bu gün için saatlik tahmin bulunamadı
        </Text>
      </View>
    );
  }

  const selectedDate = new Date(selectedDay.dt * 1000);
  const dayName = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"][
    selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1
  ];
  const dayNumber = selectedDate.getDate();

  // Find current hour index (if any)
  const now = new Date();
  const currentHourIndex = hourlyForecast.findIndex((item) => {
    const itemDate = new Date(item.dt * 1000);
    return itemDate.getHours() === now.getHours() && itemDate.getDate() === now.getDate();
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        },
      ]}
    >
      {/* Day Header */}
      <View style={styles.dayHeader}>
        <Text
          style={[
            styles.dayTitle,
            {
              color: isDark ? "#ECEDEE" : "#11181C",
            },
          ]}
        >
          {dayName.toUpperCase()} {dayNumber}
        </Text>
      </View>

      {/* Table - Column-based layout like screenshot */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Row */}
        <View
          style={[
            styles.headerRow,
            {
              borderBottomColor: isDark ? "#2E303C" : "#E2E8F0",
            },
          ]}
        >
          <View style={styles.headerCell}>
            <Text style={[styles.headerText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Saat
            </Text>
          </View>
          {hourlyForecast.map((item, index) => {
            const itemDate = new Date(item.dt * 1000);
            const hour = itemDate.getHours();
            return (
              <View key={`header-${item.dt}`} style={styles.headerCell}>
                <Text style={[styles.headerText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                  {hour}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Weather Icons Row */}
        <View
          style={[
            styles.dataRow,
            {
              borderBottomColor: isDark ? "#2E303C" : "#E2E8F0",
            },
          ]}
        >
          <View style={styles.labelCell}>
            <Text style={[styles.labelText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              {/* Empty - no label for icons */}
            </Text>
          </View>
          {hourlyForecast.map((item, index) => {
            const isCurrentHour = index === currentHourIndex;
            const iconName = getMeteoconsIcon(item.weather.icon);
            return (
              <View key={`icon-${item.dt}`} style={styles.dataCell}>
                <View
                  style={[
                    styles.iconWrapper,
                    isCurrentHour && {
                      borderWidth: 2,
                      borderColor: "#6C63FF",
                      borderRadius: 8,
                      padding: 2,
                    },
                  ]}
                >
                  <MeteoconsIcon name={iconName} size={28} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Temperature Row */}
        <View
          style={[
            styles.dataRow,
            {
              borderBottomColor: isDark ? "#2E303C" : "#E2E8F0",
            },
          ]}
        >
          <View style={styles.labelCell}>
            <Text style={[styles.labelText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Sıcaklık (°C)
            </Text>
          </View>
          {hourlyForecast.map((item, index) => {
            const isCurrentHour = index === currentHourIndex;
            return (
              <View key={`temp-${item.dt}`} style={styles.dataCell}>
                <Text
                  style={[
                    styles.tempText,
                    {
                      color: isCurrentHour
                        ? "#6C63FF"
                        : isDark
                        ? "#ECEDEE"
                        : "#11181C",
                      fontWeight: isCurrentHour ? "700" : "600",
                    },
                  ]}
                >
                  {Math.round(item.temp)}°
                </Text>
              </View>
            );
          })}
        </View>

        {/* Precipitation Row */}
        <View
          style={[
            styles.dataRow,
            {
              borderBottomColor: isDark ? "#2E303C" : "#E2E8F0",
            },
          ]}
        >
          <View style={styles.labelCell}>
            <Text style={[styles.labelText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Yağmur (mm)
            </Text>
          </View>
          {hourlyForecast.map((item) => (
            <View key={`precip-${item.dt}`} style={styles.dataCell}>
              <Text
                style={[
                  styles.valueText,
                  {
                    color: isDark ? "#94A3B8" : "#64748B",
                  },
                ]}
              >
                {item.precipitation > 0 ? item.precipitation.toFixed(1) : "-"}
              </Text>
            </View>
          ))}
        </View>

        {/* Wind Speed Row */}
        <View
          style={[
            styles.dataRow,
            {
              borderBottomColor: isDark ? "#2E303C" : "#E2E8F0",
            },
          ]}
        >
          <View style={styles.labelCell}>
            <Text style={[styles.labelText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Rüzgâr (km/h)
            </Text>
          </View>
          {hourlyForecast.map((item, index) => {
            const isCurrentHour = index === currentHourIndex;
            return (
              <View key={`wind-${item.dt}`} style={styles.dataCell}>
                <Text
                  style={[
                    styles.valueText,
                    {
                      color: isCurrentHour
                        ? "#6C63FF"
                        : isDark
                        ? "#94A3B8"
                        : "#64748B",
                      fontWeight: isCurrentHour ? "700" : "500",
                    },
                  ]}
                >
                  {Math.round(item.windSpeed)}
                </Text>
                <WindSpeedBar
                  value={item.windSpeed}
                  maxValue={30}
                  color="#3B82F6"
                  isDark={isDark}
                />
              </View>
            );
          })}
        </View>

        {/* Wind Gusts Row */}
        <View
          style={[
            styles.dataRow,
            {
              borderBottomColor: isDark ? "#2E303C" : "#E2E8F0",
            },
          ]}
        >
          <View style={styles.labelCell}>
            <Text style={[styles.labelText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Ani rüzgârlar (km/h)
            </Text>
          </View>
          {hourlyForecast.map((item, index) => {
            const isCurrentHour = index === currentHourIndex;
            const gustColor =
              item.windGust >= 30
                ? "#10B981"
                : item.windGust >= 20
                ? "#3B82F6"
                : isDark
                ? "#94A3B8"
                : "#64748B";
            return (
              <View key={`gust-${item.dt}`} style={styles.dataCell}>
                <Text
                  style={[
                    styles.valueText,
                    {
                      color: isCurrentHour ? "#6C63FF" : gustColor,
                      fontWeight: isCurrentHour ? "700" : "500",
                    },
                  ]}
                >
                  {Math.round(item.windGust)}
                </Text>
                <WindSpeedBar
                  value={item.windGust}
                  maxValue={50}
                  color="#10B981"
                  isDark={isDark}
                />
              </View>
            );
          })}
        </View>

        {/* Wind Direction Row */}
        <View style={styles.dataRow}>
          <View style={styles.labelCell}>
            <Text style={[styles.labelText, { color: isDark ? "#94A3B8" : "#64748B" }]}>
              Rüzgar yönü
            </Text>
          </View>
          {hourlyForecast.map((item, index) => {
            const isCurrentHour = index === currentHourIndex;
            return (
              <View key={`dir-${item.dt}`} style={styles.dataCell}>
                <View
                  style={[
                    styles.windDirectionContainer,
                    isCurrentHour && {
                      borderWidth: 2,
                      borderColor: "#6C63FF",
                      borderRadius: 8,
                      padding: 4,
                    },
                  ]}
                >
                  <WindDirectionArrow
                    deg={item.windDeg}
                    size={24}
                    color={isCurrentHour ? "#6C63FF" : "#3B82F6"}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingRight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  dayHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerCell: {
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  dataRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: "center",
    minHeight: 60,
  },
  labelCell: {
    minWidth: 120,
    paddingRight: 12,
    justifyContent: "center",
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  dataCell: {
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  iconWrapper: {
    padding: 4,
  },
  tempText: {
    fontSize: 14,
    fontWeight: "600",
  },
  valueText: {
    fontSize: 12,
    fontWeight: "500",
  },
  barContainer: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  windDirectionContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

