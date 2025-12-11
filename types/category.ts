export type Category = 
  | "cafes" 
  | "restaurants" 
  | "bars" 
  | "parks" 
  | "beach_clubs"
  | "hotels"
  | "cinemas"
  | "shopping"
  | "gyms"
  | "libraries"
  | "hospitals"
  | "schools"
  | "churches"
  | "banks"
  | "gas_stations"
  | "parking"
  | "bus_stops"
  | "train_stations"
  | "nightclubs"
  | "art_galleries"
  | "ice_cream"
  | "bakeries"
  | "bookstores";

export const CATEGORIES: Category[] = [
  "cafes",
  "restaurants",
  "bars",
  "parks",
  "beach_clubs",
  "hotels",
  "cinemas",
  "shopping",
  "gyms",
  "libraries",
  "hospitals",
  "schools",
  "churches",
  "banks",
  "gas_stations",
  "parking",
  "bus_stops",
  "train_stations",
  "nightclubs",
  "art_galleries",
  "ice_cream",
  "bakeries",
  "bookstores",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  cafes: "category_cafes",
  restaurants: "category_restaurants",
  bars: "category_bars",
  parks: "category_parks",
  beach_clubs: "category_beach_clubs",
  hotels: "category_hotels",
  cinemas: "category_cinemas",
  shopping: "category_shopping",
  gyms: "category_gyms",
  libraries: "category_libraries",
  hospitals: "category_hospitals",
  schools: "category_schools",
  churches: "category_churches",
  banks: "category_banks",
  gas_stations: "category_gas_stations",
  parking: "category_parking",
  bus_stops: "category_bus_stops",
  train_stations: "category_train_stations",
  nightclubs: "category_nightclubs",
  art_galleries: "category_art_galleries",
  ice_cream: "category_ice_cream",
  bakeries: "category_bakeries",
  bookstores: "category_bookstores",
};

