/**
 * Hook for managing user location tracking on the map.
 * Handles permissions, location updates, and subscription cleanup.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";

interface UseMapLocationResult {
  location: Location.LocationObject | null;
  loading: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

export function useMapLocation(errorMessage?: string): UseMapLocationResult {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setError(errorMessage || "Location permission required");
        setLoading(false);
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(locationResult);

      // Clean up existing subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      // Start watching position
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
      setError(null);
    } catch (err) {
      console.error("Error getting location:", err);
      setError(errorMessage || "Location error");
      setLoading(false);
    }
  }, [errorMessage]);

  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }, []);

  // Start tracking when screen is focused
  useFocusEffect(
    useCallback(() => {
      startTracking();

      return () => {
        stopTracking();
      };
    }, [startTracking, stopTracking])
  );

  return {
    location,
    loading,
    error,
    startTracking,
    stopTracking,
  };
}

