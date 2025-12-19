import { useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "phosphor-react-native";
import { router } from "expo-router";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { useCollectionsStore } from "@/stores/collections-store";
import { getCurrentUser } from "@/services/auth-service";
import { COLLECTION_EMOJIS } from "@/types/collection";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logError } from "@/lib/logger";

export default function NewCollectionScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  
  const { createNewCollection, loading } = useCollectionsStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("");

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t("error"), t("collection_name") + " gereklidir");
      return;
    }

    const user = getCurrentUser();
    if (!user?.uid) {
      Alert.alert(t("error"), "Please log in to create collections");
      return;
    }

    try {
      const collectionData: any = {
        userId: user.uid,
        name: name.trim(),
      };
      
      // Only add emoji if selected (not empty string)
      if (selectedEmoji && selectedEmoji.trim()) {
        collectionData.emoji = selectedEmoji.trim();
      }
      
      // Only add description if provided (not empty string)
      if (description && description.trim()) {
        collectionData.description = description.trim();
      }
      
      const collectionId = await createNewCollection(collectionData);

      if (collectionId) {
        router.back();
      }
    } catch (error) {
      logError("[NewCollectionScreen] Error creating collection:", error);
      Alert.alert(t("error"), t("collection_delete_error"));
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/collections");
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"} flex-row items-center justify-between`}>
        <View className="flex-row items-center gap-4">
          <Pressable onPress={handleBack}>
            <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#1E293B"} />
          </Pressable>
          <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("new_collection")}
          </Text>
        </View>
        <ThemeToggle size={20} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Collection Name */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("collection_name")} *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("collection_name")}
            placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            className={`px-4 py-3 rounded-xl border ${isDark ? "bg-card-dark border-border-dark text-foreground-dark" : "bg-card border-border text-foreground"}`}
            autoFocus
          />
        </View>

        {/* Emoji Selection */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-3 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Emoji (opsiyonel)
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {COLLECTION_EMOJIS.slice(0, 20).map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => setSelectedEmoji(selectedEmoji === emoji ? "" : emoji)}
                className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
                  selectedEmoji === emoji
                    ? isDark
                      ? "bg-primary-dark border-primary-dark"
                      : "bg-primary border-primary"
                    : isDark
                    ? "bg-card-dark border-border-dark"
                    : "bg-card border-border"
                }`}
              >
                <Text className="text-2xl">{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className={`text-sm font-semibold mb-2 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("collection_description")}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t("collection_description")}
            placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            multiline
            numberOfLines={4}
            className={`px-4 py-3 rounded-xl border ${isDark ? "bg-card-dark border-border-dark text-foreground-dark" : "bg-card border-border text-foreground"}`}
            textAlignVertical="top"
          />
        </View>

        {/* Create Button */}
        <Pressable
          onPress={handleCreate}
          disabled={loading || !name.trim()}
          className={`py-4 rounded-xl items-center ${loading || !name.trim() ? "bg-muted" : isDark ? "bg-primary-dark" : "bg-primary"}`}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-lg">{t("create_collection")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

