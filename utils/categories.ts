import { Category } from "@/types/category";

export interface CategoryItem {
  id: string;
  nameKey: string;
  category: Category;
  iconName: string;
  color: string;
}

export const CATEGORIES: CategoryItem[] = [
  // Yeme & İçme
  { id: "1", nameKey: "category_cafes", category: "cafes", iconName: "coffee", color: "#E07A5F" },
  { id: "2", nameKey: "category_restaurants", category: "restaurants", iconName: "tools-kitchen", color: "#81B29A" },
  { id: "3", nameKey: "category_bars", category: "bars", iconName: "glass-full", color: "#3D405B" },
  { id: "4", nameKey: "category_fast_food", category: "fast_food", iconName: "hamburger", color: "#F97316" },
  { id: "5", nameKey: "category_bakeries", category: "bakeries", iconName: "bread", color: "#FCD34D" },
  { id: "6", nameKey: "category_ice_cream", category: "ice_cream", iconName: "ice-cream", color: "#F0ABFC" },
  { id: "7", nameKey: "category_street_food", category: "street_food", iconName: "tools-kitchen", color: "#F59E0B" },
  { id: "8", nameKey: "category_food_courts", category: "food_courts", iconName: "building-store", color: "#EF4444" },
  { id: "9", nameKey: "category_coffee_shops", category: "coffee_shops", iconName: "coffee", color: "#8B4513" },
  { id: "10", nameKey: "category_brunch_places", category: "brunch_places", iconName: "tools-kitchen", color: "#F2CC8F" },
  
  // Eğlence & Gece Hayatı
  { id: "11", nameKey: "category_nightclubs", category: "nightclubs", iconName: "music", color: "#A855F7" },
  { id: "12", nameKey: "category_pubs", category: "pubs", iconName: "glass-full", color: "#7C3AED" },
  { id: "13", nameKey: "category_karaoke", category: "karaoke", iconName: "microphone", color: "#EC4899" },
  { id: "14", nameKey: "category_entertainment_centers", category: "entertainment_centers", iconName: "device-gamepad", color: "#F59E0B" },
  { id: "15", nameKey: "category_game_arcades", category: "game_arcades", iconName: "device-gamepad", color: "#10B981" },
  { id: "16", nameKey: "category_bowling", category: "bowling", iconName: "bowling", color: "#3B82F6" },
  { id: "17", nameKey: "category_escape_rooms", category: "escape_rooms", iconName: "door", color: "#8B5CF6" },
  
  // Sanat & Kültür
  { id: "18", nameKey: "category_theaters", category: "theaters", iconName: "theater", color: "#EC4899" },
  { id: "19", nameKey: "category_concert_halls", category: "concert_halls", iconName: "music", color: "#A855F7" },
  { id: "20", nameKey: "category_art_galleries", category: "art_galleries", iconName: "artboard", color: "#EC4899" },
  { id: "21", nameKey: "category_museums", category: "museums", iconName: "building-museum", color: "#6366F1" },
  { id: "22", nameKey: "category_cultural_centers", category: "cultural_centers", iconName: "building", color: "#8B5CF6" },
  { id: "23", nameKey: "category_exhibition_spaces", category: "exhibition_spaces", iconName: "photo", color: "#F59E0B" },
  { id: "24", nameKey: "category_performance_venues", category: "performance_venues", iconName: "stage", color: "#EF4444" },
  { id: "25", nameKey: "category_workshops", category: "workshops", iconName: "tools", color: "#10B981" },
  
  // Sinema & Eğlence
  { id: "26", nameKey: "category_cinemas", category: "cinemas", iconName: "movie", color: "#EC4899" },
  { id: "27", nameKey: "category_imax_theaters", category: "imax_theaters", iconName: "movie", color: "#BE185D" },
  { id: "28", nameKey: "category_outdoor_cinemas", category: "outdoor_cinemas", iconName: "movie", color: "#F472B6" },
  { id: "29", nameKey: "category_film_festivals", category: "film_festivals", iconName: "award", color: "#DB2777" },
  
  // Etkinlik Mekanları
  { id: "30", nameKey: "category_convention_centers", category: "convention_centers", iconName: "building", color: "#6366F1" },
  { id: "31", nameKey: "category_fair_grounds", category: "fair_grounds", iconName: "building-store", color: "#F59E0B" },
  { id: "32", nameKey: "category_event_halls", category: "event_halls", iconName: "calendar-event", color: "#8B5CF6" },
  { id: "33", nameKey: "category_stadiums", category: "stadiums", iconName: "stadium", color: "#10B981" },
  { id: "34", nameKey: "category_outdoor_venues", category: "outdoor_venues", iconName: "map", color: "#3B82F6" },
  
  // Alışveriş
  { id: "35", nameKey: "category_shopping_malls", category: "shopping_malls", iconName: "shopping-bag", color: "#F59E0B" },
  { id: "36", nameKey: "category_boutiques", category: "boutiques", iconName: "shopping-bag", color: "#EC4899" },
  { id: "37", nameKey: "category_markets", category: "markets", iconName: "shopping-cart", color: "#10B981" },
  { id: "38", nameKey: "category_antique_stores", category: "antique_stores", iconName: "clock", color: "#8B5CF6" },
  { id: "39", nameKey: "category_bookstores", category: "bookstores", iconName: "book", color: "#6366F1" },
  { id: "40", nameKey: "category_music_stores", category: "music_stores", iconName: "music", color: "#A855F7" },
  
  // Yaşam & Dinlenme
  { id: "41", nameKey: "category_spa_wellness", category: "spa_wellness", iconName: "spa", color: "#10B981" },
  { id: "42", nameKey: "category_parks", category: "parks", iconName: "tree", color: "#22C55E" },
  { id: "43", nameKey: "category_libraries", category: "libraries", iconName: "library", color: "#6366F1" },
  { id: "44", nameKey: "category_coworking_spaces", category: "coworking_spaces", iconName: "briefcase", color: "#3B82F6" },
  { id: "45", nameKey: "category_meditation_centers", category: "meditation_centers", iconName: "leaf", color: "#059669" },
  
  // Ulaşım
  { id: "46", nameKey: "category_parking", category: "parking", iconName: "parking", color: "#64748B" },
  { id: "47", nameKey: "category_charging_stations", category: "charging_stations", iconName: "battery-charging", color: "#10B981" },
  { id: "48", nameKey: "category_public_transport", category: "public_transport", iconName: "bus", color: "#3B82F6" }
];
