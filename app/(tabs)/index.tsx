import React from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MagnifyingGlass, Sparkle } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { router } from "expo-router";
import { Category } from "@/types/category";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { TablerIcon } from "@/components/icons/TablerIcon";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Gradient Background Component
function GradientBackground({ isDark }: { isDark: boolean }) {
  // Calculate gradient radius (125% of screen diagonal)
  const diagonal = Math.sqrt(SCREEN_WIDTH * SCREEN_WIDTH + SCREEN_HEIGHT * SCREEN_HEIGHT);
  const gradientRadius = diagonal * 1.25;
  
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
      }}
    >
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <Defs>
          {isDark ? (
            // Dark mode: Azure Depths - radial-gradient(125% 125% at 50% 100%, #000000 40%, #350136 100%)
            <RadialGradient
              id="darkGradient"
              cx={SCREEN_WIDTH * 0.5}
              cy={SCREEN_HEIGHT * 1.0}
              r={gradientRadius}
              fx={SCREEN_WIDTH * 0.5}
              fy={SCREEN_HEIGHT * 1.0}
            >
              <Stop offset="0.4" stopColor="#000000" stopOpacity="1" />
              <Stop offset="1" stopColor="#350136" stopOpacity="1" />
            </RadialGradient>
          ) : (
            // Light mode: Amber Glow - radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #f59e0b 100%)
            <RadialGradient
              id="lightGradient"
              cx={SCREEN_WIDTH * 0.5}
              cy={SCREEN_HEIGHT * 0.1}
              r={gradientRadius}
              fx={SCREEN_WIDTH * 0.5}
              fy={SCREEN_HEIGHT * 0.1}
            >
              <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="1" stopColor="#f59e0b" stopOpacity="1" />
            </RadialGradient>
          )}
        </Defs>
        <Rect
          x="0"
          y="0"
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill={isDark ? "url(#darkGradient)" : "url(#lightGradient)"}
        />
      </Svg>
    </View>
  );
}

const CATEGORIES: Array<{ id: string; nameKey: string; category: Category; iconName: string; color: string }> = [
  { id: "1", nameKey: "category_cafes", category: "cafes", iconName: "coffee", color: "#E07A5F" },
  { id: "2", nameKey: "category_restaurants", category: "restaurants", iconName: "tools-kitchen", color: "#81B29A" },
  { id: "3", nameKey: "category_bars", category: "bars", iconName: "glass-full", color: "#3D405B" },
  { id: "4", nameKey: "category_parks", category: "parks", iconName: "tree", color: "#F2CC8F" },
  { id: "5", nameKey: "category_beach_clubs", category: "beach_clubs", iconName: "beach", color: "#38BDF8" },
  { id: "6", nameKey: "category_hotels", category: "hotels", iconName: "hotel-service", color: "#8B5CF6" },
  { id: "7", nameKey: "category_cinemas", category: "cinemas", iconName: "movie", color: "#EC4899" },
  { id: "8", nameKey: "category_shopping", category: "shopping", iconName: "shopping-bag", color: "#F59E0B" },
  { id: "9", nameKey: "category_gyms", category: "gyms", iconName: "gymnastics", color: "#EF4444" },
  { id: "10", nameKey: "category_libraries", category: "libraries", iconName: "library", color: "#6366F1" },
  { id: "11", nameKey: "category_hospitals", category: "hospitals", iconName: "hospital", color: "#DC2626" },
  { id: "12", nameKey: "category_schools", category: "schools", iconName: "school", color: "#10B981" },
  { id: "13", nameKey: "category_churches", category: "churches", iconName: "building-church", color: "#6B7280" },
  { id: "14", nameKey: "category_banks", category: "banks", iconName: "building-bank", color: "#059669" },
  { id: "15", nameKey: "category_gas_stations", category: "gas_stations", iconName: "gas-station", color: "#F97316" },
  { id: "16", nameKey: "category_parking", category: "parking", iconName: "parking", color: "#64748B" },
  { id: "17", nameKey: "category_bus_stops", category: "bus_stops", iconName: "bus", color: "#3B82F6" },
  { id: "18", nameKey: "category_train_stations", category: "train_stations", iconName: "train", color: "#0EA5E9" },
  { id: "19", nameKey: "category_nightclubs", category: "nightclubs", iconName: "music", color: "#A855F7" },
  { id: "20", nameKey: "category_art_galleries", category: "art_galleries", iconName: "artboard", color: "#EC4899" },
  { id: "21", nameKey: "category_ice_cream", category: "ice_cream", iconName: "ice-cream", color: "#F0ABFC" },
  { id: "22", nameKey: "category_bakeries", category: "bakeries", iconName: "bread", color: "#FCD34D" },
  { id: "23", nameKey: "category_bookstores", category: "bookstores", iconName: "book", color: "#8B5CF6" },
];

export default function HomeScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  
  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#FFFFFF" }}>
      {/* Gradient Background */}
      <GradientBackground isDark={isDark} />
      
      <SafeAreaView className="flex-1" style={{ backgroundColor: "transparent" }}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} style={{ zIndex: 1 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className={`text-sm font-medium ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("welcome")}
          </Text>
          <Text className={`text-3xl font-bold mt-1 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("app_name")}
          </Text>
          <Text className={`text-base mt-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("subtitle")}
          </Text>
        </View>

        {/* Search Bar Placeholder */}
        <View className="px-6 mb-6">
          <Pressable className={`flex-row items-center rounded-2xl px-4 py-4 shadow-sm border ${isDark ? "bg-muted-dark border-border-dark" : "bg-muted border-border"}`}>
            <MagnifyingGlass size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
            <Text className={`ml-3 text-base ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {t("search_placeholder")}
            </Text>
          </Pressable>
        </View>

        {/* Categories */}
        <View className="px-6 mb-6">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("categories")}
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/(places)/category/${cat.category}`)}
                className={`w-[48%] rounded-2xl p-4 mb-3 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <TablerIcon name={cat.iconName} size={24} color={cat.color} />
                </View>
                <Text className={`text-base font-semibold ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                  {t(cat.nameKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Featured Section Placeholder */}
        <View className="px-6 mb-8">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("featured")}
          </Text>
          <View className={`rounded-2xl p-6 shadow-sm border items-center ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            <Sparkle size={40} color="#6C63FF" weight="fill" />
            <Text className={`text-base mt-3 text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {t("featured_message")}
            </Text>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
