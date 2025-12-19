import admin from "firebase-admin";
import fs from "node:fs";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIRESTORE_EMULATOR_HOST yok. Ornek: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080");
  process.exit(1);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS yok. Ornek: export GOOGLE_APPLICATION_CREDENTIALS=$HOME/secrets/lokal-app-admin.json");
  process.exit(1);
}

const projectId = process.env.GCLOUD_PROJECT || "lokal-app-bf19b";
const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId
});

const db = admin.firestore();

const snap = await db.collection("places").get();
let updated = 0;

for (const docSnap of snap.docs) {
  const d = docSnap.data();

  const hasCoords = !!d.coordinates && (typeof d.coordinates === "object");
  const hasLatLng = (typeof d.lat === "number") && (typeof d.lng === "number");

  if (!hasCoords && hasLatLng) {
    await docSnap.ref.set(
      {
        coordinates: new admin.firestore.GeoPoint(d.lat, d.lng),
        category: d.category ?? "seed"
      },
      { merge: true }
    );
    updated++;
  }
}

console.log("FIX_OK updated=" + updated + " total=" + snap.size);
