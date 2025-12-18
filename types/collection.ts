import { Place } from "./place";

export interface Collection {
  id: string;
  userId: string;
  name: string;
  emoji?: string; // Emoji icon (e.g., "🍕", "🏖️")
  description?: string;
  placeIds: string[]; // Ordered list of place IDs
  places?: Place[]; // Populated places (optional, fetched separately)
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | Date;
  updatedAt?: {
    seconds: number;
    nanoseconds: number;
  } | Date;
  isPublic?: boolean; // For sharing
  shareId?: string; // Unique ID for sharing link
}

export interface CollectionInput {
  userId: string;
  name: string;
  emoji?: string;
  description?: string;
  placeIds?: string[];
  isPublic?: boolean;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  placeId: string;
  place?: Place; // Populated place (optional)
  order: number; // For sorting/reordering
  notes?: string; // User notes about this place in collection
  addedAt: {
    seconds: number;
    nanoseconds: number;
  } | Date;
}

export interface CollectionItemInput {
  collectionId: string;
  placeId: string;
  order: number;
  notes?: string;
}

// Popular emoji icons for collections (inspired by Google Maps)
export const COLLECTION_EMOJIS = [
  "⭐", "❤️", "🔥", "💯", "🎯",
  "🍕", "🍔", "🍜", "🍰", "☕",
  "🏖️", "🏔️", "🌊", "🌴", "⛰️",
  "🎨", "🎭", "🎪", "🎬", "🎵",
  "🏛️", "🏰", "🕌", "⛪", "🕍",
  "🛍️", "🛒", "💼", "🏋️", "🧘",
  "🚗", "✈️", "🚢", "🚂", "🚲",
] as const;

export type CollectionEmoji = typeof COLLECTION_EMOJIS[number];

