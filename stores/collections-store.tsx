import { create } from "zustand";
import { Collection } from "@/types/collection";
import {
  getUserCollections,
  getCollectionById,
  getCollectionWithPlaces,
  createCollection,
  updateCollection,
  deleteCollection,
  addPlaceToCollection,
  removePlaceFromCollection,
  reorderCollectionPlaces,
  getCollectionsContainingPlace,
} from "@/services/collections-service";
import { logError } from "@/lib/logger";
import { User } from "firebase/auth";

interface CollectionsStore {
  collections: Collection[];
  selectedCollection: Collection | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCollections: (userId: string) => Promise<void>;
  fetchCollection: (collectionId: string) => Promise<void>;
  fetchCollectionWithPlaces: (collectionId: string) => Promise<Collection & { places: any[] } | null>;
  createNewCollection: (collectionData: {
    userId: string;
    name: string;
    emoji?: string;
    description?: string;
  }) => Promise<string | null>;
  updateCollectionData: (collectionId: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollectionById: (collectionId: string) => Promise<void>;
  addPlace: (collectionId: string, placeId: string) => Promise<void>;
  removePlace: (collectionId: string, placeId: string) => Promise<void>;
  reorderPlaces: (collectionId: string, placeIds: string[]) => Promise<void>;
  getCollectionsForPlace: (userId: string, placeId: string) => Promise<Collection[]>;
  setSelectedCollection: (collection: Collection | null) => void;
  clearError: () => void;
}

export const useCollectionsStore = create<CollectionsStore>((set, get) => ({
  collections: [],
  selectedCollection: null,
  loading: false,
  error: null,

  fetchCollections: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const collections = await getUserCollections(userId);
      set({ collections, loading: false });
    } catch (error: any) {
      logError("[CollectionsStore] Error fetching collections:", error);
      set({ 
        error: error?.message || "Failed to load collections",
        loading: false 
      });
    }
  },

  fetchCollection: async (collectionId: string) => {
    set({ loading: true, error: null });
    try {
      const collection = await getCollectionById(collectionId);
      if (collection) {
        set({ selectedCollection: collection, loading: false });
      } else {
        set({ error: "Collection not found", loading: false });
      }
    } catch (error: any) {
      logError("[CollectionsStore] Error fetching collection:", error);
      set({ 
        error: error?.message || "Failed to load collection",
        loading: false 
      });
    }
  },

  fetchCollectionWithPlaces: async (collectionId: string) => {
    set({ loading: true, error: null });
    try {
      const collection = await getCollectionWithPlaces(collectionId);
      if (collection) {
        set({ selectedCollection: collection, loading: false });
        return collection;
      }
      set({ error: "Collection not found", loading: false });
      return null;
    } catch (error: any) {
      logError("[CollectionsStore] Error fetching collection with places:", error);
      set({ 
        error: error?.message || "Failed to load collection",
        loading: false 
      });
      return null;
    }
  },

  createNewCollection: async (collectionData) => {
    set({ loading: true, error: null });
    try {
      const collectionId = await createCollection(collectionData);
      // Refresh collections list
      await get().fetchCollections(collectionData.userId);
      set({ loading: false });
      return collectionId;
    } catch (error: any) {
      logError("[CollectionsStore] Error creating collection:", error);
      set({ 
        error: error?.message || "Failed to create collection",
        loading: false 
      });
      return null;
    }
  },

  updateCollectionData: async (collectionId: string, updates: Partial<Collection>) => {
    set({ loading: true, error: null });
    try {
      await updateCollection(collectionId, updates);
      // Refresh collections list
      const currentCollection = get().selectedCollection;
      if (currentCollection?.id === collectionId) {
        await get().fetchCollection(collectionId);
      }
      await get().fetchCollections(updates.userId || currentCollection?.userId || "");
      set({ loading: false });
    } catch (error: any) {
      logError("[CollectionsStore] Error updating collection:", error);
      set({ 
        error: error?.message || "Failed to update collection",
        loading: false 
      });
    }
  },

  deleteCollectionById: async (collectionId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteCollection(collectionId);
      // Remove from local state
      const collections = get().collections.filter(c => c.id !== collectionId);
      set({ 
        collections,
        selectedCollection: get().selectedCollection?.id === collectionId ? null : get().selectedCollection,
        loading: false 
      });
    } catch (error: any) {
      logError("[CollectionsStore] Error deleting collection:", error);
      set({ 
        error: error?.message || "Failed to delete collection",
        loading: false 
      });
    }
  },

  addPlace: async (collectionId: string, placeId: string) => {
    set({ loading: true, error: null });
    try {
      await addPlaceToCollection(collectionId, placeId);
      // Refresh collection
      await get().fetchCollectionWithPlaces(collectionId);
      set({ loading: false });
    } catch (error: any) {
      logError("[CollectionsStore] Error adding place to collection:", error);
      set({ 
        error: error?.message || "Failed to add place",
        loading: false 
      });
    }
  },

  removePlace: async (collectionId: string, placeId: string) => {
    set({ loading: true, error: null });
    try {
      await removePlaceFromCollection(collectionId, placeId);
      // Refresh collection
      await get().fetchCollectionWithPlaces(collectionId);
      set({ loading: false });
    } catch (error: any) {
      logError("[CollectionsStore] Error removing place from collection:", error);
      set({ 
        error: error?.message || "Failed to remove place",
        loading: false 
      });
    }
  },

  reorderPlaces: async (collectionId: string, placeIds: string[]) => {
    set({ loading: true, error: null });
    try {
      await reorderCollectionPlaces(collectionId, placeIds);
      // Refresh collection
      await get().fetchCollectionWithPlaces(collectionId);
      set({ loading: false });
    } catch (error: any) {
      logError("[CollectionsStore] Error reordering places:", error);
      set({ 
        error: error?.message || "Failed to reorder places",
        loading: false 
      });
    }
  },

  getCollectionsForPlace: async (userId: string, placeId: string) => {
    try {
      const collections = await getCollectionsContainingPlace(userId, placeId);
      return collections;
    } catch (error: any) {
      logError("[CollectionsStore] Error getting collections for place:", error);
      return [];
    }
  },

  setSelectedCollection: (collection: Collection | null) => {
    set({ selectedCollection: collection });
  },

  clearError: () => {
    set({ error: null });
  },
}));

