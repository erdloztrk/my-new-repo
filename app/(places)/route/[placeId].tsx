import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, ActivityIndicator, Pressable, Platform, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, PersonSimpleWalk, Car } from "phosphor-react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { getPlaceById } from "@/services/places-service";
import * as Location from "expo-location";
import { Place } from "@/types/place";

// Dark mode map style for Google Maps (Android)
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242538" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242538" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94A3B8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ECEDEE" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2E303C" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1A1B26" }],
  },
];

const lightMapStyle = [];

export default function RouteScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";
  
  const [place, setPlace] = useState<Place | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);
  const [routeMode, setRouteMode] = useState<"foot-walking" | "driving-car">("foot-walking");

  useEffect(() => {
    if (placeId) {
      loadPlace();
      startLocationTracking();
    }

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [placeId]);

  const loadPlace = async () => {
    try {
      if (!placeId) return;
      const placeData = await getPlaceById(placeId);
      
      // Validate place coordinates
      if (!placeData.coordinates || 
          placeData.coordinates.latitude === 0 || 
          placeData.coordinates.longitude === 0) {
        console.error("Place has invalid coordinates");
        setError("Invalid place location");
        setLoading(false);
        return;
      }
      
      setPlace(placeData);
    } catch (error) {
      console.error("Error loading place:", error);
      setError("Failed to load place");
      setLoading(false);
    }
  };

  const startLocationTracking = useCallback(async () => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setError(t("location_permission_required"));
        setLoading(false);
        return;
      }

      // Get initial location
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(locationResult);
      setLoading(false);

      // Start watching position for real-time updates
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
          // Keep both user and destination in view
          if (mapRef.current && place && place.coordinates) {
            const userLat = newLocation.coords.latitude;
            const userLng = newLocation.coords.longitude;
            const destLat = place.coordinates.latitude;
            const destLng = place.coordinates.longitude;
            
            const allLatitudes = [userLat, destLat];
            const allLongitudes = [userLng, destLng];
            const minLat = Math.min(...allLatitudes);
            const maxLat = Math.max(...allLatitudes);
            const minLng = Math.min(...allLongitudes);
            const maxLng = Math.max(...allLongitudes);
            
            mapRef.current.animateToRegion({
              latitude: (minLat + maxLat) / 2,
              longitude: (minLng + maxLng) / 2,
              latitudeDelta: Math.max(maxLat - minLat, 0.01) * 1.5,
              longitudeDelta: Math.max(maxLng - minLng, 0.01) * 1.5,
            }, 1000);
          }
        }
      );
    } catch (error) {
      console.error("Error tracking location:", error);
      setError(t("location_error"));
      setLoading(false);
    }
  }, [place, t]);

  // Keep both user and destination in view
  useEffect(() => {
    if (!location || !place || !place.coordinates) return;

    const userLat = location.coords.latitude;
    const userLng = location.coords.longitude;
    const destLat = place.coordinates.latitude;
    const destLng = place.coordinates.longitude;

    const allLatitudes = [userLat, destLat];
    const allLongitudes = [userLng, destLng];
    const minLat = Math.min(...allLatitudes);
    const maxLat = Math.max(...allLatitudes);
    const minLng = Math.min(...allLongitudes);
    const maxLng = Math.max(...allLongitudes);

    const newRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.01) * 1.5,
      longitudeDelta: Math.max(maxLng - minLng, 0.01) * 1.5,
    };

    setRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 800);
    }
  }, [location, place]);

  const openExternalMap = (mode: "walking" | "driving") => {
    if (!place?.coordinates) return;
    const { latitude, longitude } = place.coordinates;
    if (Platform.OS === "ios") {
      const dirFlag = mode === "walking" ? "w" : "d";
      const url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=${dirFlag}`;
      Linking.openURL(url);
    } else {
      const travelmode = mode === "walking" ? "walking" : "driving";
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${travelmode}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text className={`mt-4 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("loading")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !place || !location || !region) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-3">
              <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
            </Pressable>
            <Text className={`text-xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
              {t("show_route")}
            </Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className={`rounded-3xl p-8 shadow-sm border items-center max-w-xs ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
              {error || t("location_error")}
            </Text>
            <Text className={`text-base text-center leading-6 mb-4 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {error === t("location_permission_required") ? t("check_permissions") : t("location_error")}
            </Text>
            <Pressable
              onPress={() => router.back()}
              className={`px-6 py-3 rounded-xl ${isDark ? "bg-primary" : "bg-primary"}`}
            >
              <Text className="text-white font-semibold">{t("ok")}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Header */}
      <View className={`px-6 pt-4 pb-4 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color={isDark ? "#ECEDEE" : "#11181C"} weight="regular" />
          </Pressable>
          <Text className={`text-xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("show_route")}
          </Text>
        </View>
      </View>

      {/* Map */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          region={region}
          showsUserLocation={true}
          userInterfaceStyle={isDark ? "dark" : "light"}
          customMapStyle={Platform.OS === "android" ? (isDark ? darkMapStyle : lightMapStyle) : undefined}
        >
          {/* Place Marker */}
          {place && place.coordinates && (
            <Marker
              coordinate={{
                latitude: place.coordinates.latitude,
                longitude: place.coordinates.longitude,
              }}
              title={place.name}
              description={place.address}
            />
          )}

        </MapView>
      </View>

      {/* Route Info */}
      <View className={`px-6 py-4 border-t ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
        <Text className={`text-lg font-bold mb-3 ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
          {place.name}
        </Text>

        {place.address && (
          <Text className={`text-sm mb-3 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {place.address}
          </Text>
        )}

        {/* Route Mode Selection */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={() => {
              setRouteMode("foot-walking");
              openExternalMap("walking");
            }}
            className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl ${
              routeMode === "foot-walking"
                ? "bg-primary"
                : isDark
                ? "bg-muted-dark"
                : "bg-muted border border-border"
            }`}
          >
            <PersonSimpleWalk
              size={20}
              color={routeMode === "foot-walking" ? "#FFFFFF" : isDark ? "#ECEDEE" : "#11181C"}
              weight={routeMode === "foot-walking" ? "fill" : "regular"}
            />
            <Text
              className={`ml-2 font-semibold ${
                routeMode === "foot-walking"
                  ? "text-white"
                  : isDark
                  ? "text-foreground-dark"
                  : "text-foreground"
              }`}
            >
              {t("walking")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setRouteMode("driving-car");
              openExternalMap("driving");
            }}
            className={`flex-1 flex-row items-center justify-center py-3 px-4 rounded-xl ${
              routeMode === "driving-car"
                ? "bg-primary"
                : isDark
                ? "bg-muted-dark"
                : "bg-muted border border-border"
            }`}
          >
            <Car
              size={20}
              color={routeMode === "driving-car" ? "#FFFFFF" : isDark ? "#ECEDEE" : "#11181C"}
              weight={routeMode === "driving-car" ? "fill" : "regular"}
            />
            <Text
              className={`ml-2 font-semibold ${
                routeMode === "driving-car"
                  ? "text-white"
                  : isDark
                  ? "text-foreground-dark"
                  : "text-foreground"
              }`}
            >
              {t("driving")}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
