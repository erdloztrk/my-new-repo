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
  QuerySnapshot,
  DocumentData,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { Collection, CollectionInput, CollectionItem, CollectionItemInput } from "@/types/collection";
import { Place } from "@/types/place";
import { getPlacesByIds } from "./places-service";
import { logDebug, logError } from "@/lib/logger";

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

// Convert Firestore document to Collection
const docToCollection = (doc: DocumentData): Collection => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    name: data.name,
    emoji: data.emoji,
    description: data.description,
    placeIds: data.placeIds || [],
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : undefined,
    isPublic: data.isPublic || false,
    shareId: data.shareId,
  };
};

// Convert Firestore document to CollectionItem
const docToCollectionItem = (doc: DocumentData): CollectionItem => {
  const data = doc.data();
  return {
    id: doc.id,
    collectionId: data.collectionId,
    placeId: data.placeId,
    order: data.order || 0,
    notes: data.notes,
    addedAt: convertTimestamp(data.addedAt),
  };
};

/**
 * Get all collections for a user
 */
export async function getUserCollections(userId: string): Promise<Collection[]> {
  try {
    const collectionsRef = collection(db, "collections");
    const q = query(
      collectionsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    logDebug(`[CollectionsService] Found ${querySnapshot.docs.length} collections for user: ${userId}`);
    return querySnapshot.docs.map(docToCollection);
  } catch (error: any) {
    logError("[CollectionsService] Error getting user collections:", error);
    if (error?.code === "failed-precondition") {
      logError("[CollectionsService] Firebase index required! Create index for: collections (userId, createdAt)");
    }
    throw error;
  }
}

/**
 * Get a single collection by ID
 */
export async function getCollectionById(collectionId: string): Promise<Collection | null> {
  try {
    const collectionRef = doc(db, "collections", collectionId);
    const collectionSnap = await getDoc(collectionRef);
    
    if (collectionSnap.exists()) {
      return docToCollection(collectionSnap);
    }
    return null;
  } catch (error) {
    logError("[CollectionsService] Error getting collection by ID:", error);
    throw error;
  }
}

/**
 * Get a public collection by shareId
 */
export async function getCollectionByShareId(shareId: string): Promise<Collection | null> {
  try {
    const collectionsRef = collection(db, "collections");
    const q = query(
      collectionsRef,
      where("shareId", "==", shareId),
      where("isPublic", "==", true)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.docs.length > 0) {
      return docToCollection(querySnapshot.docs[0]);
    }
    return null;
  } catch (error) {
    logError("[CollectionsService] Error getting collection by shareId:", error);
    throw error;
  }
}

/**
 * Get collection with populated places
 */
export async function getCollectionWithPlaces(collectionId: string): Promise<Collection & { places: Place[] } | null> {
  try {
    const collection = await getCollectionById(collectionId);
    if (!collection) return null;
    
    if (collection.placeIds.length === 0) {
      return { ...collection, places: [] };
    }
    
    const places = await getPlacesByIds(collection.placeIds);
    
    // Preserve order from placeIds array
    const placeMap = new Map(places.map(p => [p.id, p]));
    const orderedPlaces = collection.placeIds
      .map(id => placeMap.get(id))
      .filter((p): p is Place => p !== undefined);
    
    return { ...collection, places: orderedPlaces };
  } catch (error) {
    logError("[CollectionsService] Error getting collection with places:", error);
    throw error;
  }
}

/**
 * Create a new collection
 */
export async function createCollection(collectionData: CollectionInput): Promise<string> {
  try {
    const collectionsRef = collection(db, "collections");
    
    // Generate shareId if public
    const shareId = collectionData.isPublic 
      ? generateShareId() 
      : undefined;
    
    // Build document data - exclude undefined fields (Firestore doesn't accept undefined)
    const docData: any = {
      userId: collectionData.userId,
      name: collectionData.name,
      placeIds: collectionData.placeIds || [],
      createdAt: Timestamp.now(),
    };
    
    // Only add optional fields if they are defined (not undefined or empty string)
    if (collectionData.emoji && collectionData.emoji.trim()) {
      docData.emoji = collectionData.emoji.trim();
    }
    
    if (collectionData.description && collectionData.description.trim()) {
      docData.description = collectionData.description.trim();
    }
    
    if (collectionData.isPublic !== undefined) {
      docData.isPublic = collectionData.isPublic;
    }
    
    // Only add shareId if it's defined (not undefined)
    if (shareId !== undefined) {
      docData.shareId = shareId;
    }
    
    const docRef = await addDoc(collectionsRef, docData);
    
    logDebug(`[CollectionsService] Created collection: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logError("[CollectionsService] Error creating collection:", error);
    throw error;
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  collectionId: string,
  updates: Partial<CollectionInput>
): Promise<void> {
  try {
    const collectionRef = doc(db, "collections", collectionId);
    
    // Build update data - exclude undefined fields (Firestore doesn't accept undefined)
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    // Only include defined fields from updates (exclude undefined and empty strings for optional fields)
    Object.keys(updates).forEach((key) => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        // For optional string fields (emoji, description), skip empty strings
        if ((key === "emoji" || key === "description") && typeof value === "string" && !value.trim()) {
          return; // Skip empty strings
        }
        updateData[key] = value;
      }
    });
    
    // Generate new shareId if making public and doesn't have one
    if (updates.isPublic) {
      const currentDoc = await getDoc(collectionRef);
      if (currentDoc.exists() && !currentDoc.data().shareId) {
        updateData.shareId = generateShareId();
      }
    }
    
    await updateDoc(collectionRef, updateData);
    logDebug(`[CollectionsService] Updated collection: ${collectionId}`);
  } catch (error) {
    logError("[CollectionsService] Error updating collection:", error);
    throw error;
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(collectionId: string): Promise<void> {
  try {
    // Delete collection items first
    await deleteCollectionItems(collectionId);
    
    // Delete collection
    const collectionRef = doc(db, "collections", collectionId);
    await deleteDoc(collectionRef);
    
    logDebug(`[CollectionsService] Deleted collection: ${collectionId}`);
  } catch (error) {
    logError("[CollectionsService] Error deleting collection:", error);
    throw error;
  }
}

/**
 * Add a place to a collection
 */
export async function addPlaceToCollection(
  collectionId: string,
  placeId: string,
  order?: number
): Promise<void> {
  try {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }
    
    // Check if place already in collection
    if (collection.placeIds.includes(placeId)) {
      logDebug(`[CollectionsService] Place ${placeId} already in collection ${collectionId}`);
      return;
    }
    
    // Add to placeIds array
    const newPlaceIds = [...collection.placeIds, placeId];
    const newOrder = order !== undefined ? order : newPlaceIds.length - 1;
    
    await updateDoc(doc(db, "collections", collectionId), {
      placeIds: newPlaceIds,
      updatedAt: Timestamp.now(),
    });
    
    logDebug(`[CollectionsService] Added place ${placeId} to collection ${collectionId}`);
  } catch (error) {
    logError("[CollectionsService] Error adding place to collection:", error);
    throw error;
  }
}

/**
 * Remove a place from a collection
 */
export async function removePlaceFromCollection(
  collectionId: string,
  placeId: string
): Promise<void> {
  try {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }
    
    const newPlaceIds = collection.placeIds.filter(id => id !== placeId);
    
    await updateDoc(doc(db, "collections", collectionId), {
      placeIds: newPlaceIds,
      updatedAt: Timestamp.now(),
    });
    
    logDebug(`[CollectionsService] Removed place ${placeId} from collection ${collectionId}`);
  } catch (error) {
    logError("[CollectionsService] Error removing place from collection:", error);
    throw error;
  }
}

/**
 * Reorder places in a collection
 */
export async function reorderCollectionPlaces(
  collectionId: string,
  placeIds: string[]
): Promise<void> {
  try {
    await updateDoc(doc(db, "collections", collectionId), {
      placeIds: placeIds,
      updatedAt: Timestamp.now(),
    });
    
    logDebug(`[CollectionsService] Reordered places in collection ${collectionId}`);
  } catch (error) {
    logError("[CollectionsService] Error reordering collection places:", error);
    throw error;
  }
}

/**
 * Delete all items in a collection (helper for deleteCollection)
 */
async function deleteCollectionItems(collectionId: string): Promise<void> {
  try {
    const itemsRef = collection(db, "collections", collectionId, "items");
    const itemsSnapshot = await getDocs(itemsRef);
    
    const batch = writeBatch(db);
    itemsSnapshot.docs.forEach((itemDoc) => {
      batch.delete(itemDoc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    logError("[CollectionsService] Error deleting collection items:", error);
    // Don't throw - items might not exist
  }
}

/**
 * Generate a unique share ID for public collections
 */
function generateShareId(): string {
  // Generate a random 8-character alphanumeric ID
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get collections that contain a specific place
 */
export async function getCollectionsContainingPlace(
  userId: string,
  placeId: string
): Promise<Collection[]> {
  try {
    const collections = await getUserCollections(userId);
    return collections.filter(c => c.placeIds.includes(placeId));
  } catch (error) {
    logError("[CollectionsService] Error getting collections containing place:", error);
    throw error;
  }
}

