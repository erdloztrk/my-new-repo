/**
 * Detailed Bathymetry Analysis Page
 * Shows comprehensive depth analysis, fish species analysis with weather data
 */

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useBathymetryStore } from "@/stores/bathymetry-store";
import { getWeather } from "@/components/weather/weatherAPI";
import type { CurrentWeather } from "@/components/weather/weatherTypes";
import { ArrowLeft, Fish, Waves, Thermometer, Wind, Gauge, Moon } from "phosphor-react-native";
import { TablerIcon } from "@/components/icons/TablerIcon";
import { logError } from "@/lib/logger";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SPECIES_LABELS: Record<string, string> = {
  chipura: "Çipura",
  levrek: "Levrek",
  sargoz: "Sargoz",
  karagoz: "Karagöz",
  mirmir: "Mırmır",
};

export default function BathymetryDetailPage() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams<{ lat: string; lon: string }>();
  
  const lat = params.lat ? parseFloat(params.lat) : null;
  const lon = params.lon ? parseFloat(params.lon) : null;
  
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  
  const {
    depth,
    scores,
    loading,
    error,
    queryDepth,
    queryScore,
  } = useBathymetryStore();

  // Set selected coord and fetch data
  useEffect(() => {
    if (lat !== null && lon !== null) {
      const coord = { lat, lon };
      useBathymetryStore.getState().setSelectedCoord(coord);
      queryDepth(coord.lat, coord.lon);
    }
  }, [lat, lon]);

  // Fetch weather data
  useEffect(() => {
    if (lat !== null && lon !== null) {
      setLoadingWeather(true);
      getWeather({ latitude: lat, longitude: lon })
        .then((weatherData) => {
          if (weatherData) {
            setWeather(weatherData.current);
          }
        })
        .catch((err) => {
          logError("Error fetching weather:", err);
        })
        .finally(() => {
          setLoadingWeather(false);
        });
    }
  }, [lat, lon]);

  // Fetch scores when depth and weather are available
  useEffect(() => {
    if (lat !== null && lon !== null && depth && weather && !loading) {
      const weatherData = {
        temp: weather.temp,
        windSpeed: weather.wind_speed,
        windDeg: weather.wind_deg,
        pressure: weather.pressure,
        uvi: weather.uvi,
        seaTemperature: weather.seaTemperature,
        waveHeight: weather.waveHeight,
        timeOfDayHour: new Date().getHours(),
        moonPhase: "new_moon", // TODO: Calculate actual moon phase
      };
      
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Fetch scores for all species
      const species: Array<"chipura" | "levrek" | "sargoz" | "karagoz" | "mirmir"> = [
        "chipura",
        "levrek",
        "sargoz",
        "karagoz",
        "mirmir",
      ];
      
      species.forEach((spec) => {
        queryScore(lat, lon, spec, weatherData);
      });
    }
  }, [lat, lon, depth, weather, loading]);

  if (lat === null || lon === null) {
    return (
      <View className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={`text-lg ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Geçersiz koordinatlar
          </Text>
        </View>
      </View>
    );
  }

  const getZoneColor = (zoneLabel: string) => {
    switch (zoneLabel) {
      case "optimal":
        return "#10B981";
      case "shallow":
        return "#3B82F6";
      case "deep":
        return "#F59E0B";
      case "land":
        return "#EF4444";
      default:
        return isDark ? "#94A3B8" : "#64748B";
    }
  };

  const getZoneLabel = (zoneLabel: string) => {
    switch (zoneLabel) {
      case "optimal":
        return "İDEAL";
      case "shallow":
        return "İYİ";
      case "deep":
        return "ORTA";
      case "land":
        return "KÖTÜ";
      default:
        return zoneLabel.toUpperCase();
    }
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#1E293B" : "#E2E8F0",
          backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <ArrowLeft size={20} color={isDark ? "#F8FAFC" : "#0F172A"} weight="bold" />
        </Pressable>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: isDark ? "#F8FAFC" : "#0F172A",
          }}
        >
          Derinlik Analizi
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && !depth && (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={{ marginTop: 16, color: isDark ? "#94A3B8" : "#64748B" }}>
              Derinlik verileri yükleniyor...
            </Text>
          </View>
        )}

        {error && (
          <View
            style={{
              backgroundColor: isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#FECACA",
            }}
          >
            <Text style={{ color: isDark ? "#FCA5A5" : "#DC2626", fontWeight: "600" }}>
              Hata: {error}
            </Text>
          </View>
        )}

        {depth && (
          <>
            {/* Depth Card */}
            <View
              style={{
                backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#E2E8F0",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Waves size={24} color="#3B82F6" weight="fill" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    marginLeft: 12,
                    color: isDark ? "#F8FAFC" : "#0F172A",
                  }}
                >
                  Deniz Derinliği
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "900",
                  color: "#3B82F6",
                  marginBottom: 8,
                }}
              >
                {Math.abs(depth.depth_m).toFixed(1)} m
              </Text>
              <Text style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 14, marginBottom: 12 }}>
                Koordinat: {lat.toFixed(6)}, {lon.toFixed(6)}
              </Text>
              
              {/* Both Data Sources */}
              <View style={{ marginTop: 12, gap: 8 }}>
                {/* EMODnet Data */}
                {depth.emodnet ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#10B981",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 16, marginRight: 8 }}>📊</Text>
                      <View>
                        <Text style={{ 
                          color: "#10B981", 
                          fontSize: 14, 
                          fontWeight: "700",
                          marginBottom: 2
                        }}>
                          EMODnet
                        </Text>
                        <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11 }}>
                          ~{depth.emodnet.resolution_m}m çözünürlük
                        </Text>
                      </View>
                    </View>
                    <Text style={{ 
                      color: "#10B981", 
                      fontSize: 18, 
                      fontWeight: "700" 
                    }}>
                      {Math.abs(depth.emodnet.depth_m).toFixed(1)} m
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#E2E8F0",
                      opacity: 0.5,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 16, marginRight: 8 }}>📊</Text>
                      <View>
                        <Text style={{ 
                          color: isDark ? "#64748B" : "#94A3B8", 
                          fontSize: 14, 
                          fontWeight: "700",
                          marginBottom: 2
                        }}>
                          EMODnet
                        </Text>
                        <Text style={{ color: isDark ? "#475569" : "#CBD5E1", fontSize: 11 }}>
                          Veri yüklenmedi
                        </Text>
                      </View>
                    </View>
                    <Text style={{ 
                      color: isDark ? "#64748B" : "#94A3B8", 
                      fontSize: 14, 
                      fontStyle: "italic"
                    }}>
                      -
                    </Text>
                  </View>
                )}
                
                {/* Copernicus Data */}
                {depth.copernicus ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#8B5CF6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 16, marginRight: 8 }}>🛰️</Text>
                      <View>
                        <Text style={{ 
                          color: "#8B5CF6", 
                          fontSize: 14, 
                          fontWeight: "700",
                          marginBottom: 2
                        }}>
                          Copernicus
                        </Text>
                        <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11 }}>
                          ~{depth.copernicus.resolution_m}m çözünürlük
                        </Text>
                      </View>
                    </View>
                    <Text style={{ 
                      color: "#8B5CF6", 
                      fontSize: 18, 
                      fontWeight: "700" 
                    }}>
                      {Math.abs(depth.copernicus.depth_m).toFixed(1)} m
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#E2E8F0",
                      opacity: 0.5,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 16, marginRight: 8 }}>🛰️</Text>
                      <View>
                        <Text style={{ 
                          color: isDark ? "#64748B" : "#94A3B8", 
                          fontSize: 14, 
                          fontWeight: "700",
                          marginBottom: 2
                        }}>
                          Copernicus
                        </Text>
                        <Text style={{ color: isDark ? "#475569" : "#CBD5E1", fontSize: 11 }}>
                          Veri yüklenmedi
                        </Text>
                      </View>
                    </View>
                    <Text style={{ 
                      color: isDark ? "#64748B" : "#94A3B8", 
                      fontSize: 14, 
                      fontStyle: "italic"
                    }}>
                      -
                    </Text>
                  </View>
                )}
                
                {/* GEBCO Data */}
                {depth.gebco && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#F59E0B",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 16, marginRight: 8 }}>🌊</Text>
                      <View>
                        <Text style={{ 
                          color: "#F59E0B", 
                          fontSize: 14, 
                          fontWeight: "700",
                          marginBottom: 2
                        }}>
                          GEBCO
                        </Text>
                        <Text style={{ color: isDark ? "#64748B" : "#94A3B8", fontSize: 11 }}>
                          ~{depth.gebco.resolution_m}m çözünürlük
                        </Text>
                      </View>
                    </View>
                    <Text style={{ 
                      color: "#F59E0B", 
                      fontSize: 18, 
                      fontWeight: "700" 
                    }}>
                      {Math.abs(depth.gebco.depth_m).toFixed(1)} m
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Weather Data Card */}
            {weather && (
              <View
                style={{
                  backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#E2E8F0",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 16,
                    color: isDark ? "#F8FAFC" : "#0F172A",
                  }}
                >
                  Hava Durumu
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {weather.temp !== undefined && (
                    <View style={{ flex: 1, minWidth: "45%" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <Thermometer size={16} color="#EF4444" weight="fill" />
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 12,
                            fontWeight: "600",
                            color: isDark ? "#94A3B8" : "#64748B",
                          }}
                        >
                          Sıcaklık
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: isDark ? "#F8FAFC" : "#0F172A",
                        }}
                      >
                        {Math.round(weather.temp)}°C
                      </Text>
                    </View>
                  )}
                  {weather.wind_speed !== undefined && (
                    <View style={{ flex: 1, minWidth: "45%" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <Wind size={16} color="#3B82F6" weight="fill" />
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 12,
                            fontWeight: "600",
                            color: isDark ? "#94A3B8" : "#64748B",
                          }}
                        >
                          Rüzgar
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: isDark ? "#F8FAFC" : "#0F172A",
                        }}
                      >
                        {Math.round(weather.wind_speed * 3.6)} km/h
                      </Text>
                    </View>
                  )}
                  {weather.pressure !== undefined && (
                    <View style={{ flex: 1, minWidth: "45%" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <Gauge size={16} color="#10B981" weight="fill" />
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 12,
                            fontWeight: "600",
                            color: isDark ? "#94A3B8" : "#64748B",
                          }}
                        >
                          Basınç
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: isDark ? "#F8FAFC" : "#0F172A",
                        }}
                      >
                        {weather.pressure} hPa
                      </Text>
                    </View>
                  )}
                  {weather.seaTemperature !== undefined && (
                    <View style={{ flex: 1, minWidth: "45%" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <Waves size={16} color="#06B6D4" weight="fill" />
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 12,
                            fontWeight: "600",
                            color: isDark ? "#94A3B8" : "#64748B",
                          }}
                        >
                          Deniz Sıcaklığı
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: isDark ? "#F8FAFC" : "#0F172A",
                        }}
                      >
                        {weather.seaTemperature}°C
                      </Text>
                    </View>
                  )}
                  {weather.waveHeight !== undefined && (
                    <View style={{ flex: 1, minWidth: "45%" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <Waves size={16} color="#8B5CF6" weight="fill" />
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 12,
                            fontWeight: "600",
                            color: isDark ? "#94A3B8" : "#64748B",
                          }}
                        >
                          Dalga Yüksekliği
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: isDark ? "#F8FAFC" : "#0F172A",
                        }}
                      >
                        {weather.waveHeight} m
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Species Scores */}
            <View
              style={{
                backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#E2E8F0",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Fish size={24} color="#10B981" weight="fill" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    marginLeft: 12,
                    color: isDark ? "#F8FAFC" : "#0F172A",
                  }}
                >
                  Balık Türü Analizi
                </Text>
              </View>

              {Object.entries(scores).map(([species, scoreData]) => {
                if (!scoreData) return null;
                
                const zoneColor = getZoneColor(scoreData.zone_label);
                const zoneDisplayLabel = getZoneLabel(scoreData.zone_label);
                
                return (
                  <View
                    key={species}
                    style={{
                      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: isDark ? "#1E293B" : "#E2E8F0",
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: isDark ? "#F8FAFC" : "#0F172A",
                        }}
                      >
                        {SPECIES_LABELS[species] || species}
                      </Text>
                      <View
                        style={{
                          backgroundColor: `${zoneColor}20`,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: zoneColor,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: zoneColor,
                            textTransform: "uppercase",
                          }}
                        >
                          {zoneDisplayLabel}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, color: isDark ? "#94A3B8" : "#64748B" }}>
                          Skor
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: isDark ? "#F8FAFC" : "#0F172A",
                          }}
                        >
                          {scoreData.score_0_100}/100
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 8,
                          backgroundColor: isDark ? "#1E293B" : "#E2E8F0",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            height: "100%",
                            width: `${scoreData.score_0_100}%`,
                            backgroundColor: zoneColor,
                          }}
                        />
                      </View>
                    </View>

                    {scoreData.reasons && scoreData.reasons.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        {scoreData.reasons.slice(0, 2).map((reason, idx) => (
                          <Text key={idx} style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#64748B", marginTop: 4 }}>
                            • {reason.message}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}

              {Object.keys(scores).length === 0 && !loading && (
                <Text style={{ color: isDark ? "#94A3B8" : "#64748B", textAlign: "center", paddingVertical: 20 }}>
                  Tür skorları yükleniyor...
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

