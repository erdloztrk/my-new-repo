/**
 * Helper utilities for map-related operations.
 * Category colors, icons, distance calculation, and other map-specific utilities.
 */

import { Category } from "@/types/category";

/**
 * Calculate distance between two coordinates using Haversine formula (km).
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getCategoryColor(category: Category): string {
  const colors: Record<Category, string> = {
    // Yeme & İçme
    cafes: "#E07A5F",
    restaurants: "#81B29A",
    bars: "#3D405B",
    fast_food: "#F97316",
    bakeries: "#FCD34D",
    ice_cream: "#F0ABFC",
    street_food: "#F59E0B",
    food_courts: "#EF4444",
    coffee_shops: "#8B4513",
    brunch_places: "#F2CC8F",
    
    // Eğlence & Gece Hayatı
    nightclubs: "#A855F7",
    pubs: "#7C3AED",
    karaoke: "#EC4899",
    entertainment_centers: "#F59E0B",
    game_arcades: "#10B981",
    bowling: "#3B82F6",
    escape_rooms: "#8B5CF6",
    
    // Sanat & Kültür
    theaters: "#EC4899",
    concert_halls: "#A855F7",
    art_galleries: "#EC4899",
    museums: "#6366F1",
    cultural_centers: "#8B5CF6",
    exhibition_spaces: "#F59E0B",
    performance_venues: "#EF4444",
    workshops: "#10B981",
    
    // Sinema & Eğlence
    cinemas: "#EC4899",
    imax_theaters: "#BE185D",
    outdoor_cinemas: "#F472B6",
    film_festivals: "#DB2777",
    
    // Etkinlik Mekanları
    convention_centers: "#6366F1",
    fair_grounds: "#F59E0B",
    event_halls: "#8B5CF6",
    stadiums: "#10B981",
    outdoor_venues: "#3B82F6",
    
    // Alışveriş
    shopping_malls: "#F59E0B",
    boutiques: "#EC4899",
    markets: "#10B981",
    antique_stores: "#8B5CF6",
    bookstores: "#6366F1",
    music_stores: "#A855F7",
    
    // Yaşam & Dinlenme
    spa_wellness: "#10B981",
    parks: "#22C55E",
    libraries: "#6366F1",
    coworking_spaces: "#3B82F6",
    meditation_centers: "#059669",
    
    // Ulaşım
    parking: "#64748B",
    charging_stations: "#10B981",
    public_transport: "#3B82F6",
  };
  return colors[category] || "#6C63FF";
}

export function getCategoryIconName(category: Category): string {
  const iconMap: Record<Category, string> = {
    // Yeme & İçme
    cafes: "coffee",
    restaurants: "tools-kitchen",
    bars: "glass-full",
    fast_food: "hamburger",
    bakeries: "bread",
    ice_cream: "ice-cream",
    street_food: "tools-kitchen",
    food_courts: "building-store",
    coffee_shops: "coffee",
    brunch_places: "tools-kitchen",
    
    // Eğlence & Gece Hayatı
    nightclubs: "music",
    pubs: "glass-full",
    karaoke: "microphone",
    entertainment_centers: "device-gamepad",
    game_arcades: "device-gamepad",
    bowling: "bowling",
    escape_rooms: "door",
    
    // Sanat & Kültür
    theaters: "theater",
    concert_halls: "music",
    art_galleries: "artboard",
    museums: "building-museum",
    cultural_centers: "building",
    exhibition_spaces: "photo",
    performance_venues: "stage",
    workshops: "tools",
    
    // Sinema & Eğlence
    cinemas: "movie",
    imax_theaters: "movie",
    outdoor_cinemas: "movie",
    film_festivals: "award",
    
    // Etkinlik Mekanları
    convention_centers: "building",
    fair_grounds: "building-store",
    event_halls: "calendar-event",
    stadiums: "stadium",
    outdoor_venues: "map",
    
    // Alışveriş
    shopping_malls: "shopping-bag",
    boutiques: "shopping-bag",
    markets: "shopping-cart",
    antique_stores: "clock",
    bookstores: "book",
    music_stores: "music",
    
    // Yaşam & Dinlenme
    spa_wellness: "spa",
    parks: "tree",
    libraries: "library",
    coworking_spaces: "briefcase",
    meditation_centers: "leaf",
    
    // Ulaşım
    parking: "parking",
    charging_stations: "battery-charging",
    public_transport: "bus",
  };
  return iconMap[category] || "coffee";
}

