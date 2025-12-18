/**
 * Optional hook for bathymetry (marine depth) features on the map.
 * This is a secondary/contextual feature for city guide app.
 * Only activates when user taps on water (negative depth).
 */

import { useState, useCallback } from "react";
import { router } from "expo-router";
import { getDepth } from "@/services/bathymetry-service";
import { logDebug } from "@/lib/logger";
interface UseMapBathymetryResult {
  depthPin: { lat: number; lon: number } | null;
  handleMapTap: (latitude: number, longitude: number) => Promise<void>;
  clearDepthPin: () => void;
}

/**
 * Optional bathymetry hook for marine features.
 * Only queries depth when user taps on map - if it's water (depth < 0),
 * opens bathymetry detail page. Otherwise does nothing (city guide behavior).
 */
export function useMapBathymetry(): UseMapBathymetryResult {
  const [depthPin, setDepthPin] = useState<{ lat: number; lon: number } | null>(null);

  const handleMapTap = useCallback(
    async (latitude: number, longitude: number) => {
      logDebug("[MapBathymetry] Tap detected:", { latitude, longitude });

      try {
        const depthResponse = await getDepth(latitude, longitude);

        // Only open detail page if depth is negative (water)
        // depth_m < 0 means water, depth_m >= 0 means land
        if (depthResponse.depth_m !== null && depthResponse.depth_m < 0) {
          // Set pin and navigate to detail page
          setDepthPin({ lat: latitude, lon: longitude });
          router.push({
            pathname: "/(places)/bathymetry",
            params: {
              lat: latitude.toString(),
              lon: longitude.toString(),
            },
          });
        } else {
          // Land or positive elevation or null - do nothing (city guide default)
          logDebug(
            "[MapBathymetry] Land detected (depth >= 0 or null), not opening depth widget"
          );
          setDepthPin(null);
        }
      } catch (error) {
        // If depth query failed, don't open widget (safer default - assume land)
        logDebug("[MapBathymetry] Depth query failed, not opening widget:", error);
        setDepthPin(null);
      }
    },
    []
  );

  const clearDepthPin = useCallback(() => {
    setDepthPin(null);
  }, []);

  return {
    depthPin,
    handleMapTap,
    clearDepthPin,
  };
}

