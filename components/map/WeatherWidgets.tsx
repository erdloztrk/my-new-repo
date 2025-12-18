import React from "react";
import { View, Text, Modal, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets, EdgeInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
import { WeatherDataCard } from "@/components/weather/WeatherDataCard";
import type { CurrentWeather, WeatherResponse } from "@/components/weather/weatherTypes";

interface WeatherWidgetsProps {
  isWeatherSelectionMode: boolean;
  setIsWeatherSelectionMode: (value: boolean) => void;
  showWeatherModal: boolean;
  setShowWeatherModal: (value: boolean) => void;
  selectedWeatherLocation: { latitude: number; longitude: number } | null;
  setSelectedWeatherLocation: (location: { latitude: number; longitude: number } | null) => void;
  selectedWeatherData: { weather: CurrentWeather | null; forecastList: WeatherResponse["forecastList"] } | null;
  setSelectedWeatherData: (data: { weather: CurrentWeather | null; forecastList: WeatherResponse["forecastList"] } | null) => void;
  weatherModalLoading: boolean;
  setWeatherModalLoading: (value: boolean) => void;
  weather: CurrentWeather | null;
  forecastList: WeatherResponse["forecastList"];
  isDark: boolean;
  insets: EdgeInsets;
}

export function WeatherWidgets({
  isWeatherSelectionMode,
  setIsWeatherSelectionMode,
  showWeatherModal,
  setShowWeatherModal,
  selectedWeatherLocation,
  setSelectedWeatherLocation,
  selectedWeatherData,
  setSelectedWeatherData,
  weatherModalLoading,
  setWeatherModalLoading,
  weather,
  forecastList,
  isDark,
  insets,
}: WeatherWidgetsProps) {
  const handleCloseModal = () => {
    setShowWeatherModal(false);
    setSelectedWeatherLocation(null);
    setSelectedWeatherData(null);
  };

  const handleToggleWeatherMode = () => {
    setIsWeatherSelectionMode(!isWeatherSelectionMode);
    if (isWeatherSelectionMode) {
      // If disabling, close modal and reset
      setShowWeatherModal(false);
      setSelectedWeatherLocation(null);
      setSelectedWeatherData(null);
    }
  };

  return (
    <>
      {/* Weather Selection Mode Indicator */}
      {isWeatherSelectionMode && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 100,
            left: 16,
            right: 16,
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 999,
            borderWidth: 2,
            borderColor: "#6C63FF",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#6C63FF",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Haritada bir nokta seçin
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#94A3B8" : "#64748B",
              textAlign: "center",
            }}
          >
            Seçtiğiniz nokta için hava durumu bilgileri gösterilecek
          </Text>
        </View>
      )}

      {/* Weather Modal */}
      <Modal
        visible={showWeatherModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={handleCloseModal}
          />
          <View
            style={{
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
              paddingHorizontal: 20,
              maxHeight: "80%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: isDark ? "#F8FAFC" : "#0F172A",
                  }}
                >
                  Hava Durumu
                </Text>
                {selectedWeatherLocation && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: isDark ? "#94A3B8" : "#64748B",
                      marginTop: 4,
                    }}
                  >
                    {selectedWeatherLocation.latitude.toFixed(4)}, {selectedWeatherLocation.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={handleCloseModal}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDark ? "#334155" : "#F1F5F9",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <X size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="bold" />
              </Pressable>
            </View>

            {/* Loading Indicator */}
            {weatherModalLoading && (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text
                  style={{
                    marginTop: 16,
                    fontSize: 14,
                    color: isDark ? "#94A3B8" : "#64748B",
                  }}
                >
                  Hava durumu verileri yükleniyor...
                </Text>
              </View>
            )}

            {/* Weather Widget */}
            {selectedWeatherData?.weather && !weatherModalLoading && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <WeatherDataCard weather={selectedWeatherData.weather} forecastList={selectedWeatherData.forecastList} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

