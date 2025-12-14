import { View, Text } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { MeteoconsIcon } from "./MeteoconsIcon";
import { getBeaufortIcon } from "./weatherIcons";
import { BEAUFORT_SCALE, getBeaufortScale } from "./weatherTypes";

interface WindBeaufortWidgetProps {
  windSpeed: number; // m/s
  loading?: boolean;
}

export function WindBeaufortWidget({
  windSpeed,
  loading = false,
}: WindBeaufortWidgetProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <View className="h-12 bg-gray-300 dark:bg-gray-700 rounded" />
      </View>
    );
  }

  const windSpeedKmh = Math.round(windSpeed * 3.6); // Convert m/s to km/h
  const beaufortScale = getBeaufortScale(windSpeedKmh);
  const scaleData = BEAUFORT_SCALE[beaufortScale];
  const iconSvg = getBeaufortIcon(beaufortScale);

  return (
    <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
      <Text className="text-xs font-semibold text-text dark:text-text-dark mb-2">
        Rüzgâr Hızı
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-baseline mb-1">
            <Text className="text-2xl font-bold text-text dark:text-text-dark mr-2">
              {windSpeedKmh}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark">
              km/h
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-text dark:text-text-dark mr-2">
              B{beaufortScale}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark">
              {scaleData.label}
            </Text>
          </View>
        </View>
        <MeteoconsIcon xml={iconSvg} size={48} />
      </View>
    </View>
  );
}

