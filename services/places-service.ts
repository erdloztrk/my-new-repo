import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  GeoPoint,
  QuerySnapshot,
  DocumentData,
  documentId,
} from "firebase/firestore";
import { db } from "./firebase";
import { Place, PlaceInput } from "@/types/place";
import { Category } from "@/types/category";
import { logDebug, logError } from "@/lib/logger";
import { encodeGeohash } from "@/utils/geohash";

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date();
};

// Convert Firestore GeoPoint to coordinates object
const convertCoordinates = (coords: any): { latitude: number; longitude: number } => {
  // Handle GeoPoint instance
  if (coords instanceof GeoPoint) {
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  }
  // Handle object with latitude/longitude properties
  if (coords?.latitude && coords?.longitude) {
    return {
      latitude: typeof coords.latitude === 'number' ? coords.latitude : parseFloat(coords.latitude),
      longitude: typeof coords.longitude === 'number' ? coords.longitude : parseFloat(coords.longitude),
    };
  }
  // Handle string format like "[40.3590463° N, 26.6923409° E]"
  if (typeof coords === 'string' || (Array.isArray(coords) && coords.length === 2)) {
    let lat: number | null = null;
    let lng: number | null = null;
    
    if (typeof coords === 'string') {
      // Parse string format: "[40.3590463° N, 26.6923409° E]"
      const match = coords.match(/\[([\d.]+)°\s*[NS]?,\s*([\d.]+)°\s*[EW]?\]/i);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    } else if (Array.isArray(coords)) {
      // Handle array format: [lat, lng] or ["40.3590463° N", "26.6923409° E"]
      const latStr = String(coords[0]).replace(/[°\sNS]/gi, '');
      const lngStr = String(coords[1]).replace(/[°\sEW]/gi, '');
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);
    }
    
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }
  
  return { latitude: 0, longitude: 0 };
};

// Convert Firestore document to Place
const docToPlace = (doc: DocumentData): Place => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    category: data.category,
    description: data.description || "",
    address: data.address || "",
    coordinates: convertCoordinates(data.coordinates),
    geohash: data.geohash,
    images: data.images || [],
    rating: data.rating || 0,
    reviewCount: data.reviewCount || 0,
    createdAt: convertTimestamp(data.createdAt),
    createdBy: data.createdBy || "",
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
  };
};

// Get places by category
export async function getPlacesByCategory(category: Category): Promise<Place[]> {
  try {
    const placesRef = collection(db, "places");
    const q = query(
      placesRef,
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    logDebug(`[PlacesService] Found ${querySnapshot.docs.length} places for category: ${category}`);
    return querySnapshot.docs.map(docToPlace);
  } catch (error: any) {
    logError("[PlacesService] Error getting places by category:", error);
    // If index error, provide helpful message
    if (error?.code === "failed-precondition" || error?.message?.includes("index")) {
      logError("[PlacesService] Firebase index required! Create index for: places (category, createdAt)");
      logError("[PlacesService] Link:", error?.message?.match(/https:\/\/[^\s]+/)?.[0] || "Check Firebase Console");
    }
    throw error;
  }
}

// Get all places (without orderBy to avoid index requirement)
export async function getAllPlaces(): Promise<Place[]> {
  try {
    const placesRef = collection(db, "places");
    // Don't use orderBy to avoid index requirement - we'll sort in memory if needed
    const querySnapshot = await getDocs(placesRef);
    logDebug(`[PlacesService] Found ${querySnapshot.docs.length} total places in database`);
    // Debug: Log all places with their data (only in dev)
    if (__DEV__) {
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const coords = data.coordinates;
        logDebug(`  - ${doc.id}: ${data.name}`);
        logDebug(`    Category: ${data.category}`);
        if (coords instanceof GeoPoint) {
          logDebug(`    Coordinates: ${coords.latitude}, ${coords.longitude} (GeoPoint)`);
        } else if (coords?.latitude && coords?.longitude) {
          logDebug(`    Coordinates: ${coords.latitude}, ${coords.longitude} (Object)`);
        } else {
          logDebug(`    Coordinates: MISSING or INVALID`);
          logDebug(`    Raw coordinates data:`, coords);
        }
      });
    }
    const places = querySnapshot.docs.map(docToPlace);
    // Filter out places without valid coordinates
    const validPlaces = places.filter((place) => 
      place.coordinates.latitude !== 0 && place.coordinates.longitude !== 0
    );
    logDebug(`[PlacesService] Valid places with coordinates: ${validPlaces.length}`);
    return validPlaces;
  } catch (error) {
    logError("[PlacesService] Error getting all places:", error);
    throw error;
  }
}

