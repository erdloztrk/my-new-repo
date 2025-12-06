import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/theme-store";
import { CurrentWeather } from "./weatherTypes";
import { MeteoconsIcon } from "./MeteoconsIcon";
import { getMeteoconsIcon } from "./weatherIconMap";

interface WeatherWidgetProps {
  weather: CurrentWeather | null;
  cityName?: string;
  loading?: boolean;
}

export function WeatherWidget({
  weather,
  cityName = "Konum",
  loading = false,
}: WeatherWidgetProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View className={`rounded-2xl p-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className={`h-3 rounded w-20 mb-1.5 ${isDark ? "bg-muted-dark" : "bg-muted"}`} />
            <View className={`h-6 rounded w-28 mb-1.5 ${isDark ? "bg-muted-dark" : "bg-muted"}`} />
            <View className={`h-2.5 rounded w-36 ${isDark ? "bg-muted-dark" : "bg-muted"}`} />
          </View>
          <View className={`w-12 h-12 rounded-full ${isDark ? "bg-muted-dark" : "bg-muted"}`} />
        </View>
      </View>
    );
  }

  if (!weather) {
    return (
      <View className={`rounded-2xl p-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
        <Text className={`text-xs text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
          Veri alınamadı
        </Text>
      </View>
    );
  }

  const iconName = getMeteoconsIcon(weather.weather[0]?.icon);
  const temp = Math.round(weather.temp);
  const condition = weather.weather[0]?.description || "Bilinmiyor";
  const humidity = weather.humidity;
  const windSpeed = Math.round(weather.wind_speed * 3.6); // m/s to km/h

  return (
    <View className={`rounded-2xl p-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className={`text-xs mb-0.5 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {cityName}
          </Text>
          <View className="flex-row items-baseline">
            <Text className={`text-3xl font-bold ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
              {temp}°
            </Text>
            <Text className={`text-sm capitalize ml-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {condition}
            </Text>
          </View>
        </View>
        <MeteoconsIcon name={iconName} size={56} />
      </View>

      <View className={`flex-row items-center justify-between pt-2 border-t ${isDark ? "border-border-dark" : "border-border"}`}>
        <View className="flex-row items-center">
          <Ionicons
            name="water-outline"
            size={14}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
          <Text className={`text-xs ml-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            %{humidity}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons
            name="leaf-outline"
            size={14}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
          <Text className={`text-xs ml-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {windSpeed} km/s
          </Text>
        </View>
      </View>
    </View>
  );
}

