import { View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { DailyForecast } from "./weatherTypes";
import { MeteoconsIcon } from "./MeteoconsIcon";
import { getMeteoconsIcon } from "./weatherIconMap";

interface ForecastWidgetProps {
  forecast: DailyForecast[] | null;
  currentWeather?: {
    temp: number;
    weather: Array<{ icon: string }>;
    dt: number;
  } | null;
  loading?: boolean;
}

const DAY_NAMES = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function formatDayName(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const dayIndex = date.getDay();
  return DAY_NAMES[dayIndex];
}

function isToday(timestamp: number): boolean {
  const today = new Date();
  const date = new Date(timestamp * 1000);
  
  // Compare year, month, and day
  return (
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  );
}

export function ForecastWidget({
  forecast,
  currentWeather,
  loading = false,
}: ForecastWidgetProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View className={`rounded-2xl p-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
        <View className="flex-row">
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              className={`flex-1 rounded-xl h-16 ${isDark ? "bg-muted-dark" : "bg-muted"}`}
              style={{ marginRight: i < 5 ? 4 : 0 }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (!forecast || forecast.length === 0) {
    return (
      <View className={`rounded-2xl p-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
        <Text className={`text-xs text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
          Veri alınamadı
        </Text>
      </View>
    );
  }

  // Create 5 days: today + next 4 days
  // Check if first forecast day is today
  const firstForecastIsToday = forecast.length > 0 && currentWeather && isToday(forecast[0].dt);
  
  // If first forecast is today, use forecast directly (take 5 days)
  // Otherwise, prepend today and take 4 more days from forecast
  let all5Days: typeof forecast;
  if (firstForecastIsToday) {
    // First forecast is today, use forecast as is (take up to 5 days)
    all5Days = forecast.slice(0, 5);
  } else if (currentWeather) {
    // First forecast is not today, prepend today and take 4 more days
    const today = {
      dt: currentWeather.dt,
      temp: {
        min: Math.round(currentWeather.temp - 3), // Approximate min
        max: Math.round(currentWeather.temp + 3), // Approximate max
      },
      weather: currentWeather.weather,
    };
    // Take 4 days from forecast to make total 5 (today + 4)
    all5Days = [today, ...forecast.slice(0, 4)];
  } else {
    // No current weather, use forecast (take up to 5 days)
    all5Days = forecast.slice(0, 5);
  }

  return (
    <View className={`rounded-2xl p-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
      <Text className={`text-xs font-semibold mb-2 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
        5 Günlük Tahmin
      </Text>
      <View className="flex-row">
        {all5Days.map((day, index) => {
          const iconName = getMeteoconsIcon(day.weather[0]?.icon);
          const maxTemp = Math.round(day.temp.max);
          const minTemp = Math.round(day.temp.min);
          // Check if this day is actually today
          const dayName = isToday(day.dt) ? "Bugün" : formatDayName(day.dt);

          return (
            <View
              key={index}
              className={`flex-1 rounded-xl p-1 border items-center ${isDark ? "bg-background-dark border-border-dark" : "bg-background border-border"}`}
              style={{ marginRight: index < all5Days.length - 1 ? 3 : 0 }}
            >
              <Text className={`text-xs mb-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                {dayName}
              </Text>
              <MeteoconsIcon name={iconName} size={28} />
              <Text className={`text-xs font-semibold mt-0.5 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                {maxTemp}°
              </Text>
              <Text className={`text-xs ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                {minTemp}°
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

