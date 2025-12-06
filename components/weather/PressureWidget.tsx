import { View, Text } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { MeteoconsIcon } from "./MeteoconsIcon";
import { barometerSvg } from "./weatherIcons";

interface PressureWidgetProps {
  pressure: number | null | undefined; // hPa
  loading?: boolean;
}

export function PressureWidget({
  pressure,
  loading = false,
}: PressureWidgetProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <View className="h-12 bg-gray-300 dark:bg-gray-700 rounded" />
      </View>
    );
  }

  if (pressure === null || pressure === undefined) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <Text className="text-xs text-muted dark:text-muted-dark text-center">
          Basınç verisi yok
        </Text>
      </View>
    );
  }

  // Normal sea level pressure is around 1013 hPa
  const pressureStatus =
    pressure < 1000
      ? "Düşük"
      : pressure > 1020
      ? "Yüksek"
      : "Normal";

  return (
    <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
      <Text className="text-xs font-semibold text-text dark:text-text-dark mb-2">
        Hava Basıncı
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-baseline mb-1">
            <Text className="text-2xl font-bold text-text dark:text-text-dark mr-2">
              {Math.round(pressure)}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark">
              hPa
            </Text>
          </View>
          <Text className="text-xs text-muted dark:text-muted-dark">
            {pressureStatus}
          </Text>
        </View>
        <MeteoconsIcon xml={barometerSvg} size={48} />
      </View>
    </View>
  );
}

