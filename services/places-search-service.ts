import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import { Place } from "@/types/place";
import { Category } from "@/types/category";
import { logDebug, logError } from "@/lib/logger";
import { encodeGeohash, getNeighbors, getPrecisionForRadius, calculateDistance } from "@/utils/geohash";

/**
 * Search places by name (case-insensitive prefix match)
 * @param searchTerm Search term
 * @param maxResults Maximum number of results (default: 50)
 * @returns Array of matching places
 */
export async function searchPlacesByName(
  searchTerm: string,
  maxResults: number = 50
): Promise<Place[]> {
  try {
    if (!searchTerm.trim()) {
      return [];
    }

    const placesRef = collection(db, "places");
    const normalizedSearch = searchTerm.trim().toLowerCase();
    
    // Firestore doesn't support case-insensitive search natively
    // We'll fetch all places and filter client-side for now
    // TODO: Use Algolia or similar for better search performance
    
    const q = query(
      placesRef,
      orderBy("name"),
      limit(200) // Fetch more than needed, filter client-side
    );
    
    const querySnapshot = await getDocs(q);
    const places: Place[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const place = docToPlace(doc);
      
      // Case-insensitive prefix match
      if (place.name.toLowerCase().startsWith(normalizedSearch)) {
        places.push(place);
      }
    });
    
    // Sort by name and limit results
    places.sort((a, b) => a.name.localeCompare(b.name));
    
    logDebug(`[PlacesSearchService] Found ${places.length} places matching "${searchTerm}"`);
    return places.slice(0, maxResults);
  } catch (error) {
    logError("[PlacesSearchService] Error searching places by name:", error);
    throw error;
  }
}

/**
 * Search places near a location using geohash
 * @param lat Latitude
 * @param lon Longitude
 * @param radiusKm Radius in kilometers (default: 5)
 * @param category Optional category filter
 * @param maxResults Maximum number of results (default: 50)
 * @returns Array of places sorted by distance
 */
export async function searchPlacesNearby(
  lat: number,
  lon: number,
  radiusKm: number = 5,
  category?: Category,
  maxResults: number = 50
): Promise<Place[]> {
  try {
    const placesRef = collection(db, "places");
    const precision = getPrecisionForRadius(radiusKm);
    const centerGeohash = encodeGeohash(lat, lon, precision);
    const neighbors = getNeighbors(centerGeohash);
    
    // Query all geohash neighbors
    const queries = neighbors.map((geohash) => {
      const constraints: QueryConstraint[] = [
        where("geohash", ">=", geohash),
        where("geohash", "<=", geohash + "\uf8ff"), // Prefix match
      ];
      
      if (category) {
        constraints.push(where("category", "==", category));
      }
      
      return query(placesRef, ...constraints, limit(100));
    });
    
    // Execute all queries in parallel
    const results = await Promise.all(queries.map((q) => getDocs(q)));
    
    // Collect unique places
    const placeMap = new Map<string, Place>();
    
    results.forEach((snapshot) => {
      snapshot.forEach((doc) => {
        const place = docToPlace(doc);
        if (!placeMap.has(place.id)) {
          placeMap.set(place.id, place);
        }
      });
    });
    
    // Filter by actual distance and sort
    const places = Array.from(placeMap.values())
      .filter((place) => {
        if (!place.coordinates) return false;
        const distance = calculateDistance(
          lat,
          lon,
          place.coordinates.latitude,
          place.coordinates.longitude
        );
        return distance <= radiusKm;
      })
      .map((place) => {
        const distance = calculateDistance(
          lat,
          lon,
          place.coordinates.latitude,
          place.coordinates.longitude
        );
        return { place, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults)
      .map((item) => item.place);
    
    logDebug(`[PlacesSearchService] Found ${places.length} places within ${radiusKm}km`);
    return places;
  } catch (error) {
    logError("[PlacesSearchService] Error searching places nearby:", error);
    throw error;
  }
}

/**
 * Search places by category
 * @param category Category to filter by
 * @param maxResults Maximum number of results (default: 50)
 * @returns Array of places
 */
export async function searchPlacesByCategory(
  category: Category,
  maxResults: number = 50
): Promise<Place[]> {
  try {
    const placesRef = collection(db, "places");
    const q = query(
      placesRef,
      where("category", "==", category),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
    
    const querySnapshot = await getDocs(q);
    const places: Place[] = [];
    
    querySnapshot.forEach((doc) => {
      places.push(docToPlace(doc));
    });
    
    logDebug(`[PlacesSearchService] Found ${places.length} places in category: ${category}`);
    return places;
  } catch (error) {
    logError("[PlacesSearchService] Error searching places by category:", error);
    throw error;
  }
}

/**
 * Combined search: name + location + category
 * @param searchTerm Search term (optional)
 * @param lat Latitude (optional)
 * @param lon Longitude (optional)
 * @param radiusKm Radius in kilometers (optional, default: 5)
 * @param category Category filter (optional)
 * @param maxResults Maximum number of results (default: 50)
 * @returns Array of matching places
 */
export async function searchPlaces(
  options: {
    searchTerm?: string;
    lat?: number;
    lon?: number;
    radiusKm?: number;
    category?: Category;
    maxResults?: number;
  }
): Promise<Place[]> {
  const {
    searchTerm,
    lat,
    lon,
    radiusKm = 5,
    category,
    maxResults = 50,
  } = options;
  
  try {
    let places: Place[] = [];
    
    // If location provided, search nearby first
    if (lat !== undefined && lon !== undefined) {
      places = await searchPlacesNearby(lat, lon, radiusKm, category, maxResults * 2);
    } else if (category) {
      // If category but no location, search by category
      places = await searchPlacesByCategory(category, maxResults * 2);
    } else {
      // Otherwise, fetch all (limited)
      const placesRef = collection(db, "places");
      const q = query(placesRef, orderBy("createdAt", "desc"), limit(maxResults * 2));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        places.push(docToPlace(doc));
      });
    }
    
    // Filter by search term if provided
    if (searchTerm && searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      places = places.filter((place) =>
        place.name.toLowerCase().includes(normalizedSearch) ||
        place.description.toLowerCase().includes(normalizedSearch) ||
        place.address.toLowerCase().includes(normalizedSearch)
      );
    }
    
    // Limit results
    return places.slice(0, maxResults);
  } catch (error) {
    logError("[PlacesSearchService] Error in combined search:", error);
    throw error;
  }
}

// Helper function to convert Firestore document to Place
function docToPlace(doc: any): Place {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    category: data.category,
    description: data.description,
    address: data.address,
    coordinates: {
      latitude: data.coordinates.latitude,
      longitude: data.coordinates.longitude,
    },
    geohash: data.geohash,
    images: data.images || [],
    rating: data.rating || 0,
    reviewCount: data.reviewCount || 0,
    createdAt: data.createdAt,
    createdBy: data.createdBy,
    updatedAt: data.updatedAt,
  };
}

