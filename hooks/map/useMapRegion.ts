/**
 * Hook for managing map region and follow-me behavior.
 * Handles initial region setup, follow-me mode, and user interaction tracking.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Region } from "react-native-maps";
import * as Location from "expo-location";
import { Place } from "@/types/place";

interface UseMapRegionOptions {
  location: Location.LocationObject | null;
  places: Place[];
  followMe: boolean;
  onUserInteractionChange?: (isInteracting: boolean) => void;
}

interface UseMapRegionResult {
  region: Region | null;
  setRegion: (region: Region | null) => void;
  userIsInteracting: React.MutableRefObject<boolean>;
  handleMapInteractionStart: () => void;
  handleMapInteractionEnd: () => void;
}

export function useMapRegion({
  location,
  places,
  followMe,
  onUserInteractionChange,
}: UseMapRegionOptions): UseMapRegionResult {
  const [region, setRegion] = useState<Region | null>(null);
  const initialRegionSet = useRef(false);
  const userIsInteracting = useRef(false);

  const handleMapInteractionStart = useCallback(() => {
    userIsInteracting.current = true;
    onUserInteractionChange?.(true);
  }, [onUserInteractionChange]);

  const handleMapInteractionEnd = useCallback(() => {
    userIsInteracting.current = false;
    onUserInteractionChange?.(false);
  }, [onUserInteractionChange]);

  // Calculate region that fits all places and user location
  const calculateRegionForPlaces = useCallback((): Region | null => {
    if (!location || places.length === 0) return null;

    const allLatitudes = [
      location.coords.latitude,
      ...places.map((p) => p.coordinates.latitude),
    ];
    const allLongitudes = [
      location.coords.longitude,
      ...places.map((p) => p.coordinates.longitude),
    ];

    const minLat = Math.min(...allLatitudes);
    const maxLat = Math.max(...allLatitudes);
    const minLng = Math.min(...allLongitudes);
    const maxLng = Math.max(...allLongitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDelta = Math.max(maxLat - minLat, 0.01) * 1.5;
    const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [location, places]);

  // Set initial region or update when followMe is active
  useEffect(() => {
    // Don't update region if user is manually panning/zooming
    if (userIsInteracting.current) {
      return;
    }

    if (places.length > 0 && location && followMe) {
      const calculatedRegion = calculateRegionForPlaces();
      if (calculatedRegion) {
        setRegion(calculatedRegion);
        initialRegionSet.current = true;
      }
    } else if (location && !initialRegionSet.current) {
      // Set initial region only once
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      initialRegionSet.current = true;
    } else if (
      location &&
      followMe &&
      !userIsInteracting.current &&
      initialRegionSet.current
    ) {
      // Update region when location changes and followMe is active
      // Use current region's deltas to maintain zoom level
      setRegion((prevRegion) => ({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: prevRegion?.latitudeDelta || 0.01,
        longitudeDelta: prevRegion?.longitudeDelta || 0.01,
      }));
    }
  }, [places, location, followMe, calculateRegionForPlaces]);

  return {
    region,
    setRegion,
    userIsInteracting,
    handleMapInteractionStart,
    handleMapInteractionEnd,
  };
}

