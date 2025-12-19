import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

type Language = "tr" | "en";

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
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
    error_boundary_title: "Bir Hata Oluştu",
    error_boundary_description: "Uygulamada beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
    error_boundary_retry: "Tekrar Dene",
    
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
    
    // Collections
    collections: "Koleksiyonlar",
    collection: "Koleksiyon",
    new_collection: "Yeni Koleksiyon",
    collection_name: "Koleksiyon Adı",
    collection_description: "Açıklama (opsiyonel)",
    create_collection: "Oluştur",
    edit_collection: "Düzenle",
    delete_collection: "Sil",
    collection_places: "{count} mekan",
    collection_empty_title: "Henüz koleksiyon yok",
    collection_empty_desc: "Mekanlarını organize etmek için koleksiyon oluştur!",
    collection_places_empty: "Bu koleksiyonda henüz mekan yok",
    collection_places_empty_desc: "Haritadan mekan ekleyerek başla",
    add_to_collection: "Koleksiyona Ekle",
    remove_from_collection: "Koleksiyondan Çıkar",
    select_collection: "Koleksiyon Seç",
    share_collection: "Paylaş",
    collection_shared: "Koleksiyon paylaşıldı",
    collection_share_error: "Paylaşım hatası",
    collection_delete_confirm: "Bu koleksiyonu silmek istediğinizden emin misiniz?",
    collection_delete_success: "Koleksiyon silindi",
    collection_delete_error: "Koleksiyon silinemedi",
    already_added: "Zaten eklendi",
    
    // Search & Filters
    search_places: "Mekan ara",
    quick_filters: "Hızlı Filtreler",
    filter_open_now: "Açık Şimdi",
    filter_nearest: "En Yakın",
    filter_most_popular: "En Popüler",
    filter_family_friendly: "Çocuklu Aile",
    filter_beach: "Deniz/Plaj",
    filter_coffee: "Kahve",
    filter_nightlife: "Gece Hayatı",
    clear_search: "Temizle",
    
    // Atmosphere Widget
    atmosphere_title: "Atmosfer",
    updated_at: "Güncellendi",
    cached_label: "Önbellek",
    weather_details: "Hava Detayı",
    humidity: "Nem",
    air_quality: "Hava Kalitesi",
    aqi: "AQI",
    hourly_forecast: "Saatlik Tahmin",
    
    featured_message: "Yakında burada şehrin en popüler mekanlarını göreceksin!",
    
    // Categories - Yeme & İçme
    category_cafes: "Kafeler",
    category_restaurants: "Restoranlar",
    category_bars: "Barlar",
    category_fast_food: "Fast Food",
    category_bakeries: "Pastaneler",
    category_ice_cream: "Dondurmacılar",
    category_street_food: "Sokak Yemekleri",
    category_food_courts: "Food Court'lar",
    category_coffee_shops: "Kahve Dükkanları",
    category_brunch_places: "Brunch Mekanları",
    
    // Categories - Eğlence & Gece Hayatı
    category_nightclubs: "Gece Kulüpleri",
    category_pubs: "Pub'lar",
    category_karaoke: "Karaoke",
    category_entertainment_centers: "Eğlence Merkezleri",
    category_game_arcades: "Oyun Salonları",
    category_bowling: "Bowling & Bilardo",
    category_escape_rooms: "Escape Room'lar",
    
    // Categories - Sanat & Kültür
    category_theaters: "Tiyatrolar",
    category_concert_halls: "Konser Salonları",
    category_art_galleries: "Sanat Galerileri",
    category_museums: "Müzeler",
    category_cultural_centers: "Kültür Merkezleri",
    category_exhibition_spaces: "Sergi Alanları",
    category_performance_venues: "Performans Mekanları",
    category_workshops: "Atölyeler",
    
    // Categories - Sinema & Eğlence
    category_cinemas: "Sinemalar",
    category_imax_theaters: "IMAX Salonları",
    category_outdoor_cinemas: "Açık Hava Sinemaları",
    category_film_festivals: "Film Festivalleri",
    
    // Categories - Etkinlik Mekanları
    category_convention_centers: "Kongre Merkezleri",
    category_fair_grounds: "Fuar Alanları",
    category_event_halls: "Etkinlik Salonları",
    category_stadiums: "Stadyumlar",
    category_outdoor_venues: "Açık Hava Alanları",
    
    // Categories - Alışveriş
    category_shopping_malls: "AVM'ler",
    category_boutiques: "Butikler",
    category_markets: "Çarşılar & Pazarlar",
    category_antique_stores: "Antika & Vintage",
    category_bookstores: "Kitapçılar",
    category_music_stores: "Müzik Mağazaları",
    
    // Categories - Yaşam & Dinlenme
    category_spa_wellness: "Spa & Wellness",
    category_parks: "Parklar & Bahçeler",
    category_libraries: "Kütüphaneler",
    category_coworking_spaces: "Coworking Alanları",
    category_meditation_centers: "Meditasyon Merkezleri",
    
    // Categories - Ulaşım
    category_parking: "Otoparklar",
    category_charging_stations: "Şarj İstasyonları",
    category_public_transport: "Toplu Taşıma Durakları",
    
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
    
    // Profile - Additional
    user_type: "Kullanıcı Türü",
    required: "* Zorunlu",
    login_methods: "Giriş Yöntemleri",
    "login.google": "Google ile Giriş",
    "login.apple": "Apple ile Giriş",
    "login.facebook": "Facebook ile Giriş",
    "login.email": "E-posta ile Giriş",
    reviews_not_available: "Yorumlar şu anda yüklenemiyor.",
    category: "Kategori",
    
    // User Roles
    "user_role.local": "Local Kullanıcı",
    "user_role.local_desc": "Bulunduğun şehirde hizmet veren kullanıcılar",
    "user_role.unlocal": "Ziyaretçi / Unlocal Kullanıcı",
    "user_role.unlocal_desc": "Sadece keşfetmek isteyen kullanıcılar",
    "user_role.business": "Business Kullanıcı",
    "user_role.business_desc": "İşletme sahipleri ve profesyoneller",
    
    // Admin
    "admin.login.title": "Admin Girişi",
    "admin.login.subtitle": "Admin bilgilerinizi girin",
    "admin.login.email_placeholder": "E-posta",
    "admin.login.password_placeholder": "Şifre",
    "admin.login.button": "Giriş Yap",
    "admin.login.error_empty_fields": "Lütfen e-posta ve şifre girin",
    "admin.login.error_failed": "Giriş Başarısız",
    "admin.login.error_invalid_credentials": "Geçersiz kimlik bilgileri",
    "admin.dashboard.title": "Admin Paneli",
    "admin.dashboard.delete_place_title": "Mekanı Sil",
    "admin.dashboard.delete_place_message": '"{placeName}" mekanını silmek istediğinize emin misiniz?',
    "admin.dashboard.delete_success": "Mekan başarıyla silindi",
    "admin.dashboard.delete_error": "Mekan silinemedi",
    "admin.dashboard.logout_title": "Çıkış Yap",
    "admin.dashboard.logout_message": "Çıkış yapmak istediğinize emin misiniz?",
    "admin.dashboard.load_error": "Mekanlar yüklenemedi",
    "admin.dashboard.admin_label": "Admin",
    "admin.dashboard.add_place": "Yeni Mekan Ekle",
    "admin.dashboard.all_places": "Tüm Mekanlar",
    "admin.dashboard.welcome_back": "Hoş geldiniz,",
    "admin.dashboard.statistics": "İstatistikler",
    "admin.dashboard.total_places": "Toplam Mekan",
    
    // Map Filters
    "map.filter.radius": "Yarıçap",
    "map.filter.radius_disabled": "Kapalı",
    "map.filter.radius_default": "Varsayılan: 5 km",
    "map.filter.radius_km": "{radius} km",
    "map.filter.radius_enable": "Yarıçap filtresini kullan",
    "map.filter.categories": "Kategoriler",
    "map.filter.all_places": "Tüm Mekanlar",
    "map.filter.categories_selected": "{count} kategori seçili",
    "map.filter.collections": "Koleksiyonlar",
    "map.filter.all_collections": "Tüm koleksiyonlar",
    "map.filter.collections_selected": "{count} koleksiyon seçili",
    "map.filter.clear_all": "Tümünü Temizle",
    "map.filter.km": "km",
    "map.filter.places_will_show": "{count} mekan gösterilecek",
    "map.filter.title": "Filtreler",
    "map.filter.apply": "Uygula",
    in_collections: "Koleksiyonlarda",
    
    // Weather
    "weather.now": "Şimdi",
    
    // Add Place Screen - Additional
    "add_place.error_load_failed": "Mekan yüklenemedi",
    "add_place.camera_permission_title": "İzin",
    "add_place.camera_permission_message": "Kamera galeri izni gerekli",
    "add_place.error_pick_image": "Resim seçilemedi",
    "add_place.edit_place": "Mekanı Düzenle",
  },
  en: {
    // Common
    loading: "Loading...",
    error: "Error",
    ok: "OK",
    cancel: "Cancel",
    error_boundary_title: "An Error Occurred",
    error_boundary_description: "An unexpected error occurred in the app. Please try again.",
    error_boundary_retry: "Try Again",
    
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
    
    // Search & Filters
    search_places: "Search Places",
    quick_filters: "Quick Filters",
    filter_open_now: "Open Now",
    filter_nearest: "Nearest",
    filter_most_popular: "Most Popular",
    filter_family_friendly: "Family Friendly",
    filter_beach: "Beach/Sea",
    filter_coffee: "Coffee",
    filter_nightlife: "Nightlife",
    clear_search: "Clear",
    
    // Atmosphere Widget
    atmosphere_title: "Atmosphere",
    updated_at: "Updated",
    cached_label: "Cached",
    weather_details: "Weather Details",
    humidity: "Humidity",
    air_quality: "Air Quality",
    aqi: "AQI",
    hourly_forecast: "Hourly Forecast",
    
    // Categories - Food & Drink
    category_cafes: "Cafes",
    category_restaurants: "Restaurants",
    category_bars: "Bars",
    category_fast_food: "Fast Food",
    category_bakeries: "Bakeries",
    category_ice_cream: "Ice Cream Shops",
    category_street_food: "Street Food",
    category_food_courts: "Food Courts",
    category_coffee_shops: "Coffee Shops",
    category_brunch_places: "Brunch Places",
    
    // Categories - Entertainment & Nightlife
    category_nightclubs: "Nightclubs",
    category_pubs: "Pubs",
    category_karaoke: "Karaoke",
    category_entertainment_centers: "Entertainment Centers",
    category_game_arcades: "Game Arcades",
    category_bowling: "Bowling & Billiards",
    category_escape_rooms: "Escape Rooms",
    
    // Categories - Arts & Culture
    category_theaters: "Theaters",
    category_concert_halls: "Concert Halls",
    category_art_galleries: "Art Galleries",
    category_museums: "Museums",
    category_cultural_centers: "Cultural Centers",
    category_exhibition_spaces: "Exhibition Spaces",
    category_performance_venues: "Performance Venues",
    category_workshops: "Workshops",
    
    // Categories - Cinema & Entertainment
    category_cinemas: "Cinemas",
    category_imax_theaters: "IMAX Theaters",
    category_outdoor_cinemas: "Outdoor Cinemas",
    category_film_festivals: "Film Festivals",
    
    // Categories - Event Venues
    category_convention_centers: "Convention Centers",
    category_fair_grounds: "Fair Grounds",
    category_event_halls: "Event Halls",
    category_stadiums: "Stadiums",
    category_outdoor_venues: "Outdoor Venues",
    
    // Categories - Shopping
    category_shopping_malls: "Shopping Malls",
    category_boutiques: "Boutiques",
    category_markets: "Markets & Bazaars",
    category_antique_stores: "Antique & Vintage",
    category_bookstores: "Bookstores",
    category_music_stores: "Music Stores",
    
    // Categories - Lifestyle & Relaxation
    category_spa_wellness: "Spa & Wellness",
    category_parks: "Parks & Gardens",
    category_libraries: "Libraries",
    category_coworking_spaces: "Coworking Spaces",
    category_meditation_centers: "Meditation Centers",
    
    // Categories - Transportation
    category_parking: "Parking",
    category_charging_stations: "Charging Stations",
    category_public_transport: "Public Transport Stops",
    
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
    
    // Profile - Additional
    user_type: "User Type",
    required: "* Required",
    login_methods: "Login Methods",
    "login.google": "Login with Google",
    "login.apple": "Login with Apple",
    "login.facebook": "Login with Facebook",
    "login.email": "Login with Email",
    reviews_not_available: "Reviews are currently unavailable.",
    category: "Category",
    
    // User Roles
    "user_role.local": "Local User",
    "user_role.local_desc": "Users providing services in your city",
    "user_role.unlocal": "Visitor / Unlocal User",
    "user_role.unlocal_desc": "Users who just want to explore",
    "user_role.business": "Business User",
    "user_role.business_desc": "Business owners and professionals",
    
    // Admin
    "admin.login.title": "Admin Login",
    "admin.login.subtitle": "Enter your admin credentials",
    "admin.login.email_placeholder": "Email",
    "admin.login.password_placeholder": "Password",
    "admin.login.button": "Login",
    "admin.login.error_empty_fields": "Please enter email and password",
    "admin.login.error_failed": "Login Failed",
    "admin.login.error_invalid_credentials": "Invalid credentials",
    "admin.dashboard.title": "Admin Dashboard",
    "admin.dashboard.delete_place_title": "Delete Place",
    "admin.dashboard.delete_place_message": 'Are you sure you want to delete "{placeName}"?',
    "admin.dashboard.delete_success": "Place deleted successfully",
    "admin.dashboard.delete_error": "Failed to delete place",
    "admin.dashboard.logout_title": "Logout",
    "admin.dashboard.logout_message": "Are you sure you want to logout?",
    "admin.dashboard.load_error": "Failed to load places",
    "admin.dashboard.admin_label": "Admin",
    "admin.dashboard.add_place": "Add New Place",
    "admin.dashboard.all_places": "All Places",
    "admin.dashboard.welcome_back": "Welcome back,",
    "admin.dashboard.statistics": "Statistics",
    "admin.dashboard.total_places": "Total Places",
    
    // Map Filters
    "map.filter.radius": "Radius",
    "map.filter.radius_disabled": "Disabled",
    "map.filter.radius_default": "Default: 5 km",
    "map.filter.radius_km": "{radius} km",
    "map.filter.radius_enable": "Use radius filter",
    "map.filter.categories": "Categories",
    "map.filter.all_places": "All Places",
    "map.filter.categories_selected": "{count} categories selected",
    "map.filter.collections": "Collections",
    "map.filter.all_collections": "All collections",
    "map.filter.collections_selected": "{count} collections selected",
    "map.filter.clear_all": "Clear All",
    "map.filter.km": "km",
    "map.filter.places_will_show": "{count} places will be shown",
    "map.filter.title": "Filters",
    "map.filter.apply": "Apply",
    in_collections: "In Collections",
    
    // Weather
    "weather.now": "Now",
    
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
    
    // Add Place Screen
    "add_place.error_name_required": "Please enter a name",
    "add_place.error_category_required": "Please select a category",
    "add_place.error_address_required": "Please enter an address",
    "add_place.error_location_required": "Please select a location on the map",
    "add_place.success_updated": "Place updated successfully",
    "add_place.success_added": "Place added successfully",
    "add_place.error_update_failed": "Failed to update place",
    "add_place.error_add_failed": "Failed to add place",
    "add_place.permission_title": "Permission",
    "add_place.permission_message": "Location permission is required",
    "add_place.error_load_failed": "Failed to load place",
    "add_place.camera_permission_title": "Permission",
    "add_place.camera_permission_message": "Camera roll permission is required",
    "add_place.error_pick_image": "Failed to pick image",
    "add_place.edit_place": "Edit Place",
    "add_place.update": "Update",
    
    // Category Screen
    "category.error_firebase_index": "Firebase index required. Please create index in Firebase Console.",
    "category.error_load_failed": "Failed to load places: {message}",
  },
};

export const useI18n = create<I18nStore>((set, get) => ({
  language: "tr",
  
  setLanguage: async (lang: Language) => {
    set({ language: lang });
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  },
  
  t: (key: string, params?: Record<string, string | number>) => {
    const { language } = get();
    let translation = translations[language][key] || key;
    
    // Simple interpolation: replace {param} with params[param]
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const value = String(params[paramKey]);
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value);
      });
    }
    
    return translation;
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

