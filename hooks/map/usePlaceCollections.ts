import { useEffect, useState, useMemo, useRef } from "react";
import { Place } from "@/types/place";
import { Collection } from "@/types/collection";
import { getCollectionsContainingPlace } from "@/services/collections-service";
import { getCurrentUser } from "@/services/auth-service";
import { logError } from "@/lib/logger";

interface PlaceCollectionsMap {
  [placeId: string]: Collection[];
}

/**
 * Hook to fetch collections for multiple places
 * Batches requests and caches results
 * Only fetches collections for new places (not already in cache)
 */
export function usePlaceCollections(places: Place[]): PlaceCollectionsMap {
  const [placeCollectionsMap, setPlaceCollectionsMap] = useState<PlaceCollectionsMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const cachedPlaceIdsRef = useRef<Set<string>>(new Set());

  const placeIds = useMemo(() => places.map(p => p.id), [places]);

  useEffect(() => {
    const fetchCollections = async () => {
      const user = getCurrentUser();
      if (!user || placeIds.length === 0) {
        setPlaceCollectionsMap({});
        cachedPlaceIdsRef.current.clear();
        return;
      }

      // Only fetch collections for places we don't have cached
      const newPlaceIds = placeIds.filter(id => !cachedPlaceIdsRef.current.has(id));
      
      if (newPlaceIds.length === 0) {
        // All places are already cached, no need to fetch
        return;
      }

      setIsLoading(true);
      const newMap: PlaceCollectionsMap = { ...placeCollectionsMap };

      try {
        // Batch fetch collections only for new places
        const promises = newPlaceIds.map(async (placeId) => {
          try {
            const collections = await getCollectionsContainingPlace(user.uid, placeId);
            return { placeId, collections };
          } catch (error) {
            logError(`[usePlaceCollections] Error fetching collections for place ${placeId}:`, error);
            return { placeId, collections: [] };
          }
        });

        const results = await Promise.all(promises);
        results.forEach(({ placeId, collections }) => {
          newMap[placeId] = collections;
          cachedPlaceIdsRef.current.add(placeId);
        });

        setPlaceCollectionsMap(newMap);
      } catch (error) {
        logError("[usePlaceCollections] Error fetching place collections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, [placeIds.join(",")]); // Re-fetch when place IDs change

  // Clean up cache when places list becomes empty or changes significantly
  useEffect(() => {
    const currentPlaceIdsSet = new Set(placeIds);
    // Remove cached entries for places that are no longer in the list
    cachedPlaceIdsRef.current.forEach((cachedId) => {
      if (!currentPlaceIdsSet.has(cachedId)) {
        cachedPlaceIdsRef.current.delete(cachedId);
      }
    });
  }, [placeIds.join(",")]);

  return placeCollectionsMap;
}

