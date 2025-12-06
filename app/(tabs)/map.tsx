import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Region, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { useTheme } from "@/stores/theme-store";

// Light mode map style for Google Maps (Android) - hide POIs
const lightMapStyle = [
  // Hide all POIs (Points of Interest)
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
  // Keep parks visible but without labels
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  // Hide transit stations
  { featureType: "transit.station", stylers: [{ visibility: "off" }] },
];

// Dark mode map style for Google Maps (Android) - hide POIs
const darkMapStyle = [
  // Hide all POIs (Points of Interest)
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
  // Keep parks visible but without labels
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  // Hide transit stations
  { featureType: "transit.station", stylers: [{ visibility: "off" }] },
  // Dark theme colors
  { elementType: "geometry", stylers: [{ color: "#242538" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242538" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94A3B8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ECEDEE" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1A1B26" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2E303C" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2E303C" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94A3B8" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2E303C" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2E303C" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ECEDEE" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2E303C" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1A1B26" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94A3B8" }],
  },
];

export default function MapScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getLocation() {
      try {
        // Check permission
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          setError("Konum izni gerekli");
          setLoading(false);
          return;
        }

        // Get current location
        const locationResult = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          maximumAge: 60000,
        });

        setLocation(locationResult);

        // Set map region to user location
        const newRegion: Region = {
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
          latitudeDelta: 0.01, // Zoom level
          longitudeDelta: 0.01,
        };

        setRegion(newRegion);
        setLoading(false);
      } catch (err) {
        console.error("Error getting location:", err);
        setError("Konum alınamadı");
        setLoading(false);
      }
    }

    getLocation();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Harita
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text className={`mt-4 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            Konumunuz alınıyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !location || !region) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Harita
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className={`rounded-3xl p-8 shadow-sm border items-center max-w-xs ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
              {error || "Konum alınamadı"}
            </Text>
            <Text className={`text-base text-center leading-6 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              Lütfen konum izinlerini kontrol edin.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
        <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
          Harita
        </Text>
      </View>

      {/* Map */}
      <View className="flex-1">
        <MapView
          style={{ flex: 1 }}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={true}
          followsUserLocation={false}
          mapType="standard"
          // iOS: Hide POIs
          showsPointsOfInterest={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          // iOS: userInterfaceStyle for Apple Maps dark mode
          userInterfaceStyle={isDark ? "dark" : "light"}
          // Android: customMapStyle for Google Maps (hides POIs + dark theme)
          customMapStyle={Platform.OS === "android" ? (isDark ? darkMapStyle : lightMapStyle) : undefined}
        />
      </View>
    </SafeAreaView>
  );
}
