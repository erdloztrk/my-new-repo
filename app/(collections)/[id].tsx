import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Trash, Share, DotsThreeVertical, CaretUp, CaretDown } from "phosphor-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useCollectionsStore } from "@/stores/collections-store";
import { Place } from "@/types/place";
import { PlaceCard } from "@/components/places/PlaceCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logError } from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CollectionDetailScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const {
    selectedCollection,
    loading,
    fetchCollectionWithPlaces,
    removePlace,
    reorderPlaces,
  } = useCollectionsStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [localPlaces, setLocalPlaces] = useState<Place[]>([]);

  useEffect(() => {
    if (id) {
      fetchCollectionWithPlaces(id);
    }
  }, [id]);

  useEffect(() => {
    const places = (selectedCollection as any)?.places || [];
    setLocalPlaces(places);
  }, [selectedCollection]);

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    await fetchCollectionWithPlaces(id);
    setRefreshing(false);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/collections");
    }
  };

  const handleAddPlace = () => {
    router.push({
      pathname: "/(tabs)/map",
      params: { addToCollection: id },
    });
  };

  const handleRemovePlace = (placeId: string) => {
    if (!id) return;
    Alert.alert(
      t("remove_from_collection"),
      "Bu mekanı koleksiyondan çıkarmak istediğinizden emin misiniz?",
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("ok"),
          style: "destructive",
          onPress: async () => {
            try {
              await removePlace(id, placeId);
            } catch (error) {
              logError("[CollectionDetailScreen] Error removing place:", error);
            }
          },
        },
      ]
    );
  };

  const handleShare = () => {
    if (!selectedCollection?.shareId) {
      Alert.alert(t("collection_share_error"), "Koleksiyon paylaşılabilir yapılmalı");
      return;
    }
    
    const shareLink = `lokal://collection/${selectedCollection.shareId}`;
    Alert.alert(t("collection_shared"), shareLink);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !id) return;
    const newPlaces = [...localPlaces];
    [newPlaces[index - 1], newPlaces[index]] = [newPlaces[index], newPlaces[index - 1]];
    setLocalPlaces(newPlaces);
    const newPlaceIds = newPlaces.map((p: Place) => p.id);
    try {
      await reorderPlaces(id, newPlaceIds);
    } catch (error) {
      logError("[CollectionDetailScreen] Error reordering:", error);
      fetchCollectionWithPlaces(id);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === localPlaces.length - 1 || !id) return;
    const newPlaces = [...localPlaces];
    [newPlaces[index], newPlaces[index + 1]] = [newPlaces[index + 1], newPlaces[index]];
    setLocalPlaces(newPlaces);
    const newPlaceIds = newPlaces.map((p: Place) => p.id);
    try {
      await reorderPlaces(id, newPlaceIds);
    } catch (error) {
      logError("[CollectionDetailScreen] Error reordering:", error);
      fetchCollectionWithPlaces(id);
    }
  };

  if (loading && !selectedCollection) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"} flex-row items-center justify-between`}>
          <Pressable onPress={handleBack}>
            <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#1E293B"} />
          </Pressable>
          <ThemeToggle size={20} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedCollection) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"} flex-row items-center justify-between`}>
          <Pressable onPress={handleBack}>
            <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#1E293B"} />
          </Pressable>
          <ThemeToggle size={20} />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className={`text-lg ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Koleksiyon bulunamadı
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const places = (selectedCollection as any).places || [];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-4 flex-1">
            <Pressable onPress={handleBack}>
              <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#1E293B"} />
            </Pressable>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                {selectedCollection.emoji && (
                  <Text className="text-2xl">{selectedCollection.emoji}</Text>
                )}
                <Text className={`text-xl font-bold flex-1 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                  {selectedCollection.name}
                </Text>
              </View>
              {selectedCollection.description && (
                <Text className={`text-sm mt-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                  {selectedCollection.description}
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row gap-2">
            {selectedCollection.isPublic && (
              <Pressable
                onPress={handleShare}
                className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? "bg-background-dark" : "bg-background"}`}
              >
                <Share size={20} color={isDark ? "#94A3B8" : "#64748B"} />
              </Pressable>
            )}
            <ThemeToggle size={20} />
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("collection_places", { count: places.length })}
          </Text>
          <Pressable
            onPress={handleAddPlace}
            className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${isDark ? "bg-primary-dark" : "bg-primary"}`}
          >
            <Plus size={16} color="#FFFFFF" weight="bold" />
            <Text className="text-white font-semibold text-sm">{t("add_to_collection")}</Text>
          </Pressable>
        </View>
      </View>

      {/* Places List */}
      {places.length === 0 ? (
        <EmptyState
          icon={<Plus size={40} color="#6C63FF" weight="fill" />}
          title={t("collection_places_empty")}
          description={t("collection_places_empty_desc")}
          actionLabel={t("add_to_collection")}
          onAction={handleAddPlace}
        />
      ) : (
        <FlatList
          data={localPlaces}
          renderItem={({ item, index }) => (
            <View className="relative mb-2">
              <View className="flex-row items-center">
                <View className="flex-col mr-2">
                  <Pressable
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`w-8 h-8 rounded-full items-center justify-center mb-1 ${
                      index === 0 
                        ? "bg-gray-300/50" 
                        : isDark ? "bg-primary-dark/20" : "bg-primary/20"
                    }`}
                  >
                    <CaretUp 
                      size={16} 
                      color={index === 0 ? "#94A3B8" : "#6C63FF"} 
                      weight="bold" 
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleMoveDown(index)}
                    disabled={index === localPlaces.length - 1}
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      index === localPlaces.length - 1 
                        ? "bg-gray-300/50" 
                        : isDark ? "bg-primary-dark/20" : "bg-primary/20"
                    }`}
                  >
                    <CaretDown 
                      size={16} 
                      color={index === localPlaces.length - 1 ? "#94A3B8" : "#6C63FF"} 
                      weight="bold" 
                    />
                  </Pressable>
                </View>
                <View className="flex-1">
                  <PlaceCard place={item} />
                </View>
              </View>
              <Pressable
                onPress={() => handleRemovePlace(item.id)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 items-center justify-center"
              >
                <Trash size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
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

