import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ActivityIndicator, Platform, Animated, Pressable, Image, Linking, Dimensions, ScrollView, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Region, Marker, Circle as MapCircle, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { PersonSimpleWalk, Car, MapPin, Star, X, Sliders, Check } from "phosphor-react-native";
import { FilterAccordion } from "@/components/filters/FilterAccordion";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { getAllPlaces } from "@/services/places-service";
import { Place } from "@/types/place";
import { Category } from "@/types/category";
import { TablerIcon } from "@/components/icons/TablerIcon";
import { CATEGORIES } from "@/utils/categories";
import { DepthWidget } from "@/components/bathymetry/DepthWidget";
import { useBathymetryStore } from "@/stores/bathymetry-store";
import { getWeather } from "@/components/weather/weatherAPI";
import type { CurrentWeather } from "@/components/weather/weatherTypes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Place Marker Component
interface PlaceMarkerProps {
  place: Place;
  categoryColor: string;
  isSelected: boolean;
  index: number;
  onPress: () => void;
}

function PlaceMarker({ place, categoryColor, isSelected, index, onPress }: PlaceMarkerProps) {
  return (
    <Marker
      coordinate={{
        latitude: place.coordinates.latitude,
        longitude: place.coordinates.longitude,
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      onPress={(e) => {
        e.stopPropagation();
        // Close depth widget when place is selected
        useBathymetryStore.getState().setSelectedCoord(null);
        onPress();
      }}
    >
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TablerIcon
          name="location-target"
          size={24}
          color={categoryColor}
          strokeWidth={1}
        />
      </View>
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
  // Filter states
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [radius, setRadius] = useState<number>(5); // km cinsinden
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]); // Boş array = tüm kategoriler seçili
  
  // Accordion states
  const [isRadiusExpanded, setIsRadiusExpanded] = useState(false);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  
  // Pending filter states (before apply)
  const [pendingRadius, setPendingRadius] = useState<number>(5);
  const [pendingCategories, setPendingCategories] = useState<Category[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  
  // Bathymetry store
  const selectedCoord = useBathymetryStore((state) => state.selectedCoord);
  const contours = useBathymetryStore((state) => state.contours);
  const queryContours = useBathymetryStore((state) => state.queryContours);
  
  // Weather state
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  
  // Debounce timer for contour queries
  const contourQueryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Load bathymetry cache on mount
  useEffect(() => {
    useBathymetryStore.getState().loadCache();
  }, []);
  
  // Load weather when location is available
  useEffect(() => {
    if (location) {
      getWeather({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }).then((weatherData) => {
        if (weatherData) {
          setWeather(weatherData.current);
        }
      }).catch((error) => {
        console.error("Error loading weather:", error);
      });
    }
  }, [location]);
  
  // Load contours when region changes (debounced)
  useEffect(() => {
    if (!region) return;
    
    // Clear previous timer
    if (contourQueryTimer.current) {
      clearTimeout(contourQueryTimer.current);
    }
    
    // Debounce contour queries (wait 500ms after region stops changing)
    contourQueryTimer.current = setTimeout(() => {
      const minLat = region.latitude - region.latitudeDelta / 2;
      const maxLat = region.latitude + region.latitudeDelta / 2;
      const minLon = region.longitude - region.longitudeDelta / 2;
      const maxLon = region.longitude + region.longitudeDelta / 2;
      
      queryContours(minLat, maxLat, minLon, maxLon);
    }, 500);
    
    return () => {
      if (contourQueryTimer.current) {
        clearTimeout(contourQueryTimer.current);
      }
    };
  }, [region, queryContours]);
  
  // Helper function to get contour color based on depth interval
  const getContourColor = (interval: number): string => {
    // Deeper = darker blue
    if (interval >= 100) return isDark ? "#1E3A8A" : "#1E40AF"; // Very deep
    if (interval >= 50) return isDark ? "#1E40AF" : "#2563EB"; // Deep
    if (interval >= 30) return isDark ? "#2563EB" : "#3B82F6"; // Moderate-deep
    if (interval >= 20) return isDark ? "#3B82F6" : "#60A5FA"; // Moderate
    if (interval >= 15) return isDark ? "#60A5FA" : "#93C5FD"; // Shallow-moderate
    if (interval >= 10) return isDark ? "#93C5FD" : "#BFDBFE"; // Shallow
    return isDark ? "#BFDBFE" : "#DBEAFE"; // Very shallow
  };

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

  // Yarıçap ve kategori içindeki mekanları filtrele
  const filteredPlaces = places.filter((place) => {
    if (!location || !place.coordinates) return false;
    
    // Kategori filtresi: selectedCategories boşsa tüm kategoriler, değilse sadece seçili olanlar
    if (selectedCategories.length > 0 && !selectedCategories.includes(place.category)) {
      return false;
    }
    
    // Yarıçap filtresi
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      place.coordinates.latitude,
      place.coordinates.longitude
    );
    return distance <= radius;
  });

  // Preview için pending filtreleri kullanarak mekan sayısını hesapla
  const previewFilteredCount = showFilterPanel
    ? places.filter((place) => {
        if (!location || !place.coordinates) return false;
        
        // Kategori filtresi: pendingCategories boşsa tüm kategoriler
        if (pendingCategories.length > 0 && !pendingCategories.includes(place.category)) {
          return false;
        }
        
        // Yarıçap filtresi
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          place.coordinates.latitude,
          place.coordinates.longitude
        );
        return distance <= pendingRadius;
      }).length
    : filteredPlaces.length;

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
    <View className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`} style={{ position: "relative", overflow: "visible" }}>
      {/* Full Screen Map */}
      <MapView
        style={{ flex: 1, zIndex: 0 }}
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
        onPress={async (e) => {
          setSelectedPlace(null);
          // Handle map tap for depth query - only open widget for water (depth < 0)
          const coordinate = e.nativeEvent?.coordinate;
          if (coordinate) {
            const { latitude, longitude } = coordinate;
            console.log("[Map] Tap detected:", { latitude, longitude });
            
            // Check depth first - only open widget if it's water (depth < 0)
            try {
              const { getDepth } = await import("@/services/bathymetry-service");
              const depthResponse = await getDepth(latitude, longitude);
              
              // Only open widget if depth is negative (water) or if depth query failed (might be water)
              if (depthResponse.depth_m < 0) {
                useBathymetryStore.getState().setSelectedCoord({ lat: latitude, lon: longitude });
              } else {
                // Land or positive elevation - don't open widget
                console.log("[Map] Land detected, not opening depth widget");
                useBathymetryStore.getState().setSelectedCoord(null);
              }
            } catch (error) {
              // If depth query fails, don't open widget (safer default)
              console.log("[Map] Depth query failed, not opening widget:", error);
              useBathymetryStore.getState().setSelectedCoord(null);
            }
          }
        }}
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
            onPress={(e) => {
              e.stopPropagation();
              // Close depth widget when user location is tapped
              useBathymetryStore.getState().setSelectedCoord(null);
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
                justifyContent: "center",
                alignItems: "center",
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [1, 0.7],
                }),
              }}
            >
              {/* Glow effect wrapper for dark mode */}
              {isDark ? (
                <View
                  style={{
                    shadowColor: "#4DFFFF",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.9,
                    shadowRadius: 12,
                    elevation: 12,
                  }}
                >
                  <TablerIcon
                    name="user-location"
                    size={24}
                    color="#4DFFFF" // Neon Cyan for dark mode
                    strokeWidth={1.5}
                  />
                </View>
              ) : (
                <View
                  style={{
                    shadowColor: "#5B6CFF",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <TablerIcon
                    name="user-location"
                    size={24}
                    color="#5B6CFF" // Brand color for light mode
                    strokeWidth={1}
                  />
                </View>
              )}
            </Animated.View>
          </Marker>
        )}

          {/* Depth Contour Lines */}
          {contours.map((contour, index) => (
            <Polyline
              key={`contour-${contour.interval}-${index}`}
              coordinates={contour.coordinates.map(([lat, lon]) => ({
                latitude: lat,
                longitude: lon,
              }))}
              strokeColor={getContourColor(contour.interval)}
              strokeWidth={1.5}
              lineCap="round"
              lineJoin="round"
              zIndex={1}
            />
          ))}

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
            <PlaceMarker
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

      {/* Filter Buttons */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 12,
          right: 16,
          flexDirection: "row",
          gap: 12,
        }}
      >
        {/* Filter Button */}
        <Pressable
          onPress={() => {
            setShowFilterPanel(!showFilterPanel);
            if (!showFilterPanel) {
              // Panel açılırken pending state'leri mevcut değerlere eşitle
              setPendingRadius(radius);
              setPendingCategories(selectedCategories);
            }
          }}
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
            borderWidth: showFilterPanel ? 2 : 0,
            borderColor: "#6C63FF",
          }}
        >
          <Sliders size={22} color={showFilterPanel ? "#6C63FF" : (isDark ? "#94A3B8" : "#64748B")} weight="regular" />
        </Pressable>
      </View>


      {/* Depth Widget - Using Modal for proper overlay */}
      <Modal
        visible={!!selectedCoord}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          useBathymetryStore.getState().setSelectedCoord(null);
        }}
      >
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onPress={() => {
            useBathymetryStore.getState().setSelectedCoord(null);
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <DepthWidget
              onClose={() => {
                useBathymetryStore.getState().setSelectedCoord(null);
              }}
              weather={weather}
            />
          </Pressable>
        </Pressable>
      </Modal>
      

      {/* Professional Filter Panel */}
      {showFilterPanel && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 80,
            left: 16,
            right: 16,
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 16,
            maxHeight: SCREEN_WIDTH * 0.85,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#2E303C" : "#E2E8F0",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: isDark ? "#ECEDEE" : "#11181C",
              }}
            >
              Filtreler
            </Text>
            <Pressable
              onPress={() => {
                setShowFilterPanel(false);
                // Pending değişiklikleri iptal et
                setPendingRadius(radius);
                setPendingCategories(selectedCategories);
                setIsRadiusExpanded(false);
                setIsCategoryExpanded(false);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <X size={18} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Accordion: Radius Filter */}
            <FilterAccordion
              title="Yarıçap"
              summary={pendingRadius === 5 ? "Varsayılan: 5 km" : `${pendingRadius} km`}
              isExpanded={isRadiusExpanded}
              onToggle={() => setIsRadiusExpanded(!isRadiusExpanded)}
              isDark={isDark}
            >
            {/* Radius Display */}
            <View style={{ marginBottom: 16, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  color: "#6C63FF",
                  marginBottom: 4,
                }}
              >
                {pendingRadius} km
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#94A3B8" : "#64748B",
                }}
              >
                {previewFilteredCount} mekan gösterilecek
              </Text>
            </View>

            {/* Slider */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#64748B", minWidth: 35, fontWeight: "500" }}>
                1 km
              </Text>
              <View style={{ flex: 1, height: 40, justifyContent: "center" }}>
                <Pressable
                  style={{
                    height: 40,
                    justifyContent: "center",
                  }}
                  onPress={(e) => {
                    const { locationX } = e.nativeEvent;
                    const sliderWidth = SCREEN_WIDTH - 32 - 70 - 24; // screen width - padding - labels - gap
                    const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
                    const newRadius = Math.round(1 + percentage * 19);
                    setPendingRadius(newRadius);
                  }}
                >
                  <View
                    style={{
                      height: 6,
                      backgroundColor: isDark ? "#2E303C" : "#E2E8F0",
                      borderRadius: 3,
                      position: "relative",
                    }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        width: `${((pendingRadius - 1) / 19) * 100}%`,
                        height: 6,
                        backgroundColor: "#6C63FF",
                        borderRadius: 3,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        left: `${((pendingRadius - 1) / 19) * 100}%`,
                        width: 24,
                        height: 24,
                        backgroundColor: "#6C63FF",
                        borderRadius: 12,
                        marginLeft: -12,
                        marginTop: -9,
                        shadowColor: "#6C63FF",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.4,
                        shadowRadius: 4,
                        elevation: 4,
                        borderWidth: 3,
                        borderColor: isDark ? "#1E293B" : "#FFFFFF",
                      }}
                    />
                  </View>
                </Pressable>
              </View>
              <Text style={{ fontSize: 12, color: isDark ? "#94A3B8" : "#64748B", minWidth: 35, fontWeight: "500" }}>
                20 km
              </Text>
            </View>

            {/* Quick Select Buttons */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[1, 3, 5, 10, 20].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setPendingRadius(r)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: pendingRadius === r ? "#6C63FF" : isDark ? "#2E303C" : "#F1F5F9",
                    alignItems: "center",
                    borderWidth: pendingRadius === r ? 0 : 1,
                    borderColor: isDark ? "#2E303C" : "#E2E8F0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: pendingRadius === r ? "#FFFFFF" : isDark ? "#94A3B8" : "#64748B",
                    }}
                  >
                    {r} km
                  </Text>
                </Pressable>
              ))}
            </View>
          </FilterAccordion>

          {/* Accordion: Category Filter */}
          <FilterAccordion
            title="Kategoriler"
            summary={
              pendingCategories.length === 0
                ? "Tüm kategoriler"
                : `${pendingCategories.length} kategori seçili`
            }
            isExpanded={isCategoryExpanded}
            onToggle={() => setIsCategoryExpanded(!isCategoryExpanded)}
            isDark={isDark}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const isSelected =
                  pendingCategories.length === 0 || pendingCategories.includes(cat.category);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      if (pendingCategories.length === 0) {
                        setPendingCategories([cat.category]);
                      } else if (isSelected) {
                        const newCategories = pendingCategories.filter((c) => c !== cat.category);
                        setPendingCategories(newCategories.length === 0 ? [] : newCategories);
                      } else {
                        setPendingCategories([...pendingCategories, cat.category]);
                      }
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 24,
                      backgroundColor: isSelected
                        ? `${cat.color}20`
                        : isDark
                        ? "#2E303C"
                        : "#F1F5F9",
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected
                        ? cat.color
                        : isDark
                        ? "#2E303C"
                        : "#E2E8F0",
                      minHeight: 44, // Touch target
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: cat.color,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 6,
                        }}
                      >
                        <Check size={12} color="#FFFFFF" weight="bold" />
                      </View>
                    )}
                    <TablerIcon
                      name={cat.iconName}
                      size={18}
                      color={isSelected ? cat.color : isDark ? "#94A3B8" : "#64748B"}
                    />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 13,
                        fontWeight: "600",
                        color: isSelected
                          ? cat.color
                          : isDark
                          ? "#94A3B8"
                          : "#64748B",
                      }}
                    >
                      {t(cat.nameKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {pendingCategories.length > 0 && (
              <Pressable
                onPress={() => setPendingCategories([])}
                style={{
                  marginTop: 16,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: isDark ? "#2E303C" : "#E2E8F0",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#6C63FF",
                  }}
                >
                  Tümünü Temizle
                </Text>
              </Pressable>
            )}
          </FilterAccordion>
          </ScrollView>

          {/* Action Buttons - Fixed at bottom */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              padding: 20,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: isDark ? "#2E303C" : "#E2E8F0",
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            }}
          >
            <Pressable
              onPress={() => {
                // Reset to defaults
                setPendingRadius(5);
                setPendingCategories([]);
                setRadius(5);
                setSelectedCategories([]);
                setIsRadiusExpanded(false);
                setIsCategoryExpanded(false);
              }}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: isDark ? "#2E303C" : "#F1F5F9",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "#2E303C" : "#E2E8F0",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: isDark ? "#94A3B8" : "#64748B",
                }}
              >
                Temizle
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                // Apply filters
                setRadius(pendingRadius);
                setSelectedCategories(pendingCategories);
                setShowFilterPanel(false);
                setIsRadiusExpanded(false);
                setIsCategoryExpanded(false);
              }}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: "#6C63FF",
                alignItems: "center",
                shadowColor: "#6C63FF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#FFFFFF",
                }}
              >
                Uygula
              </Text>
            </Pressable>
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
