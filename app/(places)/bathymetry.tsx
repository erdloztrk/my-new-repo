/**
 * Detailed Bathymetry Analysis Page
 * Shows comprehensive depth analysis and shore fishing suitability evaluation with weather data
 */

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useBathymetryStore } from "@/stores/bathymetry-store";
import { getWeather } from "@/components/weather/weatherAPI";
import type { CurrentWeather } from "@/components/weather/weatherTypes";
import { ArrowLeft, Fish, Waves, Clock } from "phosphor-react-native";
import { logError } from "@/lib/logger";
import { getSeaRegion } from "@/components/weather/fishingUtils";
import type { SeaRegion } from "@/components/weather/fishingUtils";
import type { ShoreType } from "@/components/weather/fishProfiles";
import {
  computeOverallScore,
  explainScore,
  type WeatherSnapshot,
  type FactorExplanation,
} from "@/utils/fishing/fishingScore";
import { getSuitableSpecies, CANAKKALE_SPECIES } from "@/utils/fishing/canakkaleSpecies";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Helper function to generate concise scientific explanation with Çanakkale species
function generateDetailedExplanation(
  overallScore: { score: number; label: string; color: string; summary: string },
  factors: FactorExplanation[],
  weather: CurrentWeather,
  seaRegion: SeaRegion | null,
  depth: number | null // Noktaya özel derinlik (mutlak değer)
): string {
  const parts: string[] = [];
  
  // Check if Çanakkale region (Marmara)
  const isCanakkale = seaRegion === "Marmara";
  
  // Overall assessment - concise
  if (overallScore.score >= 8) {
    parts.push("Optimal koşullar: Tüm parametreler ideal aralıkta. Balık aktivitesi maksimum seviyede.");
  } else if (overallScore.score >= 6) {
    parts.push("İyi koşullar: Çoğu faktör uygun. Normal aktivite beklenir.");
  } else if (overallScore.score >= 4) {
    parts.push("Orta koşullar: Bazı faktörler optimal değil. Aktivite düşük olabilir.");
  } else {
    parts.push("Uygun değil: Güvenlik ve verimlilik açısından beklemek önerilir.");
  }
  
  // Key factors - concise
  const importantFactors = factors
    .filter((f) => Math.abs(f.impact) > 0.5)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 3);
  
  if (importantFactors.length > 0) {
    parts.push("\n\nFaktörler:");
    
    importantFactors.forEach((factor) => {
      if (factor.key === "wave") {
        const waveValue = parseFloat(factor.value.replace("m", "").trim());
        if (waveValue <= 0.8) {
          parts.push(`• Dalga (${factor.value}): Optimal. Güvenli ve verimli.`);
        } else if (waveValue <= 1.2) {
          parts.push(`• Dalga (${factor.value}): Kabul edilebilir. Dikkatli olun.`);
        } else if (waveValue <= 2.0) {
          parts.push(`• Dalga (${factor.value}): Yüksek. Aktivite azalır, güvenlik riski.`);
        } else {
          parts.push(`• Dalga (${factor.value}): Tehlikeli. Avlanma önerilmez.`);
        }
      } else if (factor.key === "wind") {
        const windValue = parseFloat(factor.value.replace("km/h", "").trim());
        if (windValue <= 25) {
          parts.push(`• Rüzgar (${factor.value}): Optimal. Aktiviteyi destekler.`);
        } else if (windValue <= 40) {
          parts.push(`• Rüzgar (${factor.value}): Orta. Davranışları etkileyebilir.`);
        } else if (windValue <= 60) {
          parts.push(`• Rüzgar (${factor.value}): Güçlü. Aktivite azalır.`);
        } else {
          parts.push(`• Rüzgar (${factor.value}): Çok güçlü. Tehlikeli.`);
        }
      } else if (factor.key === "sst") {
        const sstValue = parseFloat(factor.value.replace("°C", "").trim());
        if (sstValue >= 14 && sstValue <= 22) {
          parts.push(`• Deniz Sıcaklığı (${factor.value}): Optimal. Maksimum aktivite.`);
        } else if (sstValue >= 10 && sstValue <= 26) {
          parts.push(`• Deniz Sıcaklığı (${factor.value}): Kabul edilebilir.`);
        } else if (sstValue < 10) {
          parts.push(`• Deniz Sıcaklığı (${factor.value}): Soğuk. Aktivite düşük.`);
        } else {
          parts.push(`• Deniz Sıcaklığı (${factor.value}): Sıcak. Stres artar.`);
        }
      } else if (factor.key === "pressure") {
        const pressureValue = parseFloat(factor.value.replace("hPa", "").trim());
        if (pressureValue >= 1010 && pressureValue <= 1020) {
          parts.push(`• Basınç (${factor.value}): Optimal. Aktivite maksimum.`);
        } else if (pressureValue >= 1000 && pressureValue <= 1030) {
          parts.push(`• Basınç (${factor.value}): Normal.`);
        } else if (pressureValue < 1000) {
          parts.push(`• Basınç (${factor.value}): Düşük. Aktivite azalır.`);
        } else {
          parts.push(`• Basınç (${factor.value}): Yüksek. Genelde uygun.`);
        }
      }
    });
  }
  
  // Çanakkale species recommendations - noktaya özel (derinlik dahil)
  if (isCanakkale && weather && depth !== null) {
    const currentMonth = new Date().getMonth() + 1;
    const currentHour = new Date().getHours();
    const suitableSpecies = getSuitableSpecies(
      weather.seaTemperature ?? null,
      weather.waveHeight ?? null,
      Math.round(weather.wind_speed * 3.6),
      weather.pressure ?? null,
      depth, // Noktaya özel derinlik
      currentMonth,
      currentHour
    );
    
    if (suitableSpecies.length > 0) {
      parts.push("\n\nUygun Türler (Çanakkale):");
      suitableSpecies.slice(0, 3).forEach((species) => {
        parts.push(`\n• ${species.trName} (${species.latinName})`);
        parts.push(`  ${species.description}`);
        // Derinlik bilgisini ekle
        parts.push(`  Derinlik: ${species.conditions.depth.min}-${species.conditions.depth.max}m (Mevcut: ${depth.toFixed(1)}m)`);
        if (species.tips.length > 0) {
          parts.push(`  İpucu: ${species.tips[0]}`);
        }
      });
    }
  }
  
  // Recommendations - concise
  parts.push("\n\nÖneriler:");
  
  if (overallScore.score >= 6) {
    parts.push("• Şafak ve alacakaranlık saatleri en verimli.");
    parts.push("• Gelgit hareketlerini takip edin.");
  } else if (overallScore.score >= 4) {
    parts.push("• Derin veya korunaklı bölgeleri tercih edin.");
    parts.push("• Sabırlı ve uzun süreli strateji uygulayın.");
  } else {
    parts.push("• Koşulların iyileşmesini bekleyin.");
  }
  
  return parts.join("");
}

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
    loading,
    error,
    queryDepth,
  } = useBathymetryStore();
  
  // Extract depth value for species evaluation
  const depthValue = depth ? Math.abs(depth.depth_m) : null;

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

  // Compute sea region and shore type for fishing evaluation
  const seaRegion: SeaRegion | null = lat !== null && lon !== null ? getSeaRegion(lat, lon) : null;
  const shoreType: ShoreType = "unknown"; // Default, can be enhanced with location data
  
  // Create weather snapshot for fishing evaluation
  const weatherSnapshot: WeatherSnapshot | null = weather
    ? {
        airTempC: weather.temp,
        seaTempC: weather.seaTemperature ?? undefined,
        windKmh: Math.round(weather.wind_speed * 3.6),
        waveM: weather.waveHeight ?? undefined,
        pressureHpa: weather.pressure ?? undefined,
        cloudiness: undefined,
      }
    : null;
  
  // Compute overall fishing score
  const overallFishingScore =
    weatherSnapshot && lat !== null && lon !== null && weather
      ? computeOverallScore(weatherSnapshot, seaRegion, shoreType, weather, { latitude: lat, longitude: lon })
      : null;
  
  // Get factor explanations
  const fishingFactors =
    weatherSnapshot && lat !== null && lon !== null && overallFishingScore && weather
      ? explainScore(weatherSnapshot, "", seaRegion, shoreType, weather, { latitude: lat, longitude: lon })
      : [];
  
  // Generate detailed explanation - noktaya özel (derinlik dahil)
  const detailedExplanation =
    overallFishingScore && weather
      ? generateDetailedExplanation(overallFishingScore, fishingFactors, weather, seaRegion, depthValue)
      : "";
  
  // Current time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/map");
            }
          }}
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
              
              {/* Source Info */}
              {depth.source_used && (
                <View style={{ 
                  marginBottom: 12, 
                  padding: 10, 
                  backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#E2E8F0",
                }}>
                  <Text style={{ 
                    fontSize: 12, 
                    fontWeight: "600",
                    color: isDark ? "#94A3B8" : "#64748B",
                  }}>
                    {`📊 Kaynak: ${depth.source}`}
                  </Text>
                  {depth.confidence !== undefined && (
                    <Text style={{ 
                      fontSize: 11, 
                      color: isDark ? "#64748B" : "#94A3B8",
                      marginTop: 4,
                    }}>
                      Güven: {(depth.confidence * 100).toFixed(0)}%
                    </Text>
                  )}
                </View>
              )}
              
              {/* All Data Sources */}
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


            {/* Kıyı Balıkçılığı Uygunluk Değerlendirmesi */}
            {weather && overallFishingScore && (
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
                    Kıyı Balıkçılığı Uygunluk Değerlendirmesi
                  </Text>
                </View>

                {/* Current Time */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                    padding: 12,
                    backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "#1E293B" : "#E2E8F0",
                  }}
                >
                  <Clock size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 16,
                      fontWeight: "600",
                      color: isDark ? "#F8FAFC" : "#0F172A",
                    }}
                  >
                    Anlık Saat: {formatTime(currentTime)}
                  </Text>
                </View>

                {/* Overall Score */}
                <View
                  style={{
                    backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 2,
                    borderColor: overallFishingScore.color,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 8 }}>
                    <Text
                      style={{
                        fontSize: 48,
                        fontWeight: "900",
                        color: overallFishingScore.color,
                      }}
                    >
                      {overallFishingScore.score.toFixed(1)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "700",
                        marginLeft: 8,
                        color: isDark ? "#94A3B8" : "#64748B",
                      }}
                    >
                      /10
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      marginBottom: 4,
                      color: overallFishingScore.color,
                    }}
                  >
                    {overallFishingScore.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: isDark ? "#94A3B8" : "#64748B",
                    }}
                  >
                    {overallFishingScore.summary}
                  </Text>
                </View>

                {/* Detailed Explanation */}
                {detailedExplanation && (
                  <View
                    style={{
                      backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: isDark ? "#1E293B" : "#E2E8F0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        marginBottom: 12,
                        color: isDark ? "#F8FAFC" : "#0F172A",
                      }}
                    >
                      Detaylı Değerlendirme
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        lineHeight: 22,
                        color: isDark ? "#94A3B8" : "#64748B",
                      }}
                    >
                      {detailedExplanation}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

