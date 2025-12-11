import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ActivityIndicator, Platform, Animated, Pressable, Image, Linking, Dimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Region, Marker, Circle as MapCircle, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { MagnifyingGlass, PersonSimpleWalk, Car, MapPin, Star, X, Sliders } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { getAllPlaces } from "@/services/places-service";
import { Place } from "@/types/place";
import { Category } from "@/types/category";
import { TablerIcon } from "@/components/icons/TablerIcon";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Animated Marker Component
interface AnimatedMarkerProps {
  place: Place;
  categoryColor: string;
  isSelected: boolean;
  index: number;
  onPress: () => void;
}

function AnimatedPlaceMarker({ place, categoryColor, isSelected, index, onPress }: AnimatedMarkerProps) {
  const markerOpacity = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(markerOpacity, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
          delay: index * 100, // Her marker için farklı başlangıç zamanı
        }),
        Animated.timing(markerOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [markerOpacity, index]);
  
  return (
    <Marker
      coordinate={{
        latitude: place.coordinates.latitude,
        longitude: place.coordinates.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={onPress}
    >
      <Animated.View
        style={{
          backgroundColor: categoryColor,
          borderRadius: 24,
          width: 36,
          height: 36,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 2,
          borderColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 6,
          opacity: markerOpacity,
        }}
      >
        <TablerIcon
          name="map-pin"
          size={18}
          color="#FFFFFF"
          strokeWidth={1.5}
        />
      </Animated.View>
    </Marker>
  );
}

// Light mode map style for Google Maps (Android) - hide POIs
const lightMapStyle = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit.station", stylers: [{ visibility: "off" }] },
];

