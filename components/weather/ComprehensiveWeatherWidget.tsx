import { View, Text, ActivityIndicator } from "react-native";
import { useMemo } from "react";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { CurrentWeather, getUVIndexLevel, UV_INDEX_LEVELS } from "./weatherTypes";
import { getTurkishWindName, getWindDirectionAbbr, getBeaufortScale, BEAUFORT_SCALE } from "./weatherTypes";
import { MeteoconsIcon } from "./MeteoconsIcon";
import { getBeaufortIcon } from "./weatherIcons";
import { getMeteoconsIcon } from "./weatherIconMap";
import { TablerIcon } from "@/components/icons/TablerIcon";

interface ComprehensiveWeatherWidgetProps {
  weather: CurrentWeather | null;
  cityName?: string;
  loading?: boolean;
  coordinates?: { latitude: number; longitude: number };
}

export function ComprehensiveWeatherWidget({
  weather,
  cityName,
  loading = false,
  coordinates,
}: ComprehensiveWeatherWidgetProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  // Compute all values - hooks must be called unconditionally
  const windSpeedKmh = useMemo(() => weather ? Math.round(weather.wind_speed * 3.6) : 0, [weather]);
  const windName = useMemo(() => weather ? getTurkishWindName(weather.wind_deg) : "", [weather]);
  const seaTemperature = useMemo(() => 
    weather?.seaTemperature !== undefined && weather?.seaTemperature !== null 
      ? weather.seaTemperature 
      : null, 
    [weather?.seaTemperature]
  );
  const waveHeight = useMemo(() => 
    weather?.waveHeight !== undefined && weather?.waveHeight !== null 
      ? weather.waveHeight 
      : null, 
    [weather?.waveHeight]
  );

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <View className={`rounded-2xl p-4 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
        <View className="flex-row items-center justify-center py-8">
          <ActivityIndicator size="small" color="#6C63FF" />
          <Text className={`ml-3 text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("loading")}
          </Text>
        </View>
      </View>
    );
  }

  if (!weather) {
    return (
      <View className={`rounded-2xl p-4 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
        <Text className={`text-sm text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
          Hava durumu verisi alınamadı
        </Text>
      </View>
    );
  }

  const beaufortScale = getBeaufortScale(windSpeedKmh);
  const windAbbr = getWindDirectionAbbr(weather.wind_deg);
  const windIcon = getBeaufortIcon(beaufortScale);
  const iconColor = isDark ? "#94A3B8" : "#64748B";
  
  // Temperature and weather condition
  const temp = Math.round(weather.temp);
  const feelsLike = Math.round(weather.feels_like);
  const humidity = weather.humidity;
  const condition = weather.weather[0]?.description || "Bilinmiyor";
  const weatherIconName = getMeteoconsIcon(weather.weather[0]?.icon);
  
  // UV Index
  const uvi = weather.uvi !== undefined ? getUVIndexLevel(weather.uvi) : null;
  const uvData = uvi !== null ? UV_INDEX_LEVELS[Math.min(uvi, 11)] : null;

  return (
    <View className={`rounded-2xl p-4 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className={`text-lg font-semibold ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
          Hava Durumu Detayları
        </Text>
        {cityName && (
          <View className="flex-row items-center">
            <TablerIcon name="map-pin" size={14} color={iconColor} strokeWidth={2} />
            <Text className={`text-sm ml-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {cityName}
            </Text>
          </View>
        )}
      </View>

      {/* Temperature Section - Prominent */}
      <View className={`mb-4 pb-4 border-b ${isDark ? "border-border-dark" : "border-border"}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-baseline mb-2">
              <Text className={`text-5xl font-bold ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                {temp}
              </Text>
              <Text className={`text-2xl ml-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                °C
              </Text>
            </View>
            <Text className={`text-sm capitalize mb-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {condition}
            </Text>
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center">
                <TablerIcon name="thermometer" size={14} color={iconColor} strokeWidth={2} />
                <Text className={`text-xs ml-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                  Hissedilen: {feelsLike}°
                </Text>
              </View>
            </View>
          </View>
          <MeteoconsIcon name={weatherIconName} size={80} />
        </View>
      </View>

      {/* Compact Info Row: Wind, Pressure, Humidity, UV Index, Sea Temp, Wave Height */}
      <View className="flex-row justify-between mb-4 pb-4 border-b" style={{ borderBottomColor: isDark ? "#2E303C" : "#E2E8F0" }}>
        {/* Wind */}
        <View className="flex-1 items-center" style={{ paddingHorizontal: 2 }}>
          <TablerIcon name="wind" size={18} color={iconColor} strokeWidth={2} />
          <Text className={`text-sm font-bold mt-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
            {windSpeedKmh}
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`} numberOfLines={1}>
            {windName}
          </Text>
          <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            km/s
          </Text>
        </View>

        {/* Air Pressure */}
        {weather.pressure !== undefined && weather.pressure !== null && (
          <View className="flex-1 items-center" style={{ paddingHorizontal: 2 }}>
            <TablerIcon name="gauge" size={18} color={iconColor} strokeWidth={2} />
            <Text className={`text-sm font-bold mt-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
              {Math.round(weather.pressure)}
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              hPa
            </Text>
            <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`} numberOfLines={1}>
              {weather.pressure < 1000 ? "Düşük" : weather.pressure > 1020 ? "Yüksek" : "Normal"}
            </Text>
          </View>
        )}

        {/* Humidity */}
        <View className="flex-1 items-center" style={{ paddingHorizontal: 2 }}>
          <TablerIcon name="droplet" size={18} color={iconColor} strokeWidth={2} />
          <Text className={`text-sm font-bold mt-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
            {humidity}%
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            Nem
          </Text>
        </View>

        {/* UV Index */}
        {uvData && (
          <View className="flex-1 items-center" style={{ paddingHorizontal: 2 }}>
            <TablerIcon name="sun-high" size={18} color={uvData.color} strokeWidth={2} />
            <Text className={`text-sm font-bold mt-1`} style={{ color: uvData.color }}>
              {uvi}
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`} numberOfLines={1}>
              {uvData.label}
            </Text>
            <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              UV
            </Text>
          </View>
        )}

        {/* Sea Temperature - Always show */}
        <View className="flex-1 items-center" style={{ paddingHorizontal: 2 }}>
          <TablerIcon name="temperature" size={18} color={iconColor} strokeWidth={2} />
          <Text className={`text-sm font-bold mt-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
            {seaTemperature !== null ? `${Math.round(seaTemperature)}°` : "N/A"}
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            Deniz
          </Text>
        </View>

        {/* Wave Height - Always show */}
        <View className="flex-1 items-center" style={{ paddingHorizontal: 2 }}>
          <TablerIcon name="waves" size={18} color={iconColor} strokeWidth={2} />
          <Text className={`text-sm font-bold mt-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
            {waveHeight !== null ? `${waveHeight.toFixed(1)}` : "N/A"}
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            Dalga
          </Text>
          {waveHeight !== null && (
            <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              m
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
