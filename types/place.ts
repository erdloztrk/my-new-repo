import { Category } from "./category";

export interface Place {
  id: string;
  name: string;
  category: Category;
  description: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  geohash?: string; // Geohash for efficient geospatial queries
  images: string[]; // URLs or local paths
  rating: number; // Average rating (0-5)
  reviewCount: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | Date;
  createdBy: string; // User ID
  updatedAt?: {
    seconds: number;
    nanoseconds: number;
  } | Date;
}

export interface PlaceInput {
  name: string;
  category: Category;
  description: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  geohash?: string; // Will be auto-generated if not provided
  images: string[];
  createdBy: string;
}