// Dark mode map style for Google Maps (Android)
const darkMapStyle = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit.station", stylers: [{ visibility: "off" }] },
  { elementType: "geometry", stylers: [{ color: "#242538" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242538" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94A3B8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#ECEDEE" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1A1B26" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2E303C" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#2E303C" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94A3B8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2E303C" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#2E303C" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#ECEDEE" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2E303C" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#1A1B26" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#94A3B8" }] },
];

export default function MapScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [radius, setRadius] = useState<number>(5); // km cinsinden
  const [showRadiusFilter, setShowRadiusFilter] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Pulse animation for user location marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Card animation
  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: selectedPlace ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [selectedPlace]);

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

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(locationResult);

      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );

      setLoading(false);
    } catch (err) {
      console.error("Error getting location:", err);
      setError(t("location_error"));
      setLoading(false);
    }
  }, [t]);

  const loadPlaces = useCallback(async () => {
    try {
      setLoadingPlaces(true);
      const placesData = await getAllPlaces();
      setPlaces(placesData);
    } catch (error: any) {
      console.error("Error loading places for map:", error);
    } finally {
      setLoadingPlaces(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      startLocationTracking();
      loadPlaces();

      return () => {
        if (locationSubscription.current) {
          locationSubscription.current.remove();
          locationSubscription.current = null;
        }
      };
    }, [startLocationTracking, loadPlaces])
  );

  useEffect(() => {
    if (places.length > 0 && location) {
      const allLatitudes = [location.coords.latitude, ...places.map(p => p.coordinates.latitude)];
      const allLongitudes = [location.coords.longitude, ...places.map(p => p.coordinates.longitude)];
      
      const minLat = Math.min(...allLatitudes);
      const maxLat = Math.max(...allLatitudes);
      const minLng = Math.min(...allLongitudes);
      const maxLng = Math.max(...allLongitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      const latDelta = Math.max(maxLat - minLat, 0.01) * 1.5;
      const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.5;
      
      setRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      });
    } else if (location && !region) {
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [places, location]);

  const getCategoryColor = (category: Category): string => {
    const colors: Record<Category, string> = {
      cafes: "#E07A5F",
      restaurants: "#81B29A",
      bars: "#3D405B",
      parks: "#F2CC8F",
      beach_clubs: "#38BDF8",
      hotels: "#8B5CF6",
      cinemas: "#EC4899",
      shopping: "#F59E0B",
      gyms: "#EF4444",
      libraries: "#6366F1",
      hospitals: "#DC2626",
      schools: "#10B981",
      churches: "#6B7280",
      banks: "#059669",
      gas_stations: "#F97316",
      parking: "#64748B",
      bus_stops: "#3B82F6",
      train_stations: "#0EA5E9",
      nightclubs: "#A855F7",
      art_galleries: "#EC4899",
      ice_cream: "#F0ABFC",
      bakeries: "#FCD34D",
      bookstores: "#8B5CF6",
    };
    return colors[category] || "#6C63FF";
  };

  const getCategoryIconName = (category: Category): string => {
    const iconMap: Record<Category, string> = {
      cafes: "coffee",
      restaurants: "tools-kitchen",
      bars: "glass-full",
      parks: "tree",
      beach_clubs: "sun-high",
      hotels: "hotel-service",
      cinemas: "movie",
      shopping: "shopping-bag",
      gyms: "gymnastics",
      libraries: "library",
      hospitals: "hospital",
      schools: "school",
      churches: "building-church",
      banks: "building-bank",
      gas_stations: "gas-station",
      parking: "parking",
      bus_stops: "bus",
      train_stations: "train",
      nightclubs: "music",
      art_galleries: "artboard",
      ice_cream: "ice-cream",
      bakeries: "bread",
      bookstores: "book",
    };
    return iconMap[category] || "coffee";
  };

  // Haversine formula ile mesafe hesaplama (km cinsinden)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Yarıçap içindeki mekanları filtrele
  const filteredPlaces = places.filter((place) => {
    if (!location || !place.coordinates) return false;
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      place.coordinates.latitude,
      place.coordinates.longitude
    );
    return distance <= radius;
  });

  const openExternalMap = async (mode: "walking" | "driving") => {
    if (!selectedPlace?.coordinates) return;
    const { latitude, longitude } = selectedPlace.coordinates;
    
    try {
      if (Platform.OS === "ios") {
        const dirFlag = mode === "walking" ? "w" : "d";
        const url = `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=${dirFlag}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          const httpsUrl = `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=${dirFlag}`;
          await Linking.openURL(httpsUrl);
        }
      } else {
        const travelmode = mode === "walking" ? "walking" : "driving";
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${travelmode}`;
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error opening maps app:", error);
    }
  };

  if (loading) {
    return (
      <View className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text className={`mt-4 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {t("getting_location")}
          </Text>
        </View>
      </View>
    );
  }

  if (error || !location || !region) {
    return (
      <View className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
        <View className="flex-1 items-center justify-center px-6">
          <View className={`rounded-3xl p-8 shadow-sm border items-center max-w-xs ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
              {error || t("location_error")}
            </Text>
            <Text className={`text-base text-center leading-6 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              {t("check_permissions")}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const iconNameForPlace = selectedPlace 
    ? getCategoryIconName(selectedPlace.category)
    : "coffee";

  return (
    <View className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      {/* Full Screen Map */}
      <MapView
        style={{ flex: 1 }}
        region={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        followsUserLocation={false}
        mapType="standard"
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        userInterfaceStyle={isDark ? "dark" : "light"}
        customMapStyle={Platform.OS === "android" ? (isDark ? darkMapStyle : lightMapStyle) : undefined}
        onPress={() => setSelectedPlace(null)}
      >
        {/* User Location Marker */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            onPress={() => {
              // En yakın mekanı bul ve detay sayfasına yönlendir
              if (filteredPlaces.length > 0) {
                let nearestPlace = filteredPlaces[0];
                let minDistance = calculateDistance(
                  location.coords.latitude,
                  location.coords.longitude,
                  nearestPlace.coordinates.latitude,
                  nearestPlace.coordinates.longitude
                );
                
                filteredPlaces.forEach((place) => {
                  if (place.coordinates && place.coordinates.latitude !== 0 && place.coordinates.longitude !== 0) {
                    const distance = calculateDistance(
                      location.coords.latitude,
                      location.coords.longitude,
                      place.coordinates.latitude,
                      place.coordinates.longitude
                    );
                    if (distance < minDistance) {
                      minDistance = distance;
                      nearestPlace = place;
                    }
                  }
                });
                
                router.push(`/(places)/${nearestPlace.id}`);
              }
            }}
          >
            <Animated.View
              style={{
                backgroundColor: "#6C63FF", // Primary color
                borderRadius: 24,
                width: 36,
                height: 36,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 6,
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [1, 0.7],
                }),
              }}
            >
              <TablerIcon
                name="user"
                size={18}
                color="#FFFFFF"
                strokeWidth={1.5}
              />
            </Animated.View>
          </Marker>
        )}

          {/* Radius Circle */}
          {location && radius > 0 && (
            <MapCircle
              center={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              radius={radius * 1000} // km'yi metreye çevir
              strokeWidth={2}
              strokeColor={isDark ? "#6C63FF" : "#6C63FF"}
              fillColor={isDark ? "rgba(108, 99, 255, 0.1)" : "rgba(108, 99, 255, 0.1)"}
            />
          )}

          {/* Place Markers */}
          {filteredPlaces.map((place, index) => {
          if (!place.coordinates || place.coordinates.latitude === 0 || place.coordinates.longitude === 0) {
            return null;
          }
          const categoryColor = getCategoryColor(place.category);
          const isSelected = selectedPlace?.id === place.id;
          
          return (
            <AnimatedPlaceMarker
              key={place.id}
              place={place}
              categoryColor={categoryColor}
              isSelected={isSelected}
              index={index}
              onPress={() => router.push(`/(places)/${place.id}`)}
            />
          );
        })}
      </MapView>

      {/* Search Bar and Filter Button */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 16,
          right: 16,
          flexDirection: "row",
          gap: 12,
        }}
      >
        <Pressable
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <MagnifyingGlass size={22} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
          <Text
            style={{
              marginLeft: 12,
              fontSize: 16,
              color: isDark ? "#94A3B8" : "#64748B",
              flex: 1,
            }}
          >
            {t("search_placeholder") || "Mekan ara..."}
          </Text>
        </Pressable>
        
        {/* Filter Button */}
        <Pressable
          onPress={() => setShowRadiusFilter(!showRadiusFilter)}
          style={{
            width: 52,
            height: 52,
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            borderRadius: 16,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            borderWidth: showRadiusFilter ? 2 : 0,
            borderColor: "#6C63FF",
          }}
        >
          <Sliders size={22} color={showRadiusFilter ? "#6C63FF" : (isDark ? "#94A3B8" : "#64748B")} weight="regular" />
        </Pressable>
      </View>

      {/* Radius Filter Panel */}
      {showRadiusFilter && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 80,
            left: 16,
            right: 16,
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: isDark ? "#ECEDEE" : "#11181C",
              }}
            >
              Yarıçap Filtresi
            </Text>
            <Pressable onPress={() => setShowRadiusFilter(false)}>
              <X size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
            </Pressable>
          </View>
          
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#6C63FF",
                textAlign: "center",
              }}
            >
              {radius} km
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#94A3B8" : "#64748B",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              {filteredPlaces.length} mekan gösteriliyor
            </Text>
          </View>

          {/* Slider */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#64748B", minWidth: 30 }}>1km</Text>
            <View style={{ flex: 1, height: 40, justifyContent: "center" }}>
              <Pressable
                style={{
                  height: 40,
                  justifyContent: "center",
                }}
                onPress={(e) => {
                  const { locationX } = e.nativeEvent;
                  const sliderWidth = SCREEN_WIDTH - 32 - 60 - 24; // screen width - padding - labels - gap
                  const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
                  const newRadius = Math.round(1 + percentage * 19);
                  setRadius(newRadius);
                }}
              >
                <View
                  style={{
                    height: 4,
                    backgroundColor: isDark ? "#2E303C" : "#E2E8F0",
                    borderRadius: 2,
                    position: "relative",
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      width: `${((radius - 1) / 19) * 100}%`,
                      height: 4,
                      backgroundColor: "#6C63FF",
                      borderRadius: 2,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: `${((radius - 1) / 19) * 100}%`,
                      width: 20,
                      height: 20,
                      backgroundColor: "#6C63FF",
                      borderRadius: 10,
                      marginLeft: -10,
                      marginTop: -8,
                      shadowColor: "#6C63FF",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  />
                </View>
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#64748B", minWidth: 35 }}>20km</Text>
          </View>

          {/* Quick Select Buttons */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
            {[1, 3, 5, 10, 20].map((r) => (
              <Pressable
                key={r}
                onPress={() => setRadius(r)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: radius === r ? "#6C63FF" : (isDark ? "#2E303C" : "#F1F5F9"),
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: radius === r ? "#FFFFFF" : (isDark ? "#94A3B8" : "#64748B"),
                  }}
                >
                  {r}km
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Loading Indicator */}
      {loadingPlaces && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 80,
            left: 16,
            right: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <ActivityIndicator size="small" color="#6C63FF" />
            <Text
              style={{
                marginLeft: 10,
                fontSize: 14,
                color: isDark ? "#94A3B8" : "#64748B",
              }}
            >
              {t("loading_places")}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Place Card */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          transform: [
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            },
          ],
          opacity: cardAnim,
        }}
        pointerEvents={selectedPlace ? "auto" : "none"}
      >
        <View
          style={{
            backgroundColor: isDark ? "#1A1B26" : "#FFFFFF",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 8,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 24,
          }}
        >
          {/* Handle Bar */}
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? "#2E303C" : "#E2E8F0",
              }}
            />
          </View>

          {selectedPlace && (
            <Pressable onPress={() => router.push(`/(places)/${selectedPlace.id}`)}>
              {/* Place Info Row */}
              <View style={{ flexDirection: "row", marginBottom: 16 }}>
                {/* Place Image */}
                {selectedPlace.images && selectedPlace.images.length > 0 ? (
                  <Image
                    source={{ uri: selectedPlace.images[0] }}
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 16,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 16,
                      backgroundColor: getCategoryColor(selectedPlace.category) + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <TablerIcon
                      name={iconNameForPlace}
                      size={36}
                      color={getCategoryColor(selectedPlace.category)}
                      strokeWidth={1.5}
                    />
                  </View>
                )}

                {/* Place Details */}
                <View style={{ flex: 1, marginLeft: 14, justifyContent: "center" }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isDark ? "#ECEDEE" : "#11181C",
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {selectedPlace.name}
                  </Text>
                  
                  <View
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: getCategoryColor(selectedPlace.category) + "20",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: getCategoryColor(selectedPlace.category),
                      }}
                    >
                      {t(`category_${selectedPlace.category}`)}
                    </Text>
                  </View>

                  {selectedPlace.rating > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Star size={14} color="#FFD700" weight="fill" />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: isDark ? "#ECEDEE" : "#11181C",
                          marginLeft: 4,
                        }}
                      >
                        {selectedPlace.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MapPin size={13} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? "#94A3B8" : "#64748B",
                        marginLeft: 4,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {selectedPlace.address}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Navigation Buttons */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    openExternalMap("walking");
                  }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#6C63FF",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 14,
                    shadowColor: "#6C63FF",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <PersonSimpleWalk size={20} color="#FFFFFF" weight="fill" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 15,
                      fontWeight: "700",
                      marginLeft: 8,
                    }}
                  >
                    {t("walking") || "Yürüyüş"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    openExternalMap("driving");
                  }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 14,
                  }}
                >
                  <Car size={20} color={isDark ? "#ECEDEE" : "#11181C"} weight="fill" />
                  <Text
                    style={{
                      color: isDark ? "#ECEDEE" : "#11181C",
                      fontSize: 15,
                      fontWeight: "700",
                      marginLeft: 8,
                    }}
                  >
                    {t("driving") || "Araç"}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </View>
  );
}
