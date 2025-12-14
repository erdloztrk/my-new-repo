/**
 * Depth widget component for map screen.
 * Displays depth, species score, and recommendations.
 */

import React, { useEffect } from "react";
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
}

export function DepthWidget({ onClose, weather }: DepthWidgetProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  
  const {
    selectedCoord,
    depth,
    scores,
    loading,
    error,
    queryScore,
  } = useBathymetryStore();


  // Load all species scores when depth is available
  useEffect(() => {
    if (selectedCoord && depth && !loading) {
      // Convert CurrentWeather to WeatherData format
      const weatherData: WeatherData | undefined = weather ? {
        seaTemperature: weather.seaTemperature,
        windSpeed: weather.wind_speed,
        waveHeight: weather.waveHeight,
        pressure: weather.pressure,
        uvi: weather.uvi,
      } : undefined;
      
      const speciesList: SpeciesKey[] = ["chipura", "levrek", "sargoz", "karagoz", "mirmir"];
      speciesList.forEach((species) => {
        if (!scores[species]) {
          queryScore(selectedCoord.lat, selectedCoord.lon, species, weatherData);
        }
      });
    }
  }, [selectedCoord, depth, loading, scores, queryScore, weather]);

  if (!selectedCoord) {
    return null;
  }

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
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 0,
        height: SCREEN_HEIGHT * 0.80,
        maxHeight: SCREEN_HEIGHT * 0.80,
        minHeight: 400,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 24,
      }}
    >
      {/* Handle bar */}
      <View className="items-center py-3">
        <View
          className="w-14 h-1.5 rounded-full"
          style={{ backgroundColor: isDark ? "#334155" : "#CBD5E1" }}
        />
      </View>

      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-6 pb-5"
        style={{ 
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1E293B" : "#E2E8F0",
          paddingTop: 4,
        }}
      >
        <View className="flex-row items-center">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <TablerIcon name="waves" size={22} color={isDark ? "#60A5FA" : "#3B82F6"} strokeWidth={2.5} />
          </View>
          <View>
            <Text 
              className="text-xs font-bold tracking-wider uppercase"
              style={{ 
                color: isDark ? "#64748B" : "#64748B",
                letterSpacing: 1.2,
              }}
            >
              DERİNLİK ANALİZİ
            </Text>
            <Text 
              className="text-lg font-bold mt-0.5"
              style={{ 
                color: isDark ? "#F8FAFC" : "#0F172A",
              }}
            >
              Deniz Derinliği
            </Text>
          </View>
        </View>
        {onClose && (
          <Pressable 
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="bold" />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {loading && !depth && (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text 
              className="text-sm font-medium mt-4"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Derinlik sorgulanıyor...
            </Text>
          </View>
        )}

        {error && (
          <View 
            style={{
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
              borderWidth: 1,
              borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#FECACA",
            }}
          >
            <Text 
              className="text-sm font-bold mb-2 uppercase tracking-wide"
              style={{ color: isDark ? "#FCA5A5" : "#DC2626" }}
            >
              HATA
            </Text>
            <Text 
              className="text-xs leading-5"
              style={{ color: isDark ? "#F87171" : "#991B1B" }}
            >
              {error}
            </Text>
            {error.includes("Backend servisi çalışmıyor") && (
              <Text 
                className="text-xs mt-3 leading-5 font-medium"
                style={{ color: isDark ? "#F87171" : "#991B1B" }}
              >
                Backend'i başlatmak için: cd backend && uvicorn src.main:app --reload
              </Text>
            )}
          </View>
        )}

        {depth && (
          <>
            {/* Depth Display - Hero Card */}
            <View 
              style={{
                borderRadius: 20,
                padding: 24,
                marginBottom: 28,
                backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#E2E8F0",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text 
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: isDark ? "#64748B" : "#64748B", letterSpacing: 1.5 }}
                  >
                    MEVCUT DERİNLİK
                  </Text>
                  <View className="flex-row items-baseline">
                    <Text 
                      className="text-5xl font-black"
                      style={{ 
                        color: isDark ? "#F8FAFC" : "#0F172A",
                        lineHeight: 56,
                      }}
                    >
                      {Math.abs(depth.depth_m).toFixed(1)}
                    </Text>
                    <Text 
                      className="text-2xl font-bold ml-2"
                      style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                    >
                      m
                    </Text>
                  </View>
                </View>
                <View 
                  style={{
                    alignItems: "flex-end",
                    paddingLeft: 16,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      marginBottom: 6,
                    }}
                  >
                    <Text 
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: isDark ? "#64748B" : "#64748B" }}
                    >
                      {depth.source === "MOCK_DATA" ? "TEST VERİSİ" : depth.source}
                    </Text>
                  </View>
                  {depth.source !== "MOCK_DATA" && (
                    <Text 
                      className="text-xs font-medium"
                      style={{ color: isDark ? "#64748B" : "#94A3B8" }}
                    >
                      ~{depth.resolution_m}m çözünürlük
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Species Scores */}
            <View className="mb-2">
              <Text 
                className="text-xs font-bold uppercase tracking-wider mb-4"
                style={{ 
                  color: isDark ? "#64748B" : "#64748B",
                  letterSpacing: 1.5,
                }}
              >
                TÜR BAZLI SKORLAR
              </Text>
              
              {(["chipura", "levrek", "sargoz", "karagoz", "mirmir"] as SpeciesKey[]).map((species) => {
                const score = scores[species];
                const scoreValue = score?.score_0_100 ?? null;
                const scoreColor = getScoreColor(scoreValue);
                
                return (
                  <View
                    key={species}
                    style={{
                      borderRadius: 16,
                      padding: 18,
                      marginBottom: 14,
                      backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#E2E8F0",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Fish size={20} color={scoreColor} weight="fill" />
                        </View>
                        <Text 
                          className="text-base font-bold"
                          style={{ 
                            color: isDark ? "#F8FAFC" : "#0F172A",
                          }}
                        >
                          {SPECIES_LABELS[species]}
                        </Text>
                      </View>
                      {score ? (
                        <View className="flex-row items-baseline">
                          <Text
                            className="text-2xl font-black"
                            style={{ 
                              color: scoreColor,
                              lineHeight: 28,
                            }}
                          >
                            {score.score_0_100.toFixed(0)}
                          </Text>
                          <Text 
                            className="text-sm font-bold ml-1"
                            style={{ color: isDark ? "#64748B" : "#94A3B8" }}
                          >
                            /100
                          </Text>
                        </View>
                      ) : (
                        <ActivityIndicator size="small" color="#3B82F6" />
                      )}
                    </View>
                    
                    {score && (
                      <>
                        {/* Progress Bar */}
                        <View 
                          style={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                            marginBottom: 12,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              height: "100%",
                              width: `${score.score_0_100}%`,
                              backgroundColor: scoreColor,
                              borderRadius: 3,
                            }}
                          />
                        </View>
                        
                        {/* Zone & Reason */}
                        <View>
                          <View className="flex-row items-center mb-2">
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: getZoneColor(score.zone_label),
                                marginRight: 8,
                              }}
                            />
                            <Text 
                              className="text-xs font-bold uppercase tracking-wide"
                              style={{ 
                                color: isDark ? "#94A3B8" : "#64748B",
                                letterSpacing: 0.5,
                              }}
                            >
                              {score.zone_label === "optimal" ? "OPTİMAL" : 
                               score.zone_label === "shallow" ? "SIĞ" :
                               score.zone_label === "deep" ? "DERİN" : "KARA"}
                            </Text>
                          </View>
                          
                          {score.reasons.length > 0 && (
                            <Text 
                              className="text-xs leading-5"
                              style={{ 
                                color: isDark ? "#94A3B8" : "#64748B",
                                lineHeight: 18,
                              }}
                            >
                              {score.reasons[0].message}
                            </Text>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

