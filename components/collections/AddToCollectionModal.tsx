import { useEffect, useState } from "react";
import { View, Text, Modal, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Plus } from "phosphor-react-native";
import { router } from "expo-router";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useCollectionsStore } from "@/stores/collections-store";
import { Collection } from "@/types/collection";
import { getCurrentUser } from "@/services/auth-service";
import { logError } from "@/lib/logger";

interface AddToCollectionModalProps {
  visible: boolean;
  placeId: string;
  onClose: () => void;
  onCollectionSelect?: (collectionId: string) => void;
}

export function AddToCollectionModal({
  visible,
  placeId,
  onClose,
  onCollectionSelect,
}: AddToCollectionModalProps) {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  
  const {
    collections,
    loading,
    fetchCollections,
    addPlace,
  } = useCollectionsStore();
  
  const [addingToCollection, setAddingToCollection] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      const user = getCurrentUser();
      if (user?.uid) {
        fetchCollections(user.uid);
      }
    }
  }, [visible]);

  const handleAddToCollection = async (collectionId: string) => {
    setAddingToCollection(collectionId);
    try {
      await addPlace(collectionId, placeId);
      onCollectionSelect?.(collectionId);
      onClose();
      // Navigate to collections page after successful add
      setTimeout(() => {
        router.push("/(tabs)/collections");
      }, 300);
    } catch (error) {
      logError("[AddToCollectionModal] Error adding place to collection:", error);
    } finally {
      setAddingToCollection(null);
    }
  };

  const handleCreateNew = () => {
    onClose();
    // Navigate to new collection screen with placeId param
    setTimeout(() => {
      router.push({
        pathname: "/(collections)/new",
        params: { placeId },
      });
    }, 300);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View className="flex-1 bg-black/50">
        <Pressable 
          className="flex-1" 
          onPress={onClose}
          activeOpacity={1}
        />
        <View className={`rounded-t-3xl ${isDark ? "bg-background-dark" : "bg-background"}`} style={{ maxHeight: "80%" }}>
          <SafeAreaView edges={['top', 'bottom']}>
            {/* Header */}
            <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark" : "border-border"} flex-row items-center justify-between`}>
              <Text className={`text-xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
                {t("select_collection")}
              </Text>
              <Pressable onPress={onClose}>
                <X size={24} color={isDark ? "#ECEDEE" : "#1E293B"} />
              </Pressable>
            </View>

            {/* Collections List */}
            {loading ? (
              <View className="items-center justify-center" style={{ minHeight: 200 }}>
                <ActivityIndicator size="large" color="#6C63FF" />
              </View>
            ) : (
              <FlatList
                data={collections}
                renderItem={({ item }) => {
                  const isAdding = addingToCollection === item.id;
                  const isInCollection = item.placeIds.includes(placeId);
                  
                  return (
                    <Pressable
                      onPress={() => !isInCollection && handleAddToCollection(item.id)}
                      disabled={isInCollection || isAdding}
                      className={`p-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"} ${
                        isInCollection ? "opacity-50" : ""
                      }`}
                    >
                      <View className="flex-row items-center gap-3">
                        {item.emoji && (
                          <Text className="text-2xl">{item.emoji}</Text>
                        )}
                        <View className="flex-1">
                          <Text className={`text-lg font-semibold ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                            {item.name}
                          </Text>
                          <Text className={`text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                            {t("collection_places", { count: item.placeIds.length })}
                            {isInCollection && " • " + t("already_added")}
                          </Text>
                        </View>
                        {isAdding ? (
                          <ActivityIndicator size="small" color="#6C63FF" />
                        ) : !isInCollection && (
                          <Plus size={20} color="#6C63FF" />
                        )}
                      </View>
                    </Pressable>
                  );
                }}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <View className="items-center justify-center px-6 py-12" style={{ minHeight: 300 }}>
                    <Text className={`text-base text-center mb-6 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                      {t("collection_empty_desc")}
                    </Text>
                    <Pressable
                      onPress={handleCreateNew}
                      className={`px-8 py-4 rounded-xl ${isDark ? "bg-primary-dark" : "bg-primary"}`}
                      style={{
                        shadowColor: "#6C63FF",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Text className="text-white font-semibold text-base">{t("new_collection")}</Text>
                    </Pressable>
                  </View>
                }
                contentContainerStyle={collections.length === 0 ? { flexGrow: 1 } : { paddingBottom: 20 }}
                style={{ flexGrow: 0 }}
              />
            )}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

