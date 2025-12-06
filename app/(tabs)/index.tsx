import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/theme-store";
import { WeatherContainer } from "@/components/weather/WeatherContainer";

const CATEGORIES = [
  { id: "1", name: "Kafeler", icon: "cafe" as const, color: "#E07A5F" },
  { id: "2", name: "Restoranlar", icon: "restaurant" as const, color: "#81B29A" },
  { id: "3", name: "Barlar", icon: "wine" as const, color: "#3D405B" },
  { id: "4", name: "Parklar", icon: "leaf" as const, color: "#F2CC8F" },
];

export default function HomeScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  
  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className={`text-sm font-medium ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            Hoş geldin 👋
          </Text>
          <Text className={`text-3xl font-bold mt-1 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            LOKAL
          </Text>
          <Text className={`text-base mt-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            Şehrinin en iyi yerlerini keşfet
          </Text>
        </View>

        {/* Weather Widgets */}
        <View className="px-6 mb-6">
          <WeatherContainer />
        </View>

        {/* Search Bar Placeholder */}
        <View className="px-6 mb-6">
          <Pressable className={`flex-row items-center rounded-2xl px-4 py-4 shadow-sm border ${isDark ? "bg-muted-dark border-border-dark" : "bg-muted border-border"}`}>
            <Ionicons name="search" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
            <Text className={`ml-3 text-base ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              Mekan veya kategori ara...
            </Text>
          </Pressable>
        </View>

        {/* Categories */}
        <View className="px-6 mb-6">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Kategoriler
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                className={`w-[48%] rounded-2xl p-4 mb-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <Ionicons name={cat.icon} size={24} color={cat.color} />
                </View>
                <Text className={`text-base font-semibold ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Featured Section Placeholder */}
        <View className="px-6 mb-8">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Öne Çıkanlar
          </Text>
          <View className={`rounded-2xl p-6 shadow-sm border items-center ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            <Ionicons name="sparkles" size={40} color="#6C63FF" />
            <Text className={`text-base mt-3 text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              Yakında burada şehrin en popüler mekanlarını göreceksin!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
