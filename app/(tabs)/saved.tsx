import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useFavorites } from "@/stores/favorites-store";
import { getPlacesByIds } from "@/services/places-service";
import { Place } from "@/types/place";
import { PlaceCard } from "@/components/places/PlaceCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logError } from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyState";

export default function SavedScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  
  const { favorites, loadFavorites } = useFavorites();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    loadFavoritePlaces();
  }, [favorites]);

  const loadFavoritePlaces = async () => {
    if (favorites.length === 0) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Batch fetch all favorites in one or more optimized queries
      const placesData = await getPlacesByIds(favorites);
      setPlaces(placesData);
    } catch (error) {
      logError("[SavedScreen] Error loading favorite places:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"} flex-row items-center justify-between`}>
          <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("saved")}
          </Text>
          <ThemeToggle size={20} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"} flex-row items-center justify-between`}>
        <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
          {t("saved")}
        </Text>
        <ThemeToggle size={20} />
      </View>

      {/* Content */}
      {places.length === 0 ? (
        <EmptyState
          icon={<Heart size={40} color="#FF6584" weight="fill" />}
          title={t("saved_empty_title")}
          description={t("saved_empty_desc")}
        />
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
