import { Tabs } from "expo-router";
import { MagnifyingGlass, MapTrifold, Bookmark, UserCircle } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";

export default function TabLayout() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6C63FF", // primary
        tabBarInactiveTintColor: isDark ? "rgb(148, 163, 184)" : "rgb(100, 116, 139)", // muted-foreground
        tabBarStyle: {
          backgroundColor: isDark ? "rgb(26, 27, 38)" : "rgb(255, 255, 255)", // background / card
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgb(46, 48, 60)" : "rgb(226, 232, 240)", // border
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("explore"),
          tabBarIcon: ({ color, size }) => (
            <MagnifyingGlass size={size} color={color} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t("map"),
          tabBarIcon: ({ color, size }) => (
            <MapTrifold size={size} color={color} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t("saved"),
          tabBarIcon: ({ color, size }) => (
            <Bookmark size={size} color={color} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size} color={color} weight="regular" />
          ),
        }}
      />
    </Tabs>
  );
}
