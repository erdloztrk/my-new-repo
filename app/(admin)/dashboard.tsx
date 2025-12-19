import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/stores/theme-store";
import { useAdminStore } from "@/stores/admin-store";
import { ArrowLeft, Plus, SignOut, PencilSimple, Trash } from "phosphor-react-native";
import { getAllPlaces, deletePlace } from "@/services/places-service";
import { Place } from "@/types/place";
import { CATEGORY_LABELS } from "@/types/category";
import { useI18n } from "@/stores/i18n-store";
import { logError } from "@/lib/logger";

export default function AdminDashboardScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  const { logout, isAdmin, user } = useAdminStore();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/(admin)/login");
    } else {
      loadPlaces();
    }
  }, [isAdmin]);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const allPlaces = await getAllPlaces();
      // Sort by createdAt (newest first)
      const sorted = allPlaces.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.seconds * 1000;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.seconds * 1000;
        return bTime - aTime;
      });
      setPlaces(sorted);
    } catch (error) {
      logError("[AdminDashboard] Error loading places:", error);
      Alert.alert(t("error"), t("admin.dashboard.load_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (placeId: string, placeName: string) => {
    Alert.alert(
      t("admin.dashboard.delete_place_title"),
      t("admin.dashboard.delete_place_message", { placeName }),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("admin.dashboard.delete_place_title"),
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlace(placeId);
              Alert.alert(t("ok"), t("admin.dashboard.delete_success"));
              loadPlaces(); // Reload list
            } catch (error) {
              logError("[AdminDashboard] Error deleting place:", error);
              Alert.alert(t("error"), t("admin.dashboard.delete_error"));
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(t("admin.dashboard.logout_title"), t("admin.dashboard.logout_message"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("admin.dashboard.logout_title"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(admin)/login");
        },
      },
    ]);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View
        className={`px-6 pt-4 pb-4 border-b flex-row items-center justify-between ${
          isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"
        }`}
      >
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                // Fallback to home tab if no history (profile'a gitme, döngü oluşmasın)
                router.replace("/(tabs)");
              }
            } catch (error) {
              // Fallback: try to navigate to tabs root
              try {
                router.replace("/(tabs)");
              } catch (fallbackError) {
                logError("[AdminDashboard] Navigation error:", fallbackError);
              }
            }
          }}>
            <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} />
          </Pressable>
          <Text
            className={`text-xl font-bold ${
              isDark ? "text-card-foreground-dark" : "text-card-foreground"
            }`}
          >
            Admin Dashboard
          </Text>
        </View>
        <Pressable onPress={handleLogout}>
          <SignOut size={24} color={isDark ? "#EF4444" : "#DC2626"} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" onRefresh={loadPlaces} refreshing={loading}>
        <View className="p-6">
          {/* Welcome Card */}
          <View
            className={`p-4 rounded-xl mb-6 ${
              isDark ? "bg-card-dark" : "bg-card"
            }`}
          >
            <Text
              className={`text-base mb-1 ${
                isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
              }`}
            >
              {t("admin.dashboard.welcome_back")}
            </Text>
            <Text
              className={`text-lg font-semibold ${
                isDark ? "text-card-foreground-dark" : "text-card-foreground"
              }`}
            >
              {user?.email || t("admin.dashboard.admin_label")}
            </Text>
          </View>

          {/* Stats Card */}
          <View
            className={`p-4 rounded-xl mb-6 ${
              isDark ? "bg-card-dark border border-border-dark" : "bg-card border border-border"
            }`}
          >
            <Text
              className={`text-lg font-bold mb-2 ${
                isDark ? "text-card-foreground-dark" : "text-card-foreground"
              }`}
            >
              {t("admin.dashboard.statistics")}
            </Text>
            <Text
              className={`text-2xl font-bold ${
                isDark ? "text-primary" : "text-primary"
              }`}
            >
              {places.length}
            </Text>
            <Text
              className={`text-sm ${
                isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
              }`}
            >
              {t("admin.dashboard.total_places")}
            </Text>
          </View>

          {/* Add Place Button */}
          <Pressable
            onPress={() => router.push("/(places)/add")}
            className={`p-4 rounded-xl mb-6 flex-row items-center justify-center gap-3 ${
              isDark ? "bg-blue-600" : "bg-blue-500"
            }`}
          >
            <Plus size={24} color="#FFFFFF" weight="bold" />
            <Text className="text-white text-center font-semibold text-base">
              {t("admin.dashboard.add_place")}
            </Text>
          </Pressable>

          {/* Places List */}
          <View className="mb-4">
            <Text
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-card-foreground-dark" : "text-card-foreground"
              }`}
            >
              {t("admin.dashboard.all_places")} ({places.length})
            </Text>

            {loading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color={isDark ? "#6C63FF" : "#6C63FF"} />
              </View>
            ) : places.length === 0 ? (
              <View
                className={`p-6 rounded-xl items-center ${
                  isDark ? "bg-card-dark" : "bg-card"
                }`}
              >
                <Text
                  className={`text-sm ${
                    isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                  }`}
                >
                  No places yet. Add your first place!
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {places.map((place) => (
                  <View
                    key={place.id}
                    className={`p-4 rounded-xl ${
                      isDark ? "bg-card-dark border border-border-dark" : "bg-card border border-border"
                    }`}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text
                          className={`text-base font-semibold mb-1 ${
                            isDark ? "text-card-foreground-dark" : "text-card-foreground"
                          }`}
                        >
                          {place.name}
                        </Text>
                        <Text
                          className={`text-xs mb-1 ${
                            isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                          }`}
                        >
                          {t(CATEGORY_LABELS[place.category])}
                        </Text>
                        <Text
                          className={`text-xs ${
                            isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                          }`}
                          numberOfLines={1}
                        >
                          {place.address}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2 mt-3">
                      <Pressable
                        onPress={() => router.push(`/(places)/add?edit=${place.id}`)}
                        className={`flex-1 flex-row items-center justify-center gap-2 py-2 px-3 rounded-lg ${
                          isDark ? "bg-blue-600" : "bg-blue-500"
                        }`}
                      >
                        <PencilSimple size={16} color="#FFFFFF" />
                        <Text className="text-white text-sm font-semibold">Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(place.id, place.name)}
                        className={`flex-row items-center justify-center gap-2 py-2 px-3 rounded-lg ${
                          isDark ? "bg-red-600" : "bg-red-500"
                        }`}
                      >
                        <Trash size={16} color="#FFFFFF" />
                        <Text className="text-white text-sm font-semibold">Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


