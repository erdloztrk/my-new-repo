import { View, Text } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { MeteoconsIcon } from "./MeteoconsIcon";
import { getBeaufortIcon, getMoonPhaseIcon, barometerSvg, thermometer_celsiusSvg } from "./weatherIcons";
import { BEAUFORT_SCALE, getBeaufortScale, getMoonPhase } from "./weatherTypes";

interface WeatherDetailsWidgetProps {
  windSpeed: number; // m/s
  pressure: number | null | undefined; // hPa
  feelsLike: number | null | undefined; // °C (hissedilen sıcaklık)
  date?: Date;
  loading?: boolean;
}

const MOON_PHASE_LABELS: Record<string, string> = {
  "moon-new": "Yeni",
  "moon-waxing-crescent": "İlk Hilal",
  "moon-first-quarter": "İlk Dördün",
  "moon-waxing-gibbous": "Şişkin",
  "moon-full": "Dolunay",
  "moon-waning-gibbous": "Şişkin",
  "moon-last-quarter": "Son Dördün",
  "moon-waning-crescent": "Son Hilal",
};

export function WeatherDetailsWidget({
  windSpeed,
  pressure,
  feelsLike,
  date = new Date(),
  loading = false,
}: WeatherDetailsWidgetProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View className={`rounded-2xl p-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
        <View className="flex-row justify-between">
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              className={`flex-1 rounded-xl h-20 ${isDark ? "bg-muted-dark" : "bg-muted"}`}
              style={{ marginRight: i < 4 ? 6 : 0 }}
            />
          ))}
        </View>
      </View>
    );
  }

  const windSpeedKmh = Math.round(windSpeed * 3.6);
  const beaufortScale = getBeaufortScale(windSpeedKmh);
  const scaleData = BEAUFORT_SCALE[beaufortScale];
  const windIcon = getBeaufortIcon(beaufortScale);

  const moonPhase = getMoonPhase(date);
  const moonIcon = getMoonPhaseIcon(moonPhase);
  const moonLabel = MOON_PHASE_LABELS[moonPhase] || "Bilinmiyor";

  const pressureStatus =
    pressure !== null && pressure !== undefined
      ? pressure < 1000
        ? "Düşük"
        : pressure > 1020
        ? "Yüksek"
        : "Normal"
      : null;

  return (
    <View className={`rounded-2xl p-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
      <Text className={`text-xs font-semibold mb-2 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
        Detaylar
      </Text>
      <View className="flex-row justify-between">
        {/* Wind */}
        <View className="flex-1 items-center">
          <MeteoconsIcon xml={windIcon} size={32} />
          <Text className={`text-xs font-semibold mt-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
            {windSpeedKmh} km/s
          </Text>
          <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            B{beaufortScale}
          </Text>
        </View>

        {/* Pressure */}
        <View className="flex-1 items-center">
          {pressure !== null && pressure !== undefined ? (
            <>
              <MeteoconsIcon xml={barometerSvg} size={32} />
              <Text className={`text-xs font-semibold mt-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                {Math.round(pressure)}
              </Text>
              <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                {pressureStatus}
              </Text>
            </>
          ) : (
            <>
              <View className="w-8 h-8" />
              <Text className={`text-xs mt-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>-</Text>
              <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>-</Text>
            </>
          )}
        </View>

        {/* Feels Like (Hissedilen Sıcaklık) */}
        <View className="flex-1 items-center">
          {feelsLike !== null && feelsLike !== undefined ? (
            <>
              <MeteoconsIcon xml={thermometer_celsiusSvg} size={32} />
              <Text className={`text-xs font-semibold mt-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                {Math.round(feelsLike)}°
              </Text>
              <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                Hissedilen
              </Text>
            </>
          ) : (
            <>
              <View className="w-8 h-8" />
              <Text className={`text-xs mt-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>-</Text>
              <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>-</Text>
            </>
          )}
        </View>

        {/* Moon Phase */}
        <View className="flex-1 items-center">
          <MeteoconsIcon xml={moonIcon} size={32} />
          <Text className={`text-xs font-semibold mt-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
            {moonLabel}
          </Text>
          <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            Ay
          </Text>
        </View>
      </View>
    </View>
  );
}