// Get place by ID
export async function getPlaceById(id: string): Promise<Place | null> {
  try {
    const placeRef = doc(db, "places", id);
    const placeSnap = await getDoc(placeRef);
    
    if (placeSnap.exists()) {
      return docToPlace(placeSnap);
    }
    return null;
  } catch (error) {
    logError("[PlacesService] Error getting place by ID:", error);
    throw error;
  }
}

// Batch fetch places by IDs (optimized for >1 place)
// Firestore "in" query limit is 10, so we chunk for >10 IDs
export async function getPlacesByIds(ids: string[]): Promise<Place[]> {
  if (ids.length === 0) {
    return [];
  }

  if (ids.length === 1) {
    // Single ID - use getPlaceById
    const place = await getPlaceById(ids[0]);
    return place ? [place] : [];
  }

  try {
    const placesRef = collection(db, "places");
    const CHUNK_SIZE = 10; // Firestore "in" query limit
    const chunks: string[][] = [];
    
    // Split into chunks of 10
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      chunks.push(ids.slice(i, i + CHUNK_SIZE));
    }

    // Fetch all chunks in parallel
    const chunkPromises = chunks.map(async (chunk) => {
      const q = query(placesRef, where(documentId(), "in", chunk));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docToPlace);
    });

    const chunkResults = await Promise.all(chunkPromises);
    const allPlaces = chunkResults.flat();

    // Preserve order based on input IDs (create a map for O(1) lookup)
    const placeMap = new Map(allPlaces.map((place) => [place.id, place]));
    const orderedPlaces = ids
      .map((id) => placeMap.get(id))
      .filter((place): place is Place => place !== undefined);

    return orderedPlaces;
  } catch (error) {
    logError("[PlacesService] Error batch fetching places:", error);
    throw error;
  }
}

// Add new place
export async function addPlace(placeData: PlaceInput): Promise<string> {
  try {
    const placesRef = collection(db, "places");
    
    // Auto-generate geohash if not provided
    const geohash = placeData.geohash || encodeGeohash(
      placeData.coordinates.latitude,
      placeData.coordinates.longitude
    );
    
    const docRef = await addDoc(placesRef, {
      ...placeData,
      geohash,
      rating: 0,
      reviewCount: 0,
      createdAt: Timestamp.now(),
    });
    
    logDebug(`[PlacesService] Added place: ${docRef.id} with geohash: ${geohash}`);
    return docRef.id;
  } catch (error) {
    logError("[PlacesService] Error adding place:", error);
    throw error;
  }
}

// Update place
export async function updatePlace(id: string, data: Partial<PlaceInput>): Promise<void> {
  try {
    const placeRef = doc(db, "places", id);
    await updateDoc(placeRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    logError("[PlacesService] Error updating place:", error);
    throw error;
  }
}

// Delete place
export async function deletePlace(id: string): Promise<void> {
  try {
    const placeRef = doc(db, "places", id);
    await deleteDoc(placeRef);
  } catch (error) {
    logError("[PlacesService] Error deleting place:", error);
    throw error;
  }
}

// Update place rating (called after review changes)
export async function updatePlaceRating(placeId: string, newRating: number, reviewCount: number): Promise<void> {
  try {
    const placeRef = doc(db, "places", placeId);
    await updateDoc(placeRef, {
      rating: newRating,
      reviewCount: reviewCount,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    logError("[PlacesService] Error updating place rating:", error);
    throw error;
  }
}

