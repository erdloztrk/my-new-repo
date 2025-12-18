export type Category = 
  // Yeme & İçme
  | "cafes" 
  | "restaurants" 
  | "bars" 
  | "fast_food"
  | "bakeries"
  | "ice_cream"
  | "street_food"
  | "food_courts"
  | "coffee_shops"
  | "brunch_places"
  
  // Eğlence & Gece Hayatı
  | "nightclubs"
  | "pubs"
  | "karaoke"
  | "entertainment_centers"
  | "game_arcades"
  | "bowling"
  | "escape_rooms"
  
  // Sanat & Kültür
  | "theaters"
  | "concert_halls"
  | "art_galleries"
  | "museums"
  | "cultural_centers"
  | "exhibition_spaces"
  | "performance_venues"
  | "workshops"
  
  // Sinema & Eğlence
  | "cinemas"
  | "imax_theaters"
  | "outdoor_cinemas"
  | "film_festivals"
  
  // Etkinlik Mekanları
  | "convention_centers"
  | "fair_grounds"
  | "event_halls"
  | "stadiums"
  | "outdoor_venues"
  
  // Alışveriş
  | "shopping_malls"
  | "boutiques"
  | "markets"
  | "antique_stores"
  | "bookstores"
  | "music_stores"
  
  // Yaşam & Dinlenme
  | "spa_wellness"
  | "parks"
  | "libraries"
  | "coworking_spaces"
  | "meditation_centers"
  
  // Ulaşım
  | "parking"
  | "charging_stations"
  | "public_transport";

// Parent category keys
export type ParentCategoryKey = 
  | "01_YEME_ICME"
  | "02_EGLENCE_GECE"
  | "03_SANAT_KULTUR"
  | "04_SINEMA_EGLENCE"
  | "05_ETKINLIK_MEKANLARI"
  | "06_ALISVERIS"
  | "07_YASAM_DINLENME"
  | "08_ULASIM";

// Category structure with parent-child hierarchy
export interface CategoryStructure {
  label: string;
  icon: string;
  sub: string[];
}

export const categoryStructure: Record<ParentCategoryKey, CategoryStructure> = {
  "01_YEME_ICME": {
    label: "Yeme & İçme",
    icon: "tools-kitchen",
    sub: [
      "Kafeler",
      "Restoranlar", 
      "Barlar & Pub'lar",
      "Fast Food",
      "Pastaneler",
      "Dondurmacılar",
      "Sokak Yemekleri",
      "Food Court'lar",
      "Kahve Dükkanları",
      "Brunch Mekanları"
    ]
  },
  "02_EGLENCE_GECE": {
    label: "Eğlence & Gece Hayatı",
    icon: "music",
    sub: [
      "Gece Kulüpleri",
      "Pub'lar",
      "Karaoke",
      "Eğlence Merkezleri",
      "Oyun Salonları",
      "Bowling & Bilardo",
      "Escape Room'lar"
    ]
  },
  "03_SANAT_KULTUR": {
    label: "Sanat & Kültür",
    icon: "palette",
    sub: [
      "Tiyatrolar",
      "Konser Salonları",
      "Sanat Galerileri",
      "Müzeler",
      "Kültür Merkezleri",
      "Sergi Alanları",
      "Performans Mekanları",
      "Atölyeler"
    ]
  },
  "04_SINEMA_EGLENCE": {
    label: "Sinema & Eğlence",
    icon: "movie",
    sub: [
      "Sinemalar",
      "IMAX Salonları",
      "Açık Hava Sinemaları",
      "Film Festivalleri"
    ]
  },
  "05_ETKINLIK_MEKANLARI": {
    label: "Etkinlik Mekanları",
    icon: "calendar-event",
    sub: [
      "Kongre Merkezleri",
      "Fuar Alanları",
      "Etkinlik Salonları",
      "Stadyumlar",
      "Açık Hava Alanları"
    ]
  },
  "06_ALISVERIS": {
    label: "Alışveriş",
    icon: "shopping-bag",
    sub: [
      "AVM'ler",
      "Butikler",
      "Çarşılar & Pazarlar",
      "Antika & Vintage",
      "Kitapçılar",
      "Müzik Mağazaları"
    ]
  },
  "07_YASAM_DINLENME": {
    label: "Yaşam & Dinlenme",
    icon: "leaf",
    sub: [
      "Spa & Wellness",
      "Parklar & Bahçeler",
      "Kütüphaneler",
      "Coworking Alanları",
      "Meditasyon Merkezleri"
    ]
  },
  "08_ULASIM": {
    label: "Ulaşım",
    icon: "car",
    sub: [
      "Otoparklar",
      "Şarj İstasyonları",
      "Toplu Taşıma Durakları"
    ]
  }
};

