import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, ActivityIndicator, Platform, Animated, Pressable, Image, Linking, Dimensions, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Circle as MapCircle, Region } from "react-native-maps";
import MapViewClustering from "react-native-map-clustering";
import { router } from "expo-router";
import { PersonSimpleWalk, Car, MapPin, Star, X, Sliders, Globe, Sun, Moon, Fish, Waves, Folder } from "phosphor-react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { Place } from "@/types/place";
import { Category } from "@/types/category";
import { useBathymetryStore } from "@/stores/bathymetry-store";
import { logError, logDebug } from "@/lib/logger";
import { ThemeToggle } from "@/components/ThemeToggle";
// ViewModel hooks
import { useMapLocation } from "@/hooks/map/useMapLocation";
import { useMapPlaces } from "@/hooks/map/useMapPlaces";
import { useMapRegion } from "@/hooks/map/useMapRegion";
import { useMapWeather } from "@/hooks/map/useMapWeather";
import { useMapBathymetry } from "@/hooks/map/useMapBathymetry";
import { usePlaceCollections } from "@/hooks/map/usePlaceCollections";
import { getCategoryColor, getCategoryIconName, calculateDistance } from "@/utils/mapHelpers";
import { WeatherDataCard } from "@/components/weather/WeatherDataCard";
import { getWeather } from "@/components/weather/weatherAPI";
import type { CurrentWeather, WeatherResponse } from "@/components/weather/weatherTypes";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";
import { PlaceBottomSheet } from "@/components/map/PlaceBottomSheet";
import { PlaceMarker } from "@/components/map/PlaceMarker";
import { ClusterMarker } from "@/components/map/ClusterMarker";
import { FilterPanel } from "@/components/map/FilterPanel";
import { WeatherWidgets } from "@/components/map/WeatherWidgets";
import { debounce } from "@/utils/debounce";

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MapScreen() {
  const { colorScheme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  // UI-only state (filter panel, selected place, etc.)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [radius, setRadius] = useState<number>(5); // km
  const [isRadiusEnabled, setIsRadiusEnabled] = useState<boolean>(true); // Radius filter enabled/disabled
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [pendingRadius, setPendingRadius] = useState<number>(5);
  const [pendingRadiusEnabled, setPendingRadiusEnabled] = useState<boolean>(true);
  const [pendingCategories, setPendingCategories] = useState<Category[]>([]);
  const [pendingCollections, setPendingCollections] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [isBathymetryEnabled, setIsBathymetryEnabled] = useState<boolean>(false);
  const [isWeatherSelectionMode, setIsWeatherSelectionMode] = useState<boolean>(false);
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);
  const [selectedWeatherLocation, setSelectedWeatherLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedWeatherData, setSelectedWeatherData] = useState<{ weather: CurrentWeather | null; forecastList: WeatherResponse["forecastList"] } | null>(null);
  const [weatherModalLoading, setWeatherModalLoading] = useState<boolean>(false);
  const [showAddToCollection, setShowAddToCollection] = useState<boolean>(false);
  const [quickFilter, setQuickFilter] = useState<"nearest" | "most_popular" | null>(null);

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);

  // Debounced region change handler
  const debouncedRegionChange = useRef(
    debounce((r: any) => {
      if (userIsInteracting.current) {
        setRegion(r);
        setTimeout(() => {
          handleMapInteractionEnd();
        }, 100);
      }
    }, 500)
  ).current;

  // ViewModel hooks - business logic extracted
  const { location, loading, error } = useMapLocation(t("location_permission_required"));
  const { filteredPlaces, loading: loadingPlaces, getPreviewCount } = useMapPlaces({
    location,
    radius: isRadiusEnabled ? radius : Infinity, // If disabled, use Infinity to show all places
    selectedCategories,
  });
  const { region, setRegion, userIsInteracting, handleMapInteractionStart, handleMapInteractionEnd } =
    useMapRegion({
      location,
      places: filteredPlaces,
      followMe: true, // Always follow user location
    });
  const { weather, forecastList } = useMapWeather(location);
  const { depthPin, handleMapTap, clearDepthPin } = useMapBathymetry();

  // Load bathymetry cache on mount
  useEffect(() => {
    useBathymetryStore.getState().loadCache();
  }, []);

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


  // Fetch collections for visible places (before filtering)
  const placeCollectionsMap = usePlaceCollections(filteredPlaces);

  // Sort places based on quick filter and apply collection filter
  const sortedPlaces = useMemo(() => {
    let places = [...filteredPlaces];
    
    // Apply collection filter
    if (selectedCollections.length > 0) {
      places = places.filter(place => {
        const placeCollections = placeCollectionsMap[place.id] || [];
        // Check if place is in any of the selected collections
        return placeCollections.some(collection => selectedCollections.includes(collection.id));
      });
    }
    
    // Apply quick filter sorting
    if (quickFilter === "nearest" && location?.coords) {
      places.sort((a, b) => {
        if (!a.coordinates || !b.coordinates) return 0;
        const distA = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          a.coordinates.latitude,
          a.coordinates.longitude
        );
        const distB = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          b.coordinates.latitude,
          b.coordinates.longitude
        );
        return distA - distB;
      });
    } else if (quickFilter === "most_popular") {
      places.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return places;
  }, [filteredPlaces, quickFilter, location?.coords, selectedCollections, placeCollectionsMap]);

  // Preview count for pending filters (including collection filter)
  const previewFilteredCount = useMemo(() => {
    if (!showFilterPanel) return filteredPlaces.length;
    
    let places = filteredPlaces;
    
    // Apply collection filter to preview
    if (pendingCollections.length > 0) {
      places = places.filter(place => {
        const placeCollections = placeCollectionsMap[place.id] || [];
        return placeCollections.some(collection => pendingCollections.includes(collection.id));
      });
    }
    
    // Apply radius and category filters
    const count = getPreviewCount(pendingRadiusEnabled ? pendingRadius : Infinity, pendingCategories);
    
    return Math.min(count, places.length);
  }, [showFilterPanel, pendingRadius, pendingRadiusEnabled, pendingCategories, pendingCollections, filteredPlaces, placeCollectionsMap, getPreviewCount]);

  // Memoize place markers to avoid re-rendering on every map interaction
  const placeMarkers = useMemo(() => {
    return sortedPlaces.map((place, index) => {
      if (!place.coordinates || place.coordinates.latitude === 0 || place.coordinates.longitude === 0) {
        return null;
      }
      const categoryColor = getCategoryColor(place.category);
      const isSelected = selectedPlace?.id === place.id;
      const collections = placeCollectionsMap[place.id] || [];
      
      return (
        <PlaceMarker
          key={place.id}
          place={place}
          categoryColor={categoryColor}
          isSelected={isSelected}
          index={index}
          collections={collections}
          onPress={() => {
            setSelectedPlace(place);
          }}
        />
      );
    });
  }, [sortedPlaces, selectedPlace?.id, placeCollectionsMap]);



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

  if (error || !location) {
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

  // Use region if available, otherwise create from location (old behavior)
  const mapRegion: Region = region || {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Full Screen Map */}
      <MapView
          style={{ flex: 1, width: "100%", height: "100%" }}
          initialRegion={mapRegion}
          region={mapRegion}
          ref={mapRef}
          onPanDrag={() => {
            handleMapInteractionStart();
          }}
          onRegionChangeComplete={(r) => {
            // Debounced region change handler
            debouncedRegionChange(r);
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          followsUserLocation={false}
          mapType={mapType}
          showsPointsOfInterest={false}
          showsBuildings={false}
          showsTraffic={false}
          showsIndoors={false}
          userInterfaceStyle={isDark ? "dark" : "light"}
          customMapStyle={Platform.OS === "android" && mapType === "standard" ? (isDark ? darkMapStyle : lightMapStyle) : undefined}
          onPress={(e) => {
            setSelectedPlace(null);
            clearDepthPin();
            const coordinate = e.nativeEvent?.coordinate;
            if (coordinate) {
              if (isBathymetryEnabled) {
                handleMapTap(coordinate.latitude, coordinate.longitude);
              }
              if (isWeatherSelectionMode) {
                // Set selected location and fetch weather data
                setSelectedWeatherLocation({
                  latitude: coordinate.latitude,
                  longitude: coordinate.longitude,
                });
                setWeatherModalLoading(true);
                setShowWeatherModal(true);
                setIsWeatherSelectionMode(false); // Exit selection mode
                
                getWeather({
                  latitude: coordinate.latitude,
                  longitude: coordinate.longitude,
                })
                  .then((weatherData) => {
                    if (weatherData) {
                      setSelectedWeatherData({
                        weather: weatherData.current,
                        forecastList: weatherData.forecastList,
                      });
                    }
                  })
                  .catch((error) => {
                    console.error("Error loading weather:", error);
                  })
                  .finally(() => {
                    setWeatherModalLoading(false);
                  });
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
                  outputRange: [1, 0.3],
                }),
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              }}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: "#EF4444", // red-500
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              />
            </Animated.View>
          </Marker>
        )}

          {/* Depth Pin Marker (for selected water point) */}
          {depthPin && (
            <Marker
              coordinate={{
                latitude: depthPin.lat,
                longitude: depthPin.lon,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              onPress={(e) => {
                e.stopPropagation();
                // Navigate to detailed bathymetry analysis page
                router.push({
                  pathname: "/(places)/bathymetry",
                  params: {
                    lat: depthPin.lat.toString(),
                    lon: depthPin.lon.toString(),
                  },
                });
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#EF4444",
                  borderWidth: 2,
                  borderColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              />
            </Marker>
          )}

          {/* Radius Circle */}
          {location && isRadiusEnabled && radius > 0 && (
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

          {/* Place Markers - Clustered (automatic clustering via MapView) */}
          {placeMarkers}

          {/* Selected Weather Location Marker */}
          {isWeatherSelectionMode && selectedWeatherLocation && (
            <Marker
              coordinate={selectedWeatherLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={1000}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#6C63FF",
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              />
            </Marker>
          )}

        </MapView>

      {/* Quick Filter Chips */}
      {filteredPlaces.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 16,
            left: 16,
            right: 80, // Space for filter button
            zIndex: 400,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <Pressable
              onPress={() => {
                setQuickFilter(quickFilter === "nearest" ? null : "nearest");
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: quickFilter === "nearest" 
                  ? "#6C63FF" 
                  : (isDark ? "#334155" : "#F1F5F9"),
                borderRadius: 20,
                borderWidth: 1,
                borderColor: quickFilter === "nearest"
                  ? "#6C63FF"
                  : (isDark ? "#475569" : "#E2E8F0"),
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: quickFilter === "nearest"
                    ? "#FFFFFF"
                    : (isDark ? "#F8FAFC" : "#0F172A"),
                }}
              >
                {t("filter_nearest")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setQuickFilter(quickFilter === "most_popular" ? null : "most_popular");
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: quickFilter === "most_popular"
                  ? "#6C63FF"
                  : (isDark ? "#334155" : "#F1F5F9"),
                borderRadius: 20,
                borderWidth: 1,
                borderColor: quickFilter === "most_popular"
                  ? "#6C63FF"
                  : (isDark ? "#475569" : "#E2E8F0"),
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: quickFilter === "most_popular"
                    ? "#FFFFFF"
                    : (isDark ? "#F8FAFC" : "#0F172A"),
                }}
              >
                {t("filter_most_popular")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* Top Right Buttons - Wind, Bathymetry, Filter, Map Type, Theme */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 12,
          right: 16,
          flexDirection: "row",
          gap: 12,
          zIndex: 500,
        }}
      >
        {/* Wind Button - Activates Location Selection Mode */}
        <Pressable
          onPress={() => {
            setIsWeatherSelectionMode(!isWeatherSelectionMode);
            if (isWeatherSelectionMode) {
              // If disabling, close modal and reset
              setShowWeatherModal(false);
              setSelectedWeatherLocation(null);
              setSelectedWeatherData(null);
              setWeatherModalLoading(false);
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
            borderWidth: isWeatherSelectionMode ? 2 : 1,
            borderColor: isWeatherSelectionMode ? "#6C63FF" : (isDark ? "#334155" : "#E2E8F0"),
          }}
        >
          <Svg width={24} height={24} viewBox="0 0 256 256">
            <Path
              d="M224,224H182.94l-6.3-44.12,3.24,1.91a16,16,0,0,0,21.91-5.67l12-20.34a16,16,0,0,0-5.67-21.91l-35-20.61,40.69-69.13a16,16,0,0,0-5.67-21.91l-20.34-12a16,16,0,0,0-21.91,5.67l-20.61,35L76.12,10.22a16,16,0,0,0-21.91,5.67l-12,20.33a16,16,0,0,0,5.67,21.92l35,20.61L42.21,147.88a16,16,0,0,0,5.67,21.91l20.34,12a15.57,15.57,0,0,0,10.58,2L73.06,224H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16Zm-24-76.34L188,168l-69.13-40.69,12-20.35ZM179.66,24,200,36l-40.69,69.14L139,93.17ZM56,44.35,68,24,137.14,64.7l-12,20.35ZM76.34,168,56,156,96.69,86.86l20.36,12Zm12.88,56L98,162.8l12.77-21.7L159,169.5l7.79,54.5Z"
              fill={isWeatherSelectionMode ? "#6C63FF" : (isDark ? "#94A3B8" : "#64748B")}
            />
          </Svg>
        </Pressable>

        {/* Bathymetry Toggle Button */}
        <Pressable
          onPress={() => {
            setIsBathymetryEnabled(!isBathymetryEnabled);
            if (isBathymetryEnabled) {
              clearDepthPin();
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
            borderWidth: isBathymetryEnabled ? 2 : 1,
            borderColor: isBathymetryEnabled ? "#6C63FF" : (isDark ? "#334155" : "#E2E8F0"),
          }}
        >
          <Fish size={22} color={isBathymetryEnabled ? "#6C63FF" : (isDark ? "#94A3B8" : "#64748B")} weight={isBathymetryEnabled ? "fill" : "regular"} />
        </Pressable>

        {/* Map Type Toggle Button - Icon Only */}
        <Pressable
          onPress={() => {
            setMapType(mapType === "standard" ? "satellite" : "standard");
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
            borderWidth: mapType === "satellite" ? 2 : 1,
            borderColor: mapType === "satellite" ? "#6C63FF" : (isDark ? "#334155" : "#E2E8F0"),
          }}
        >
          <Globe size={22} color={mapType === "satellite" ? "#6C63FF" : (isDark ? "#94A3B8" : "#64748B")} weight={mapType === "satellite" ? "fill" : "regular"} />
        </Pressable>

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
            borderWidth: showFilterPanel ? 2 : 1,
            borderColor: showFilterPanel ? "#6C63FF" : (isDark ? "#334155" : "#E2E8F0"),
          }}
        >
          <Sliders size={22} color={showFilterPanel ? "#6C63FF" : (isDark ? "#94A3B8" : "#64748B")} weight={showFilterPanel ? "fill" : "regular"} />
        </Pressable>

        {/* Theme Toggle Button */}
        <Pressable
          onPress={async () => {
            await toggleTheme();
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
            borderWidth: 1,
            borderColor: isDark ? "#334155" : "#E2E8F0",
          }}
        >
          {isDark ? (
            <Sun size={20} color="#FFD700" weight="fill" />
          ) : (
            <Moon size={20} color="#6C63FF" weight="fill" />
          )}
        </Pressable>
      </View>

      {/* Professional Filter Panel */}
      <FilterPanel
        isVisible={showFilterPanel}
        onClose={() => {
          setShowFilterPanel(false);
          // Pending değişiklikleri iptal et
          setPendingRadius(radius);
          setPendingCategories(selectedCategories);
          setPendingCollections(selectedCollections);
        }}
        pendingRadius={pendingRadius}
        setPendingRadius={setPendingRadius}
        pendingRadiusEnabled={pendingRadiusEnabled}
        setPendingRadiusEnabled={setPendingRadiusEnabled}
        pendingCategories={pendingCategories}
        setPendingCategories={setPendingCategories}
        pendingCollections={pendingCollections}
        setPendingCollections={setPendingCollections}
        onApplyFilters={() => {
          setRadius(pendingRadius);
          setIsRadiusEnabled(pendingRadiusEnabled);
          setSelectedCategories(pendingCategories);
          setSelectedCollections(pendingCollections);
          setShowFilterPanel(false);
        }}
        onResetFilters={() => {
          setPendingRadius(5);
          setPendingRadiusEnabled(true);
          setPendingCategories([]);
          setPendingCollections([]);
          setRadius(5);
          setIsRadiusEnabled(true);
          setSelectedCategories([]);
          setSelectedCollections([]);
        }}
        previewCount={previewFilteredCount}
        isDark={isDark}
      />

      {/* Bottom Place Card */}
      <PlaceBottomSheet
        place={selectedPlace}
        isVisible={!!selectedPlace}
        collections={selectedPlace ? (placeCollectionsMap[selectedPlace.id] || []) : []}
        onAddToCollection={() => setShowAddToCollection(true)}
      />

      {/* Weather Widgets */}
      <WeatherWidgets
        isWeatherSelectionMode={isWeatherSelectionMode}
        setIsWeatherSelectionMode={setIsWeatherSelectionMode}
        showWeatherModal={showWeatherModal}
        setShowWeatherModal={setShowWeatherModal}
        selectedWeatherLocation={selectedWeatherLocation}
        setSelectedWeatherLocation={setSelectedWeatherLocation}
        selectedWeatherData={selectedWeatherData}
        setSelectedWeatherData={setSelectedWeatherData}
        weatherModalLoading={weatherModalLoading}
        setWeatherModalLoading={setWeatherModalLoading}
        weather={weather}
        forecastList={forecastList}
        isDark={isDark}
        insets={insets}
      />

      {/* Add to Collection Modal */}
      {selectedPlace && (
        <AddToCollectionModal
          visible={showAddToCollection}
          placeId={selectedPlace.id}
          onClose={() => setShowAddToCollection(false)}
        />
      )}

    </View>
  );
}
