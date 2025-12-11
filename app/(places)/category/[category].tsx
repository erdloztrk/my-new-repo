import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { Pressable } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { getPlacesByCategory, getAllPlaces } from "@/services/places-service";
import { Place } from "@/types/place";
import { Category } from "@/types/category";
import { PlaceCard } from "@/components/places/PlaceCard";

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: Category }>();
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = async () => {
    if (!category) return;

    try {
      setError(null);
      console.log(`🔍 Loading places for category: ${category}`);
      const data = await getPlacesByCategory(category);
      console.log(`📦 Loaded ${data.length} places`);
      setPlaces(data);
    } catch (err: any) {
      console.error("❌ Error loading places:", err);
      // More helpful error message
      if (err?.code === "failed-precondition" || err?.message?.includes("index")) {
        setError("Firebase index required. Please create index in Firebase Console.");
      } else {
        setError(`Failed to load places: ${err?.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlaces();
    // Debug: Check all places in database
    getAllPlaces().catch((err) => console.error("Debug: Error getting all places:", err));
  }, [category]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPlaces();
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3">
              <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
            </Pressable>
            <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {category ? t(`category_${category}`) : t("categories")}
            </Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3">
              <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
            </Pressable>
            <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {category ? t(`category_${category}`) : t("categories")}
            </Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className={`text-lg ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
          </Pressable>
          <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {category ? t(`category_${category}`) : t("categories")}
          </Text>
        </View>
      </View>

      {/* Places List */}
      {places.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className={`rounded-3xl p-8 shadow-sm border items-center max-w-xs ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
              {t("no_places")}
            </Text>
            <Text className={`text-base text-center leading-6 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {t("no_places_desc")}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={({ item }) => <PlaceCard place={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6C63FF" />
          }
        />
      )}
    </SafeAreaView>
  );
}

