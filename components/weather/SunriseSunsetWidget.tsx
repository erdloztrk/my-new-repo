import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/theme-store";

interface SunriseSunsetWidgetProps {
  sunrise: number | null;
  sunset: number | null;
  loading?: boolean;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function SunriseSunsetWidget({
  sunrise,
  sunset,
  loading = false,
}: SunriseSunsetWidgetProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <View className="flex-row justify-between">
          <View className="h-10 bg-gray-300 dark:bg-gray-700 rounded-xl w-[45%]" />
          <View className="h-10 bg-gray-300 dark:bg-gray-700 rounded-xl w-[45%]" />
        </View>
      </View>
    );
  }

  if (!sunrise || !sunset) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <Text className={`text-xs text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
          Veri alınamadı
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center mr-2">
            <Ionicons name="sunny" size={16} color="#F59E0B" />
          </View>
          <View>
            <Text className={`text-xs mb-0.5 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              Gün Doğumu
            </Text>
            <Text className={`text-sm font-semibold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {formatTime(sunrise)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-orange-500/20 items-center justify-center mr-2">
            <Ionicons name="moon" size={16} color="#F97316" />
          </View>
          <View>
            <Text className={`text-xs mb-0.5 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              Gün Batımı
            </Text>
            <Text className={`text-sm font-semibold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {formatTime(sunset)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

