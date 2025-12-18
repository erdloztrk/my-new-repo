/**
 * ViewModel hook for Home screen.
 * Handles location, weather data fetching, and refresh logic.
 */

import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { getWeather } from "@/components/weather/weatherAPI";
import type { CurrentWeather } from "@/components/weather/weatherTypes";

interface UseHomeViewModelResult {
  // State
  weather: CurrentWeather | null;
  weatherLoading: boolean;
  cityName: string | undefined;
  location: Location.LocationObject | null;
  refreshing: boolean;

  // Actions
  loadWeather: () => Promise<void>;
  onRefresh: () => void;
}

export function useHomeViewModel(): UseHomeViewModelResult {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [cityName, setCityName] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWeather();
  }, [loadWeather]);

  return {
    weather,
    weatherLoading,
    cityName,
    location,
    refreshing,
    loadWeather,
    onRefresh,
  };
}

