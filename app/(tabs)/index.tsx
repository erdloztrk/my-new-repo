import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Dimensions, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MagnifyingGlass, Sparkle } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import * as Location from "expo-location";
import { getWeather } from "@/components/weather/weatherAPI";
import { CurrentWeather } from "@/components/weather/weatherTypes";
import { ComprehensiveWeatherWidget } from "@/components/weather/ComprehensiveWeatherWidget";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Gradient Background Component
function GradientBackground({ isDark }: { isDark: boolean }) {
  // Calculate gradient radius (125% of screen diagonal)
  const diagonal = Math.sqrt(SCREEN_WIDTH * SCREEN_WIDTH + SCREEN_HEIGHT * SCREEN_HEIGHT);
  const gradientRadius = diagonal * 1.25;
  
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
      }}
    >
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
        <Defs>
          {isDark ? (
            // Dark mode: Azure Depths - radial-gradient(125% 125% at 50% 100%, #000000 40%, #350136 100%)
            <RadialGradient
              id="darkGradient"
              cx={SCREEN_WIDTH * 0.5}
              cy={SCREEN_HEIGHT * 1.0}
              r={gradientRadius}
              fx={SCREEN_WIDTH * 0.5}
              fy={SCREEN_HEIGHT * 1.0}
            >
              <Stop offset="0.4" stopColor="#000000" stopOpacity="1" />
              <Stop offset="1" stopColor="#350136" stopOpacity="1" />
            </RadialGradient>
          ) : (
            // Light mode: Amber Glow - radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #f59e0b 100%)
            <RadialGradient
              id="lightGradient"
              cx={SCREEN_WIDTH * 0.5}
              cy={SCREEN_HEIGHT * 0.1}
              r={gradientRadius}
              fx={SCREEN_WIDTH * 0.5}
              fy={SCREEN_HEIGHT * 0.1}
            >
              <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="1" stopColor="#f59e0b" stopOpacity="1" />
            </RadialGradient>
          )}
        </Defs>
        <Rect
          x="0"
          y="0"
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill={isDark ? "url(#darkGradient)" : "url(#lightGradient)"}
        />
      </Svg>
    </View>
  );
}


export default function HomeScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [cityName, setCityName] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = async () => {
    try {
      setWeatherLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setWeatherLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setLocation(currentLocation);

        // Get city name from reverse geocoding
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
          
          if (reverseGeocode && reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            // Try to get city name, fallback to district or region
            const city = address.city || address.district || address.subregion || undefined;
            setCityName(city);
          }
        } catch (geocodeError) {
          console.error("Error reverse geocoding:", geocodeError);
          // Continue without city name
        }

        const weatherData = await getWeather({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (weatherData) {
          setWeather(weatherData.current);
        }
      } catch (error) {
        console.error("Error loading weather:", error);
      } finally {
        setWeatherLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    loadWeather();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadWeather();
  }, []);
  
  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? "#000000" : "#FFFFFF" }}>
      {/* Gradient Background */}
      <GradientBackground isDark={isDark} />
      
      <SafeAreaView className="flex-1" style={{ backgroundColor: "transparent" }}>
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false} 
          style={{ zIndex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "#6C63FF" : "#6C63FF"}
              colors={["#6C63FF"]}
            />
          }
        >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className={`text-sm font-medium ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("welcome")}
          </Text>
          <Text className={`text-3xl font-bold mt-1 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("app_name")}
          </Text>
          <Text className={`text-base mt-2 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("subtitle")}
          </Text>
        </View>

        {/* Search Bar Placeholder */}
        <View className="px-6 mb-6">
          <Pressable className={`flex-row items-center rounded-2xl px-4 py-4 shadow-sm border ${isDark ? "bg-muted-dark border-border-dark" : "bg-muted border-border"}`}>
            <MagnifyingGlass size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
            <Text className={`ml-3 text-base ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {t("search_placeholder")}
            </Text>
          </Pressable>
        </View>

        {/* Weather Widget */}
        <View className="px-6 mb-6">
          <ComprehensiveWeatherWidget
            weather={weather}
            cityName={cityName}
            loading={weatherLoading}
            coordinates={location ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            } : undefined}
          />
        </View>

        {/* Featured Section Placeholder */}
        <View className="px-6 mb-8">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("featured")}
          </Text>
          <View className={`rounded-2xl p-6 shadow-sm border items-center ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            <Sparkle size={40} color="#6C63FF" weight="fill" />
            <Text className={`text-base mt-3 text-center ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {t("featured_message")}
            </Text>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
