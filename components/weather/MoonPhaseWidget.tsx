import { View, Text } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { MeteoconsIcon } from "./MeteoconsIcon";
import { getMoonPhaseIcon } from "./weatherIcons";
import { getMoonPhase, MoonPhase } from "./weatherTypes";

interface MoonPhaseWidgetProps {
  date?: Date;
  loading?: boolean;
}

const MOON_PHASE_LABELS: Record<MoonPhase, string> = {
  "moon-new": "Yeni Ay",
  "moon-waxing-crescent": "İlk Hilal",
  "moon-first-quarter": "İlk Dördün",
  "moon-waxing-gibbous": "Şişkin Ay (Büyüyor)",
  "moon-full": "Dolunay",
  "moon-waning-gibbous": "Şişkin Ay (Küçülüyor)",
  "moon-last-quarter": "Son Dördün",
  "moon-waning-crescent": "Son Hilal",
};

export function MoonPhaseWidget({
  date = new Date(),
  loading = false,
}: MoonPhaseWidgetProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
        <View className="h-12 bg-gray-300 dark:bg-gray-700 rounded" />
      </View>
    );
  }

  const moonPhase = getMoonPhase(date);
  const iconSvg = getMoonPhaseIcon(moonPhase);
  const label = MOON_PHASE_LABELS[moonPhase] || "Bilinmiyor";

  return (
    <View className="bg-card dark:bg-card-dark rounded-2xl p-3 shadow-sm border border-border dark:border-border-dark">
      <Text className="text-xs font-semibold text-text dark:text-text-dark mb-2">
        Ay Fazı
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-text dark:text-text-dark mb-0.5">
            {label}
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark">
            {date.toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>
        <MeteoconsIcon xml={iconSvg} size={48} />
      </View>
    </View>
  );
}

