/**
 * Hook for managing places data on the map.
 * Handles loading, filtering by radius and categories.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { getAllPlaces } from "@/services/places-service";
import { Place } from "@/types/place";
import { Category } from "@/types/category";
import * as Location from "expo-location";
import { calculateDistance } from "@/utils/mapHelpers";

interface UseMapPlacesOptions {
  location: Location.LocationObject | null;
  radius: number; // km
  selectedCategories: Category[];
}

interface UseMapPlacesResult {
  places: Place[];
  filteredPlaces: Place[];
  loading: boolean;
  loadPlaces: () => Promise<void>;
  getPreviewCount: (pendingRadius: number, pendingCategories: Category[]) => number;
}

export function useMapPlaces({
  location,
  radius,
  selectedCategories,
}: UseMapPlacesOptions): UseMapPlacesResult {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const loadPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const placesData = await getAllPlaces();
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setPlaces(placesData);
      }
    } catch (error) {
      console.error("Error loading places for map:", error);
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Cleanup: mark component as unmounted
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Filter places by radius and categories
  const filteredPlaces = useMemo(() => {
    if (!location) return [];

    return places.filter((place) => {
      if (!place.coordinates) return false;

      // Category filter: empty array means show all places (no category filter)
      if (selectedCategories.length > 0 && !selectedCategories.includes(place.category)) {
        return false;
      }

      // Radius filter
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        place.coordinates.latitude,
        place.coordinates.longitude
      );
      return distance <= radius;
    });
  }, [places, location, radius, selectedCategories]);

  // Get preview count for pending filters
  const getPreviewCount = useCallback(
    (pendingRadius: number, pendingCategories: Category[]): number => {
      if (!location) return 0;

      return places.filter((place) => {
        if (!place.coordinates) return false;

        // Category filter: empty array means show all places (no category filter)
        if (pendingCategories.length > 0 && !pendingCategories.includes(place.category)) {
          return false;
        }

        // Radius filter
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          place.coordinates.latitude,
          place.coordinates.longitude
        );
        return distance <= pendingRadius;
      }).length;
    },
    [places, location]
  );

  // Load places on mount
  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  return {
    places,
    filteredPlaces,
    loading,
    loadPlaces,
    getPreviewCount,
  };
}

