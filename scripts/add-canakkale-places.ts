import { addPlace } from "../services/places-service";
import type { Category } from "../types/category";

interface PlaceData {
  name: string;
  category: Category;
  description: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const places: PlaceData[] = [
  // Yeme & İçme
  {
    name: "ENN Fast Food",
    category: "fast_food",
    description: "Gece geç saatlere kadar açık olan, hamburger ve hızlı atıştırmalıklarıyla meşhur mekan.",
    address: "Barbaros Mah. Levent Sk. 16/A, Çanakkale",
    coordinates: { latitude: 40.134261, longitude: 26.407456 },
  },
  {
    name: "Sevgi Sokak Lezzetleri",
    category: "street_food",
    description: "Yerel halkın favorisi olan, samimi ve lezzetli sokak atıştırmalıkları sunan bir durak.",
    address: "Cevat Paşa, Efe Sk. No:10, Çanakkale",
    coordinates: { latitude: 40.155540, longitude: 26.414538 },
  },
  {
    name: "Heredot Kahve",
    category: "coffee_shops",
    description: "Çanakkale'nin tarihi dokusu içinde, özel kahve çeşitleri ve atmosferiyle öne çıkan bir mekan.",
    address: "Kemalpaşa, Kemalyeri Sk. 40/B, Çanakkale",
    coordinates: { latitude: 40.148684, longitude: 26.402439 },
  },
  {
    name: "Salt Cafe",
    category: "brunch_places",
    description: "Hem kahve hem de zengin kahvaltı/brunch seçenekleriyle popüler, modern bir kafe.",
    address: "Cevatpaşa, Fevzi Renda Sk. No: 4B, Çanakkale",
    coordinates: { latitude: 40.154723, longitude: 26.412050 },
  },
  {
    name: "17 Burda AVM Yemek Alanı",
    category: "food_courts",
    description: "Birçok restoran markasını bir arada bulabileceğiniz şehrin en geniş yeme-içme alanı.",
    address: "Barbaros, Atatürk Cd. No:207, Çanakkale",
    coordinates: { latitude: 40.123525, longitude: 26.410381 },
  },
  
  // Eğlence & Gece Hayatı
  {
    name: "MacLeren's Doors",
    category: "pubs",
    description: "Tematik dekorasyonu ve geniş içecek menüsüyle şehrin en popüler publarından.",
    address: "Kemalpaşa, Dibek Sk. No:10, Çanakkale",
    coordinates: { latitude: 40.148913, longitude: 26.403175 },
  },
  {
    name: "Gametimexplus & Gtbowling",
    category: "bowling",
    description: "Bowling, bilardo ve arcade oyunlarının bulunduğu kapsamlı bir eğlence merkezi.",
    address: "Barbaros, Atatürk Cd. No:207 (17 Burda içi), Çanakkale",
    coordinates: { latitude: 40.123316, longitude: 26.410409 },
  },
  {
    name: "Labirend Kaçış Evi",
    category: "escape_rooms",
    description: "Arkadaş grupları için korku ve gizem temalı kaçış oyunları sunan macera evi.",
    address: "Kemalpaşa, Eski Mahkeme Sk. No:21, Çanakkale",
    coordinates: { latitude: 40.148098, longitude: 26.401571 },
  },
  
  // Sanat & Kültür
  {
    name: "Çanakkale Belediyesi Kültür Merkezi",
    category: "cultural_centers",
    description: "Şehirdeki tiyatro oyunları, konserler ve büyük kültürel etkinliklerin merkezi.",
    address: "İsmetpaşa, Demircioğlu Cd. No:132, Çanakkale",
    coordinates: { latitude: 40.147852, longitude: 26.410065 },
  },
  {
    name: "Rino Sanat Deneysel Sanat Atölyesi",
    category: "workshops",
    description: "Seramik, resim ve deneysel sanat çalışmaları yapılan yaratıcı bir atölye.",
    address: "Esenler, Ahmet Piriştina Cd. No:33, Çanakkale",
    coordinates: { latitude: 40.163609, longitude: 26.428191 },
  },
  
  // Sinema & Eğlence
  {
    name: "Paribu Cineverse 17 Burda",
    category: "cinemas",
    description: "Şehirdeki en modern sinema kompleksi.",
    address: "Barbaros, Atatürk Cd. No:297, Çanakkale",
    coordinates: { latitude: 40.123098, longitude: 26.410438 },
  },
  
  // Etkinlik Mekanları
  {
    name: "ÇOMÜ İÇDAŞ Kongre Merkezi",
    category: "convention_centers",
    description: "Büyük ölçekli kongre, mezuniyet ve konserlere ev sahipliği yapan modern merkez.",
    address: "Barbaros, Çanakkale - İzmir Asfaltı No:78, Çanakkale",
    coordinates: { latitude: 40.124925, longitude: 26.420875 },
  },
  
  // Alışveriş
  {
    name: "Antika YokYok",
    category: "antique_stores",
    description: "Nadir bulunan parçalar ve nostaljik objeler satan dükkan.",
    address: "Kemalpaşa, Mersin Dede Sk. No:42, Çanakkale",
    coordinates: { latitude: 40.147029, longitude: 26.404434 },
  },
  {
    name: "Kağan Collection",
    category: "boutiques",
    description: "Kaliteli giyim ürünleri sunan şık bir butik mağaza.",
    address: "Kemalpaşa, Cumhuriyet Blv., Reşat Tabak İş Merkezi, Çanakkale",
    coordinates: { latitude: 40.149128, longitude: 26.403452 },
  },
  {
    name: "17 Burda AVM",
    category: "shopping_malls",
    description: "Şehrin en büyük alışveriş merkezi.",
    address: "Barbaros, Atatürk Cd. No:207, Çanakkale",
    coordinates: { latitude: 40.123525, longitude: 26.410381 },
  },
  
  // Yaşam & Dinlenme
  {
    name: "Artemis Spa",
    category: "spa_wellness",
    description: "Masaj, hamam ve rahatlama terapileri sunan spa merkezi.",
    address: "Cevat Paşa, Kaya Sk. No:52, Çanakkale",
    coordinates: { latitude: 40.155547, longitude: 26.410399 },
  },
  {
    name: "Çanakkale Mehmet Akif Ersoy İl Halk Kütüphanesi",
    category: "libraries",
    description: "Dijital göçebeler ve öğrenciler için uygun çalışma alanı.",
    address: "Barbaros, 100. Yıl Cd. NO:49, Çanakkale",
    coordinates: { latitude: 40.133336, longitude: 26.409553 },
  },
];

async function addAllPlaces() {
  console.log(`\n🚀 Adding ${places.length} Çanakkale places to Firebase...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    try {
      console.log(`[${i + 1}/${places.length}] Adding: ${place.name}`);
      const placeId = await addPlace({
        ...place,
        images: [],
        createdBy: "admin",
      });
      console.log(`✓ Successfully added: ${place.name} (ID: ${placeId})\n`);
      successCount++;
    } catch (error: any) {
      console.error(`✗ Failed to add: ${place.name}`);
      console.error(`  Error: ${error?.message || error}\n`);
      failCount++;
    }
    
    // Small delay to avoid rate limiting
    if (i < places.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  ✓ Successfully added: ${successCount}`);
  console.log(`  ✗ Failed: ${failCount}`);
  console.log(`  Total: ${places.length}\n`);
}

// Run if executed directly
if (require.main === module) {
  addAllPlaces()
    .then(() => {
      console.log("✅ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Fatal error:", error);
      process.exit(1);
    });
}

export { addAllPlaces, places };

