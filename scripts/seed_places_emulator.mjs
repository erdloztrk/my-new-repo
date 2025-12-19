import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, Timestamp } from "firebase/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("❌ FIRESTORE_EMULATOR_HOST set değil. Bu script sadece emulator'a seed eder.");
  console.error("Kullanım: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed_places_emulator.mjs");
  process.exit(1);
}

const firebaseConfig = {
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-local",
  apiKey: "dummy",
  authDomain: "dummy",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = Timestamp.now();

const places = [
  { id: "seed-canakkale-1",  name: "Çanakkale Kordon",   description: "Deniz kenarı yürüyüş yolu", lat: 40.1553, lng: 26.4142, createdAt: now },
  { id: "seed-canakkale-2",  name: "Saat Kulesi",        description: "Merkezde tarihi saat kulesi", lat: 40.1557, lng: 26.4130, createdAt: now },
  { id: "seed-3",  name: "Troya Müzesi",       description: "Troya bölgesi müzesi", lat: 39.9576, lng: 26.2386, createdAt: now },
  { id: "seed-canakkale-4",  name: "Aynalı Çarşı",       description: "Tarihi çarşı", lat: 40.1539, lng: 26.4089, createdAt: now },
  { id: "seed-canakkale-5",  name: "57. Alay Şehitliği", description: "Gelibolu Tarihi Alan", lat: 40.2434, lng: 26.2801, createdAt: now },
  { id: "seed-canakkale-6",  name: "Anzak Koyu",         description: "Sahil alanı", lat: 40.2489, lng: 26.2818, createdAt: now },
  { id: "seed-canakkale-7",  name: "Conkbayırı",         description: "Panoramik tepe", lat: 40.2634, lng: 26.2896, createdAt: now },
  { id: "seed-canakkale-8",  name: "Kilitbahir Kalesi",  description: "Tarihi kale", lat: 40.1459, lng: 26.3850, createdAt: now },
  { id: "seed-canakkale-9",  name: "Bozcaada Merkez",    description: "Ada merkezi", lat: 39.8330, lng: 26.0706, createdAt: now },
  { id: "seed-canakkale-10", name: "Gökçeada Merkez",    description: "Ada merkezi", lat: 9097, createdAt: now },
];

const col = collection(db, "places");
let written = 0;

for (const p of places) {
  await setDoc(doc(col, p.id), p, { merge: true });
  written++;
}

console.log(`✅ Seed complete. Wrote/updated ${written} places into 'places' (emulator: ${process.env.FIRESTORE_EMULATOR_HOST})`);
