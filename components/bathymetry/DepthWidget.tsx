/**
 * Depth widget component for map screen.
 * Displays depth, species score, and recommendations in a compact table format.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, Pressable, ScrollView, Dimensions } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useBathymetryStore } from "@/stores/bathymetry-store";
import type { SpeciesKey, WeatherData } from "@/types/bathymetry";
import type { CurrentWeather } from "@/components/weather/weatherTypes";
import { TablerIcon } from "@/components/icons/TablerIcon";
import { X, Fish } from "phosphor-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SPECIES_LABELS: Record<SpeciesKey, string> = {
  chipura: "Çipura",
  levrek: "Levrek",
  sargoz: "Sargoz",
  karagoz: "Karagöz",
  mirmir: "Mırmır",
};

interface DepthWidgetProps {
  onClose?: () => void;
  weather?: CurrentWeather | null;
  selectedCoord?: { lat: number; lon: number } | null;
}

export function DepthWidget({ onClose, weather, selectedCoord: propSelectedCoord }: DepthWidgetProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  
  const {
    selectedCoord: storeSelectedCoord,
    depth,
    scores,
    loading,
    error,
    queryScore,
  } = useBathymetryStore();

  // Use prop if provided, otherwise use store
  const selectedCoord = propSelectedCoord ?? storeSelectedCoord;

  // Track which coord+weather combination we've fetched scores for
  const fetchedKeyRef = useRef<string | null>(null);

  // Load all species scores when depth is available
  useEffect(() => {
    if (selectedCoord && depth && !loading && weather) {
      // Create a unique key for this coord+weather combination
      const fetchKey = `${selectedCoord.lat.toFixed(6)},${selectedCoord.lon.toFixed(6)},${weather.wind_speed?.toFixed(1) || '0'}`;
      
      // Only fetch if this is a new combination
      if (fetchedKeyRef.current !== fetchKey) {
        fetchedKeyRef.current = fetchKey;
        
        // Convert CurrentWeather to WeatherData format
        const weatherData: WeatherData = {
          seaTemperature: weather.seaTemperature,
          windSpeed: weather.wind_speed,
          waveHeight: weather.waveHeight,
          pressure: weather.pressure,
          uvi: weather.uvi,
        };
        
        const speciesList: SpeciesKey[] = ["chipura", "levrek", "sargoz", "karagoz", "mirmir"];
        const currentScores = scores; // Capture at fetch time
        speciesList.forEach((species) => {
          // Only fetch if score doesn't exist
          if (!currentScores[species]) {
            queryScore(selectedCoord.lat, selectedCoord.lon, species, weatherData);
          }
        });
      }
    }
  }, [selectedCoord?.lat, selectedCoord?.lon, depth?.depth_m, loading, queryScore, weather?.wind_speed]);

  // Show widget even if selectedCoord is null (will show loading state)
  // This ensures widget opens immediately when user taps on map

  const getScoreColor = (score: number | null): string => {
    if (score === null) return isDark ? "#94A3B8" : "#64748B";
    if (score >= 80) return "#10B981"; // green
    if (score >= 60) return "#F59E0B"; // amber
    if (score >= 40) return "#EF4444"; // red
    return "#6B7280"; // gray
  };

  const getZoneColor = (zone: string): string => {
    switch (zone) {
      case "optimal":
        return "#10B981";
      case "shallow":
        return "#F59E0B";
      case "deep":
        return "#EF4444";
      case "land":
        return "#6B7280";
      default:
        return isDark ? "#94A3B8" : "#64748B";
    }
  };

  return (
    <View
      style={{
        backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
        borderRadius: 16,
        minHeight: 250,
        maxHeight: 350,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-3 py-2"
        style={{ 
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1E293B" : "#E2E8F0",
        }}
      >
        <View className="flex-row items-center">
          <TablerIcon name="waves" size={16} color={isDark ? "#60A5FA" : "#3B82F6"} strokeWidth={2} />
          <Text 
            className="text-xs font-bold ml-2"
            style={{ 
              color: isDark ? "#F8FAFC" : "#0F172A",
            }}
          >
            Derinlik Analizi
          </Text>
        </View>
        {onClose && (
          <Pressable 
            onPress={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color={isDark ? "#94A3B8" : "#64748B"} weight="bold" />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1, minHeight: 200 }}
        contentContainerStyle={{ 
          padding: 12,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {(!selectedCoord || (loading && !depth)) && (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text 
              className="text-xs font-medium mt-2"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              {!selectedCoord ? "Konum seçiliyor..." : "Yükleniyor..."}
            </Text>
          </View>
        )}

        {error && (
          <View 
            style={{
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
              borderWidth: 1,
              borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#FECACA",
            }}
          >
            <Text 
              className="text-xs font-bold mb-1"
              style={{ color: isDark ? "#FCA5A5" : "#DC2626" }}
            >
              HATA
            </Text>
            <Text 
              className="text-xs leading-4"
              style={{ color: isDark ? "#F87171" : "#991B1B" }}
            >
              {error}
            </Text>
          </View>
        )}

        {selectedCoord && depth && (
          <View
            style={{
              borderRadius: 12,
              backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#E2E8F0",
              overflow: "hidden",
            }}
          >
            {/* Table Header */}
            <View 
              style={{
                flexDirection: "row",
                backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "#1E293B" : "#E2E8F0",
                paddingVertical: 8,
                paddingHorizontal: 10,
              }}
            >
              <Text 
                style={{ 
                  flex: 1, 
                  fontSize: 10, 
                  fontWeight: "700", 
                  color: isDark ? "#94A3B8" : "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Tür
              </Text>
              <Text 
                style={{ 
                  width: 55, 
                  fontSize: 10, 
                  fontWeight: "700", 
                  color: isDark ? "#94A3B8" : "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  textAlign: "right",
                }}
              >
                Derinlik
              </Text>
              <Text 
                style={{ 
                  width: 45, 
                  fontSize: 10, 
                  fontWeight: "700", 
                  color: isDark ? "#94A3B8" : "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  textAlign: "right",
                }}
              >
                Skor
              </Text>
              <Text 
                style={{ 
                  width: 50, 
                  fontSize: 10, 
                  fontWeight: "700", 
                  color: isDark ? "#94A3B8" : "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  textAlign: "center",
                }}
              >
                Bölge
              </Text>
            </View>

            {/* Depth Row */}
            <View 
              style={{
                flexDirection: "row",
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "#1E293B" : "#E2E8F0",
                alignItems: "center",
              }}
            >
              <Text 
                style={{ 
                  flex: 1, 
                  fontSize: 11, 
                  fontWeight: "600", 
                  color: isDark ? "#F8FAFC" : "#0F172A",
                }}
              >
                Derinlik
              </Text>
              <Text 
                style={{ 
                  width: 55, 
                  fontSize: 11, 
                  fontWeight: "600", 
                  color: isDark ? "#60A5FA" : "#3B82F6",
                  textAlign: "right",
                }}
              >
                {Math.abs(depth.depth_m).toFixed(1)}m
              </Text>
              <Text 
                style={{ 
                  width: 45, 
                  fontSize: 11, 
                  color: isDark ? "#94A3B8" : "#64748B",
                  textAlign: "right",
                }}
              >
                -
              </Text>
              {/* Data source indicator */}
              <View style={{ width: 50, alignItems: "center" }}>
                <Text 
                  style={{ 
                    fontSize: 8, 
                    color: depth.source === "EMODNET_2024" ? "#10B981" : "#F59E0B",
                    fontWeight: "600",
                  }}
                >
                  {depth.source === "EMODNET_2024" ? "📊" : "🌊"}
                </Text>
              </View>
            </View>
            
            {/* Both Data Sources Info */}
            {depth && (depth.emodnet || depth.gebco) && (
              <View 
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#1E293B" : "#E2E8F0",
                  gap: 6,
                }}
              >
                {/* EMODnet */}
                {depth.emodnet && (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 10, marginRight: 6 }}>📊</Text>
                      <Text style={{ 
                        fontSize: 9, 
                        color: "#10B981",
                        fontWeight: "600",
                        marginRight: 4,
                      }}>
                        EMODnet
                      </Text>
                      <Text style={{ 
                        fontSize: 9, 
                        color: isDark ? "#64748B" : "#94A3B8",
                      }}>
                        ({depth.emodnet.resolution_m}m)
                      </Text>
                    </View>
                    <Text style={{ 
                      fontSize: 10, 
                      color: "#10B981",
                      fontWeight: "600",
                    }}>
                      {Math.abs(depth.emodnet.depth_m).toFixed(1)}m
                    </Text>
                  </View>
                )}
                
                {/* GEBCO */}
                {depth.gebco && (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 10, marginRight: 6 }}>🌊</Text>
                      <Text style={{ 
                        fontSize: 9, 
                        color: "#F59E0B",
                        fontWeight: "600",
                        marginRight: 4,
                      }}>
                        GEBCO
                      </Text>
                      <Text style={{ 
                        fontSize: 9, 
                        color: isDark ? "#64748B" : "#94A3B8",
                      }}>
                        ({depth.gebco.resolution_m}m)
                      </Text>
                    </View>
                    <Text style={{ 
                      fontSize: 10, 
                      color: "#F59E0B",
                      fontWeight: "600",
                    }}>
                      {Math.abs(depth.gebco.depth_m).toFixed(1)}m
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Species rows */}
            {Object.entries(SPECIES_LABELS).map(([speciesKey, speciesLabel]) => {
              const scoreData = scores[speciesKey as SpeciesKey];
              if (!scoreData) return null;
              
              return (
                <View 
                  key={speciesKey}
                  style={{
                    flexDirection: "row",
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#1E293B" : "#E2E8F0",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                    <TablerIcon name="fish" size={14} color={isDark ? "#60A5FA" : "#3B82F6"} />
                    <Text 
                      style={{ 
                        fontSize: 11, 
                        fontWeight: "600", 
                        color: isDark ? "#F8FAFC" : "#0F172A",
                        marginLeft: 6,
                      }}
                    >
                      {speciesLabel}
                    </Text>
                  </View>
                  <Text 
                    style={{ 
                      width: 55, 
                      fontSize: 11, 
                      color: isDark ? "#94A3B8" : "#64748B",
                      textAlign: "right",
                    }}
                  >
                    {Math.abs(scoreData.depth_m).toFixed(1)}m
                  </Text>
                  <Text 
                    style={{ 
                      width: 45, 
                      fontSize: 11, 
                      fontWeight: "600",
                      color: getScoreColor(scoreData.score_0_100),
                      textAlign: "right",
                    }}
                  >
                    {scoreData.score_0_100.toFixed(0)}
                  </Text>
                  <View 
                    style={{ 
                      width: 50, 
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: getZoneColor(scoreData.zone_label || "unknown"),
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
