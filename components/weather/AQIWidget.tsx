import { View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { AQI_MAP } from "./weatherTypes";

interface AQIWidgetProps {
  aqi: number | null;
  loading?: boolean;
}

export function AQIWidget({ aqi, loading = false }: AQIWidgetProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <View className="h-12 bg-gray-300 dark:bg-gray-700 rounded-xl" />
      </View>
    );
  }

  if (!aqi || aqi < 1 || aqi > 5) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <Text className="text-xs text-muted dark:text-muted-dark text-center">
          Veri alınamadı
        </Text>
      </View>
    );
  }

  const aqiData = AQI_MAP[aqi];
  const bgOpacity = isDark ? "20" : "10";

  return (
    <View
      className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark"
      style={{
        backgroundColor: isDark
          ? undefined
          : `${aqiData.color}${bgOpacity}`,
        borderColor: isDark ? undefined : `${aqiData.color}40`,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs text-muted dark:text-muted-dark mb-0.5">
            Hava Kalitesi
          </Text>
          <View className="flex-row items-baseline">
            <Text
              className="text-2xl font-bold mr-2"
              style={{ color: aqiData.color }}
            >
              {aqi}
            </Text>
            <Text
              className="text-sm font-semibold"
              style={{ color: aqiData.color }}
            >
              {aqiData.label}
            </Text>
          </View>
          <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">
            {aqiData.description}
          </Text>
        </View>
      </View>
    </View>
  );
}

