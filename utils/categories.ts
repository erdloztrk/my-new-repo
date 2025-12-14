import { Category } from "@/types/category";

export interface CategoryItem {
  id: string;
  nameKey: string;
  category: Category;
  iconName: string;
  color: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: "1", nameKey: "category_cafes", category: "cafes", iconName: "coffee", color: "#E07A5F" },
  { id: "2", nameKey: "category_restaurants", category: "restaurants", iconName: "tools-kitchen", color: "#81B29A" },
  { id: "3", nameKey: "category_bars", category: "bars", iconName: "glass-full", color: "#3D405B" },
  { id: "4", nameKey: "category_parks", category: "parks", iconName: "tree", color: "#F2CC8F" },
  { id: "5", nameKey: "category_beach_clubs", category: "beach_clubs", iconName: "beach", color: "#38BDF8" },
  { id: "6", nameKey: "category_hotels", category: "hotels", iconName: "hotel-service", color: "#8B5CF6" },
  { id: "7", nameKey: "category_cinemas", category: "cinemas", iconName: "movie", color: "#EC4899" },
  { id: "8", nameKey: "category_shopping", category: "shopping", iconName: "shopping-bag", color: "#F59E0B" },
  { id: "9", nameKey: "category_gyms", category: "gyms", iconName: "gymnastics", color: "#EF4444" },
  { id: "10", nameKey: "category_libraries", category: "libraries", iconName: "library", color: "#6366F1" },
  { id: "11", nameKey: "category_hospitals", category: "hospitals", iconName: "hospital", color: "#DC2626" },
  { id: "12", nameKey: "category_schools", category: "schools", iconName: "school", color: "#10B981" },
  { id: "13", nameKey: "category_churches", category: "churches", iconName: "building-church", color: "#6B7280" },
  { id: "14", nameKey: "category_banks", category: "banks", iconName: "building-bank", color: "#059669" },
  { id: "15", nameKey: "category_gas_stations", category: "gas_stations", iconName: "gas-station", color: "#F97316" },
  { id: "16", nameKey: "category_parking", category: "parking", iconName: "parking", color: "#64748B" },
  { id: "17", nameKey: "category_bus_stops", category: "bus_stops", iconName: "bus", color: "#3B82F6" },
  { id: "18", nameKey: "category_train_stations", category: "train_stations", iconName: "train", color: "#0EA5E9" },
  { id: "19", nameKey: "category_nightclubs", category: "nightclubs", iconName: "music", color: "#A855F7" },
  { id: "20", nameKey: "category_art_galleries", category: "art_galleries", iconName: "artboard", color: "#EC4899" },
  { id: "21", nameKey: "category_ice_cream", category: "ice_cream", iconName: "ice-cream", color: "#F0ABFC" },
  { id: "22", nameKey: "category_bakeries", category: "bakeries", iconName: "bread", color: "#FCD34D" },
  { id: "23", nameKey: "category_bookstores", category: "bookstores", iconName: "book", color: "#8B5CF6" },
];

