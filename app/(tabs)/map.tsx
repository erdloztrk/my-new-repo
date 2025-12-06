import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/theme-store";

export default function MapScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  
  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
        <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
          Harita
        </Text>
      </View>

      {/* Map Placeholder */}
      <View className="flex-1 items-center justify-center px-6">
        <View className={`rounded-3xl p-8 shadow-sm border items-center max-w-xs ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
            <Ionicons name="map" size={40} color="#6C63FF" />
          </View>
          <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
            Harita Yakında!
          </Text>
          <Text className={`text-base text-center leading-6 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            Çevrenizdeki tüm mekanları harita üzerinde keşfedebileceksiniz.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
