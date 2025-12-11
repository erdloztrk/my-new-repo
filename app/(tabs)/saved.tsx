import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useFavorites } from "@/stores/favorites-store";
import { getPlaceById } from "@/services/places-service";
import { Place } from "@/types/place";
import { PlaceCard } from "@/components/places/PlaceCard";

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
      const placesData = await Promise.all(
        favorites.map((id) => getPlaceById(id))
      );
      setPlaces(placesData.filter((p) => p !== null) as Place[]);
    } catch (error) {
      console.error("Error loading favorite places:", error);
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
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("saved")}
          </Text>
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
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
        <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
          {t("saved")}
        </Text>
      </View>

      {/* Content */}
      {places.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className={`rounded-3xl p-8 shadow-sm border items-center max-w-xs ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            <View className="w-20 h-20 rounded-full bg-[#FF6584]/20 items-center justify-center mb-4">
              <Heart size={40} color="#FF6584" weight="fill" />
            </View>
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
              {t("saved_empty_title")}
            </Text>
            <Text className={`text-base text-center leading-6 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {t("saved_empty_desc")}
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
