import { View, Text } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { MeteoconsIcon } from "./MeteoconsIcon";
import { getUVIndexIcon } from "./weatherIcons";
import { UV_INDEX_LEVELS, getUVIndexLevel } from "./weatherTypes";

interface UVIndexWidgetProps {
  uvi: number | null | undefined;
  loading?: boolean;
}

export function UVIndexWidget({ uvi, loading = false }: UVIndexWidgetProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <View className="h-12 bg-gray-300 dark:bg-gray-700 rounded" />
      </View>
    );
  }

  if (uvi === null || uvi === undefined) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <Text className={`text-xs text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
          UV indeksi verisi yok
        </Text>
      </View>
    );
  }

  const level = getUVIndexLevel(uvi);
  const levelData = UV_INDEX_LEVELS[level] || UV_INDEX_LEVELS[0];
  const iconSvg = getUVIndexIcon(uvi);

  return (
    <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
      <Text className={`text-xs font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
        UV İndeksi
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-baseline mb-1">
            <Text className={`text-2xl font-bold mr-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {uvi.toFixed(1)}
            </Text>
            <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              / 11+
            </Text>
          </View>
          <Text
            className="text-sm font-semibold"
            style={{ color: levelData.color }}
          >
            {levelData.label}
          </Text>
        </View>
        <MeteoconsIcon xml={iconSvg} size={48} />
      </View>
    </View>
  );
}