// Map child category labels to Category types
export const childCategoryToCategory: Record<string, Category> = {
  // Yeme & İçme
  "Kafeler": "cafes",
  "Restoranlar": "restaurants",
  "Barlar & Pub'lar": "bars",
  "Fast Food": "fast_food",
  "Pastaneler": "bakeries",
  "Dondurmacılar": "ice_cream",
  "Sokak Yemekleri": "street_food",
  "Food Court'lar": "food_courts",
  "Kahve Dükkanları": "coffee_shops",
  "Brunch Mekanları": "brunch_places",
  
  // Eğlence & Gece Hayatı
  "Gece Kulüpleri": "nightclubs",
  "Pub'lar": "pubs",
  "Karaoke": "karaoke",
  "Eğlence Merkezleri": "entertainment_centers",
  "Oyun Salonları": "game_arcades",
  "Bowling & Bilardo": "bowling",
  "Escape Room'lar": "escape_rooms",
  
  // Sanat & Kültür
  "Tiyatrolar": "theaters",
  "Konser Salonları": "concert_halls",
  "Sanat Galerileri": "art_galleries",
  "Müzeler": "museums",
  "Kültür Merkezleri": "cultural_centers",
  "Sergi Alanları": "exhibition_spaces",
  "Performans Mekanları": "performance_venues",
  "Atölyeler": "workshops",
  
  // Sinema & Eğlence
  "Sinemalar": "cinemas",
  "IMAX Salonları": "imax_theaters",
  "Açık Hava Sinemaları": "outdoor_cinemas",
  "Film Festivalleri": "film_festivals",
  
  // Etkinlik Mekanları
  "Kongre Merkezleri": "convention_centers",
  "Fuar Alanları": "fair_grounds",
  "Etkinlik Salonları": "event_halls",
  "Stadyumlar": "stadiums",
  "Açık Hava Alanları": "outdoor_venues",
  
  // Alışveriş
  "AVM'ler": "shopping_malls",
  "Butikler": "boutiques",
  "Çarşılar & Pazarlar": "markets",
  "Antika & Vintage": "antique_stores",
  "Kitapçılar": "bookstores",
  "Müzik Mağazaları": "music_stores",
  
  // Yaşam & Dinlenme
  "Spa & Wellness": "spa_wellness",
  "Parklar & Bahçeler": "parks",
  "Kütüphaneler": "libraries",
  "Coworking Alanları": "coworking_spaces",
  "Meditasyon Merkezleri": "meditation_centers",
  
  // Ulaşım
  "Otoparklar": "parking",
  "Şarj İstasyonları": "charging_stations",
  "Toplu Taşıma Durakları": "public_transport"
};

export const CATEGORIES: Category[] = [
  // Yeme & İçme
  "cafes",
  "restaurants",
  "bars",
  "fast_food",
  "bakeries",
  "ice_cream",
  "street_food",
  "food_courts",
  "coffee_shops",
  "brunch_places",
  
  // Eğlence & Gece Hayatı
  "nightclubs",
  "pubs",
  "karaoke",
  "entertainment_centers",
  "game_arcades",
  "bowling",
  "escape_rooms",
  
  // Sanat & Kültür
  "theaters",
  "concert_halls",
  "art_galleries",
  "museums",
  "cultural_centers",
  "exhibition_spaces",
  "performance_venues",
  "workshops",
  
  // Sinema & Eğlence
  "cinemas",
  "imax_theaters",
  "outdoor_cinemas",
  "film_festivals",
  
  // Etkinlik Mekanları
  "convention_centers",
  "fair_grounds",
  "event_halls",
  "stadiums",
  "outdoor_venues",
  
  // Alışveriş
  "shopping_malls",
  "boutiques",
  "markets",
  "antique_stores",
  "bookstores",
  "music_stores",
  
  // Yaşam & Dinlenme
  "spa_wellness",
  "parks",
  "libraries",
  "coworking_spaces",
  "meditation_centers",
  
  // Ulaşım
  "parking",
  "charging_stations",
  "public_transport"
];

export const CATEGORY_LABELS: Record<Category, string> = {
  // Yeme & İçme
  cafes: "category_cafes",
  restaurants: "category_restaurants",
  bars: "category_bars",
  fast_food: "category_fast_food",
  bakeries: "category_bakeries",
  ice_cream: "category_ice_cream",
  street_food: "category_street_food",
  food_courts: "category_food_courts",
  coffee_shops: "category_coffee_shops",
  brunch_places: "category_brunch_places",
  
  // Eğlence & Gece Hayatı
  nightclubs: "category_nightclubs",
  pubs: "category_pubs",
  karaoke: "category_karaoke",
  entertainment_centers: "category_entertainment_centers",
  game_arcades: "category_game_arcades",
  bowling: "category_bowling",
  escape_rooms: "category_escape_rooms",
  
  // Sanat & Kültür
  theaters: "category_theaters",
  concert_halls: "category_concert_halls",
  art_galleries: "category_art_galleries",
  museums: "category_museums",
  cultural_centers: "category_cultural_centers",
  exhibition_spaces: "category_exhibition_spaces",
  performance_venues: "category_performance_venues",
  workshops: "category_workshops",
  
  // Sinema & Eğlence
  cinemas: "category_cinemas",
  imax_theaters: "category_imax_theaters",
  outdoor_cinemas: "category_outdoor_cinemas",
  film_festivals: "category_film_festivals",
  
  // Etkinlik Mekanları
  convention_centers: "category_convention_centers",
  fair_grounds: "category_fair_grounds",
  event_halls: "category_event_halls",
  stadiums: "category_stadiums",
  outdoor_venues: "category_outdoor_venues",
  
  // Alışveriş
  shopping_malls: "category_shopping_malls",
  boutiques: "category_boutiques",
  markets: "category_markets",
  antique_stores: "category_antique_stores",
  bookstores: "category_bookstores",
  music_stores: "category_music_stores",
  
  // Yaşam & Dinlenme
  spa_wellness: "category_spa_wellness",
  parks: "category_parks",
  libraries: "category_libraries",
  coworking_spaces: "category_coworking_spaces",
  meditation_centers: "category_meditation_centers",
  
  // Ulaşım
  parking: "category_parking",
  charging_stations: "category_charging_stations",
  public_transport: "category_public_transport"
};
