import { Stack } from "expo-router";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/stores/theme-store";
import "../global.css";

function RootStack() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  
  return (
    <View className={`flex-1 ${isDark ? "dark bg-background-dark" : "bg-background"}`}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#1A1B26" : "#F8F9FA",
          },
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
