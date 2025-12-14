import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

type Language = "tr" | "en";

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const STORAGE_KEY = "@lokal_language";

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  tr: {
    // Common
    loading: "Yükleniyor...",
    error: "Hata",
    ok: "Tamam",
    cancel: "İptal",
    
    // Weather
    location: "Konum",
    temperature: "Sıcaklık",
    condition: "Durum",
    forecast: "Tahmin",
    uv_index: "UV İndeksi",
    sunrise: "Gün Doğumu",
    sunset: "Gün Batımı",
    low: "Düşük",
    high: "Yüksek",
    today: "Bugün",
    
    // Days
    monday: "Pazartesi",
    tuesday: "Salı",
    wednesday: "Çarşamba",
    thursday: "Perşembe",
    friday: "Cuma",
    saturday: "Cumartesi",
    sunday: "Pazar",
    
    // Tabs
    explore: "Keşfet",
    map: "Harita",
    saved: "Kaydedilenler",
    profile: "Profil",
    
    // Home
    welcome: "Hoş geldin 👋",
    app_name: "LOKAL",
    subtitle: "Şehrinin en iyi yerlerini keşfet",
    search_placeholder: "Mekan veya kategori ara...",
    categories: "Kategoriler",
    featured: "Öne Çıkanlar",
    
    // Profile
    settings: "Ayarlar",
    theme: "Tema",
    language: "Dil",
    
    // Map
    getting_location: "Konum alınıyor...",
    location_error: "Konum alınamadı",
    location_permission_required: "Konum izni gerekli",
    loading_places: "Mekanlar yükleniyor...",
    no_places_on_map: "Haritada mekan bulunamadı",
    show_route: "Rota Oluştur",
    route_shown: "Rota Gösteriliyor",
    details: "Detaylar",
    walking_route: "Yürüyüş Rotası",
    driving_route: "Araba Rotası",
    walking: "Yürüyüş",
    driving: "Araç",
    distance: "Mesafe",
    duration: "Süre",
    calculating_route: "Rota hesaplanıyor...",
    your_location: "Konumunuz",
    available: "Mevcut",
    
    // Profile
    account_settings: "Hesap Ayarları",
    notifications: "Bildirimler",
    help_support: "Yardım & Destek",
    about: "Hakkında",
    coming_soon: "Yakında!",
    coming_soon_message: "ile giriş özelliği yakında aktif olacak.",
    system: "Sistem",
    system_desc: "Cihaz ayarını kullan",
    light: "Açık",
    light_desc: "Her zaman açık tema",
    dark: "Koyu",
    dark_desc: "Her zaman koyu tema",
    login_with: "ile Giriş Yap",
    login_google: "Google ile Giriş Yap",
    login_facebook: "Facebook ile Giriş Yap",
    login_apple: "Apple ile Giriş Yap",
    login_email: "E-posta ile Giriş Yap",
    guest_user: "Misafir Kullanıcı",
    login_or_signup: "Giriş yap veya kayıt ol",
    or: "veya",
    check_permissions: "Lütfen konum izinlerini kontrol edin.",
    
    // Saved
    no_saved_items: "Henüz kaydedilmiş öğe yok",
    saved_empty_title: "Henüz kayıt yok",
    saved_empty_desc: "Beğendiğin mekanları kaydet, sonra kolayca bul!",
    featured_message: "Yakında burada şehrin en popüler mekanlarını göreceksin!",
    
    // Categories
    category_cafes: "Kafeler",
    category_restaurants: "Restoranlar",
    category_bars: "Barlar",
    category_parks: "Parklar",
    category_beach_clubs: "Beach Club",
    category_hotels: "Oteller",
    category_cinemas: "Sinemalar",
    category_shopping: "Alışveriş",
    category_gyms: "Spor Salonları",
    category_libraries: "Kütüphaneler",
    category_hospitals: "Hastaneler",
    category_schools: "Okullar",
    category_churches: "İbadethaneler",
    category_banks: "Bankalar",
    category_gas_stations: "Benzin İstasyonları",
    category_parking: "Otoparklar",
    category_bus_stops: "Otobüs Durakları",
    category_train_stations: "Tren İstasyonları",
    category_nightclubs: "Gece Kulüpleri",
    category_art_galleries: "Sanat Galerileri",
    category_ice_cream: "Dondurmacılar",
    category_bakeries: "Fırınlar",
    category_bookstores: "Kitapçılar",
    
    // UV Index descriptions
    uv_desc_none: "Bulutlu hava koşulları gece boyunca devam ediyor, sabaha kadar sürecek. Rüzgar esintileri saatte {windSpeed} km/h'ye kadar çıkıyor.",
    uv_desc_low: "Düşük UV indeksi. Dışarıda güvendesiniz.",
    uv_desc_moderate: "Orta UV indeksi. Bazı koruma gerekli.",
    uv_desc_high: "Yüksek UV indeksi. Koruma gerekli.",
    uv_desc_very_high: "Çok yüksek UV indeksi. Güneşe maruz kalmaktan kaçının.",
    
    // Month summary
    month_summary: "Ağustos Sıcaklık Özeti",
    
    // Fishing Activity
    "fishing.activity.title": "Balık Tutma Koşulları",
    "fishing.activity.species": "Türler",
    "fishing.activity.why": "Neden böyle?",
    "fishing.breakdown.title": "Koşul Analizi",
    "fishing.breakdown.value": "Değer",
    "fishing.factor.wave": "Dalga Yüksekliği",
    "fishing.factor.wave.calm": "Sakin deniz, ideal koşullar",
    "fishing.factor.wave.moderate": "Orta dalga, kabul edilebilir",
    "fishing.factor.wave.high": "Yüksek dalga, dikkatli olun",
    "fishing.factor.wave.very_high": "Çok yüksek dalga, tehlikeli",
    "fishing.factor.wave.no_data": "Dalga verisi mevcut değil",
    "fishing.factor.wind": "Rüzgar Hızı",
    "fishing.factor.wind.calm": "Hafif rüzgar, ideal",
    "fishing.factor.wind.moderate": "Orta rüzgar, kabul edilebilir",
    "fishing.factor.wind.strong": "Güçlü rüzgar, dikkatli olun",
    "fishing.factor.wind.very_strong": "Çok güçlü rüzgar, tehlikeli",
    "fishing.factor.sst": "Deniz Sıcaklığı",
    "fishing.factor.sst.ideal": "Ideal sıcaklık aralığında",
    "fishing.factor.sst.acceptable": "Kabul edilebilir sıcaklık",
    "fishing.factor.sst.cold": "Soğuk deniz, bazı türler için uygun değil",
    "fishing.factor.sst.warm": "Sıcak deniz, bazı türler için uygun değil",
    "fishing.factor.sst.no_data": "Deniz sıcaklığı verisi mevcut değil",
    "fishing.factor.pressure": "Hava Basıncı",
    "fishing.factor.pressure.stable": "Stabil basınç, ideal",
    "fishing.factor.pressure.normal": "Normal basınç",
    "fishing.factor.pressure.low": "Düşük basınç, hava değişebilir",
    "fishing.factor.pressure.high": "Yüksek basınç, stabil hava",
    "fishing.breakdown.no_data": "Veri yükleniyor veya mevcut değil",
    
    // Fishing PRO
    "fishing.pro.title": "Balık Tutma PRO",
    "fishing.pro.hourly_curve": "Saatlik Skor Eğrisi",
    "fishing.pro.best_time": "En İyi Zaman Aralığı",
    "fishing.pro.avg_score": "Ortalama Skor",
    "fishing.pro.bait_suggestion": "Yem Önerisi",
    "fishing.pro.primary_bait": "Birincil Yem",
    "fishing.pro.secondary_bait": "İkincil Yem",
    "fishing.pro.no_forecast": "Saatlik tahmin verisi mevcut değil",
  },
  en: {
    // Common
    loading: "Loading...",
    error: "Error",
    ok: "OK",
    cancel: "Cancel",
    
    // Weather
    location: "Location",
    temperature: "Temperature",
    condition: "Condition",
    forecast: "Forecast",
    uv_index: "UV Index",
    sunrise: "Sunrise",
    sunset: "Sunset",
    low: "Low",
    high: "High",
    today: "Today",
    
    // Days
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    
    // Tabs
    explore: "Explore",
    map: "Map",
    saved: "Saved",
    profile: "Profile",
    
    // Home
    welcome: "Welcome 👋",
    app_name: "LOKAL",
    subtitle: "Discover the best places in your city",
    search_placeholder: "Search place or category...",
    categories: "Categories",
    featured: "Featured",
    
    // Profile
    settings: "Settings",
    theme: "Theme",
    language: "Language",
    
    // Map
    getting_location: "Getting location...",
    location_error: "Could not get location",
    location_permission_required: "Location permission required",
    loading_places: "Loading places...",
    no_places_on_map: "No places found on map",
    show_route: "Show Route",
    route_shown: "Route Shown",
    details: "Details",
    walking_route: "Walking Route",
    driving_route: "Driving Route",
    walking: "Walking",
    driving: "Driving",
    distance: "Distance",
    duration: "Duration",
    calculating_route: "Calculating route...",
    your_location: "Your Location",
    available: "Available",
    
    // Profile
    account_settings: "Account Settings",
    notifications: "Notifications",
    help_support: "Help & Support",
    about: "About",
    coming_soon: "Coming Soon!",
    coming_soon_message: "login feature will be available soon.",
    system: "System",
    system_desc: "Use device setting",
    light: "Light",
    light_desc: "Always light theme",
    dark: "Dark",
    dark_desc: "Always dark theme",
    login_with: "Login with",
    login_google: "Login with Google",
    login_facebook: "Login with Facebook",
    login_apple: "Login with Apple",
    login_email: "Login with Email",
    guest_user: "Guest User",
    login_or_signup: "Login or sign up",
    or: "or",
    check_permissions: "Please check location permissions.",
    
    // Saved
    no_saved_items: "No saved items yet",
    saved_empty_title: "No saved items yet",
    saved_empty_desc: "Save places you like and find them easily later!",
    featured_message: "Soon you'll see the most popular places in the city here!",
    
    // Categories
    category_cafes: "Cafes",
    category_restaurants: "Restaurants",
    category_bars: "Bars",
    category_parks: "Parks",
    category_beach_clubs: "Beach Clubs",
    category_hotels: "Hotels",
    category_cinemas: "Cinemas",
    category_shopping: "Shopping",
    category_gyms: "Gyms",
    category_libraries: "Libraries",
    category_hospitals: "Hospitals",
    category_schools: "Schools",
    category_churches: "Places of Worship",
    category_banks: "Banks",
    category_gas_stations: "Gas Stations",
    category_parking: "Parking",
    category_bus_stops: "Bus Stops",
    category_train_stations: "Train Stations",
    category_nightclubs: "Nightclubs",
    category_art_galleries: "Art Galleries",
    category_ice_cream: "Ice Cream Shops",
    category_bakeries: "Bakeries",
    category_bookstores: "Bookstores",
    
    // UV Index descriptions
    uv_desc_none: "Cloudy conditions tonight, continuing through the morning. Wind gusts are up to {windSpeed} km/h.",
    uv_desc_low: "Low UV index. Safe to be outside.",
    uv_desc_moderate: "Moderate UV index. Some protection needed.",
    uv_desc_high: "High UV index. Protection required.",
    uv_desc_very_high: "Very high UV index. Avoid sun exposure.",
    
    // Month summary
    month_summary: "August Temperature Summary",
    
    // Fishing Activity
    "fishing.activity.title": "Fishing Conditions",
    "fishing.activity.species": "Species",
    "fishing.activity.why": "Why?",
    "fishing.breakdown.title": "Condition Analysis",
    "fishing.breakdown.value": "Value",
    "fishing.factor.wave": "Wave Height",
    "fishing.factor.wave.calm": "Calm sea, ideal conditions",
    "fishing.factor.wave.moderate": "Moderate waves, acceptable",
    "fishing.factor.wave.high": "High waves, be careful",
    "fishing.factor.wave.very_high": "Very high waves, dangerous",
    "fishing.factor.wave.no_data": "Wave data not available",
    "fishing.factor.wind": "Wind Speed",
    "fishing.factor.wind.calm": "Light wind, ideal",
    "fishing.factor.wind.moderate": "Moderate wind, acceptable",
    "fishing.factor.wind.strong": "Strong wind, be careful",
    "fishing.factor.wind.very_strong": "Very strong wind, dangerous",
    "fishing.factor.sst": "Sea Temperature",
    "fishing.factor.sst.ideal": "Within ideal temperature range",
    "fishing.factor.sst.acceptable": "Acceptable temperature",
    "fishing.factor.sst.cold": "Cold sea, not suitable for some species",
    "fishing.factor.sst.warm": "Warm sea, not suitable for some species",
    "fishing.factor.sst.no_data": "Sea temperature data not available",
    "fishing.factor.pressure": "Air Pressure",
    "fishing.factor.pressure.stable": "Stable pressure, ideal",
    "fishing.factor.pressure.normal": "Normal pressure",
    "fishing.factor.pressure.low": "Low pressure, weather may change",
    "fishing.factor.pressure.high": "High pressure, stable weather",
    "fishing.breakdown.no_data": "Data is loading or not available",
    
    // Fishing PRO
    "fishing.pro.title": "Fishing PRO",
    "fishing.pro.hourly_curve": "Hourly Score Curve",
    "fishing.pro.best_time": "Best Time Window",
    "fishing.pro.avg_score": "Average Score",
    "fishing.pro.bait_suggestion": "Bait Suggestion",
    "fishing.pro.primary_bait": "Primary Bait",
    "fishing.pro.secondary_bait": "Secondary Bait",
    "fishing.pro.no_forecast": "Hourly forecast data not available",
    
    // Places
    no_image: "No image",
    no_places: "No places yet",
    no_places_desc: "No places have been added to this category yet.",
    reviews: "Reviews",
    review: "review",
    add_review: "Add Review",
    rating: "Rating",
    review_comment_placeholder: "Write your review...",
    submitting: "Submitting...",
    submit_review: "Submit Review",
    no_reviews: "No reviews yet",
    add_place: "Add Place",
    name: "Name",
    place_name_placeholder: "Place name",
    description: "Description",
    description_placeholder: "Information about the place...",
    address: "Address",
    address_placeholder: "Full address",
    images: "Images",
    add_images: "Add Images",
    selected_location: "Selected Location",
    loading_location: "Loading location...",
    submit: "Submit",
  },
};

export const useI18n = create<I18nStore>((set, get) => ({
  language: "tr",
  
  setLanguage: async (lang: Language) => {
    set({ language: lang });
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  },
  
  t: (key: string) => {
    const { language } = get();
    return translations[language][key] || key;
  },
}));

// Initialize language from storage or system
AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
  if (stored && (stored === "tr" || stored === "en")) {
    useI18n.getState().setLanguage(stored as Language);
  } else {
    // Detect system language
    const systemLang = Localization.getLocales()[0]?.languageCode || "tr";
    const lang: Language = systemLang.startsWith("en") ? "en" : "tr";
    useI18n.getState().setLanguage(lang);
  }
});

