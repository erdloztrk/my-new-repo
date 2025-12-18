import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "@/lib/logger";

interface FavoritesState {
  favorites: string[]; // Array of place IDs
  addFavorite: (placeId: string) => Promise<void>;
  removeFavorite: (placeId: string) => Promise<void>;
  isFavorite: (placeId: string) => boolean;
  loadFavorites: () => Promise<void>;
}

const FAVORITES_STORAGE_KEY = "@lokal_favorites";

export const useFavorites = create<FavoritesState>((set, get) => ({
  favorites: [],

  loadFavorites: async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const favorites = JSON.parse(stored);
        set({ favorites });
      }
    } catch (error) {
      logError("[FavoritesStore] Error loading favorites:", error);
    }
  },

  addFavorite: async (placeId: string) => {
    const currentFavorites = get().favorites;
    if (currentFavorites.includes(placeId)) {
      return; // Already favorited
    }

    const newFavorites = [...currentFavorites, placeId];
    set({ favorites: newFavorites });

    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      logError("[FavoritesStore] Error saving favorite:", error);
      // Revert on error
      set({ favorites: currentFavorites });
    }
  },

  removeFavorite: async (placeId: string) => {
    const currentFavorites = get().favorites;
    const newFavorites = currentFavorites.filter((id) => id !== placeId);
    set({ favorites: newFavorites });

    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      logError("[FavoritesStore] Error removing favorite:", error);
      // Revert on error
      set({ favorites: currentFavorites });
    }
  },

  isFavorite: (placeId: string) => {
    return get().favorites.includes(placeId);
  },
}));

