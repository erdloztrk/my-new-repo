import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { ThemeProvider, useTheme } from "@/stores/theme-store";
import { SplashScreen } from "@/components/splash/SplashScreen";
import { getCollectionByShareId } from "@/services/collections-service";
import { useAdminStore } from "@/stores/admin-store";
import { logError } from "@/lib/logger";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "../global.css";

const FIRST_LAUNCH_KEY = "@lokal_first_launch";

function RootStack() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { checkAuth } = useAdminStore();

  // Check admin status on app startup
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Check if first launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        if (hasLaunched === null) {
          // First launch
          setIsFirstLaunch(true);
          await AsyncStorage.setItem(FIRST_LAUNCH_KEY, "true");
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        // On error, assume not first launch
        setIsFirstLaunch(false);
      }
    };
    checkFirstLaunch();
  }, []);

  // Handle deep links
  useEffect(() => {
    // Handle initial URL (app opened from link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle URL when app is already running
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, [router]);

  const handleDeepLink = async (url: string) => {
    try {
      const parsedUrl = Linking.parse(url);
      
      // Handle collection share links: lokal://collection/{shareId}
      if (parsedUrl.scheme === "lokal" && parsedUrl.hostname === "collection") {
        const shareId = parsedUrl.path?.split("/").filter(Boolean)[0];
        
        if (!shareId) {
          logError("[DeepLink] No shareId in collection URL:", url);
          return;
        }

        // Wait for splash screen to complete
        if (showSplash) {
          // Wait a bit for navigation to be ready
          setTimeout(async () => {
            await navigateToCollection(shareId);
          }, 500);
        } else {
          await navigateToCollection(shareId);
        }
      }
    } catch (error) {
      logError("[DeepLink] Error handling deep link:", error);
    }
  };

  const navigateToCollection = async (shareId: string) => {
    try {
      const collection = await getCollectionByShareId(shareId);
      
      if (!collection) {
        logError("[DeepLink] Collection not found for shareId:", shareId);
        // Could show an error toast here
        return;
      }

      // Navigate to collection detail screen
      router.push(`/(collections)/${collection.id}`);
    } catch (error) {
      logError("[DeepLink] Error navigating to collection:", error);
    }
  };

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setShowSplash(false);
    
    // If first launch, navigate to profile
    if (isFirstLaunch) {
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        router.replace("/(tabs)/profile");
      }, 100);
    }
  };

  // Show splash screen until animation completes (always show splash, but only redirect on first launch)
  if (showSplash) {
    return (
      <View className={`flex-1 ${isDark ? "dark bg-background-dark" : "bg-background"}`}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SplashScreen onAnimationComplete={handleSplashComplete} />
      </View>
    );
  }

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
      <ErrorBoundary>
        <RootStack />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
