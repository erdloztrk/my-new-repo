import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Folder, Trash, Share } from "phosphor-react-native";
import { router } from "expo-router";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useCollectionsStore } from "@/stores/collections-store";
import { Collection } from "@/types/collection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser } from "@/services/auth-service";
import { logError } from "@/lib/logger";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CollectionsScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  
  const {
    collections,
    loading,
    error,
    fetchCollections,
    deleteCollectionById,
  } = useCollectionsStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.uid) {
      setUserId(user.uid);
      fetchCollections(user.uid);
    }
  }, []);

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    await fetchCollections(userId);
    setRefreshing(false);
  };

  const handleCreateCollection = () => {
    router.push("/(collections)/new");
  };

  const handleCollectionPress = (collection: Collection) => {
    router.push(`/(collections)/${collection.id}`);
  };

  const handleDeleteCollection = (collection: Collection) => {
    Alert.alert(
      t("delete_collection"),
      t("collection_delete_confirm"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("delete_collection"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCollectionById(collection.id);
            } catch (error) {
              logError("[CollectionsScreen] Error deleting collection:", error);
            }
          },
        },
      ]
    );
  };

  const handleShareCollection = (collection: Collection) => {
    if (!collection.shareId) {
      // Make collection public and generate shareId
      // This would be handled by updateCollection
      Alert.alert(t("collection_share_error"), "Collection must be public to share");
      return;
    }
    
    // Generate share link (would use deep linking in production)
    const shareLink = `lokal://collection/${collection.shareId}`;
    // In production, use Share API or copy to clipboard
    Alert.alert(t("collection_shared"), shareLink);
  };

  if (loading && collections.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"} flex-row items-center justify-between`}>
          <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("collections")}
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
          {t("collections")}
        </Text>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={handleCreateCollection}
            className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? "bg-primary-dark" : "bg-primary"}`}
          >
            <Plus size={20} color="#FFFFFF" weight="bold" />
          </Pressable>
          <ThemeToggle size={20} />
        </View>
      </View>

      {/* Content */}
      {collections.length === 0 ? (
        <EmptyState
          icon={<Folder size={40} color="#6C63FF" weight="fill" />}
          title={t("collection_empty_title")}
          description={t("collection_empty_desc")}
          actionLabel={t("new_collection")}
          onAction={handleCreateCollection}
        />
      ) : (
        <FlatList
          data={collections}
          renderItem={({ item }) => (
            <CollectionCard
              collection={item}
              onPress={() => handleCollectionPress(item)}
              onDelete={() => handleDeleteCollection(item)}
              onShare={() => handleShareCollection(item)}
              isDark={isDark}
              t={t}
            />
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

interface CollectionCardProps {
  collection: Collection;
  onPress: () => void;
  onDelete: () => void;
  onShare: () => void;
  isDark: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function CollectionCard({ collection, onPress, onDelete, onShare, isDark, t }: CollectionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-4 rounded-2xl p-4 shadow-sm border ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-2">
            {collection.emoji && (
              <Text className="text-2xl">{collection.emoji}</Text>
            )}
            <Text className={`text-lg font-bold flex-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
              {collection.name}
            </Text>
          </View>
          {collection.description && (
            <Text className={`text-sm mb-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {collection.description}
            </Text>
          )}
          <Text className={`text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("collection_places", { count: collection.placeIds.length })}
          </Text>
        </View>
        <View className="flex-row gap-2">
          {collection.isPublic && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? "bg-background-dark" : "bg-background"}`}
            >
              <Share size={16} color={isDark ? "#94A3B8" : "#64748B"} />
            </Pressable>
          )}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? "bg-background-dark" : "bg-background"}`}
          >
            <Trash size={16} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

