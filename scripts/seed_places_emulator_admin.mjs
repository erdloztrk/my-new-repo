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
const now = admin.firestore.Timestamp.now();

const seed = JSON.parse(fs.readFileSync("scripts/places_seed.json", "utf8"));
const places = seed.places || [];

let written = 0;
for (const p of places) {
  await db.collection("places").doc(p.id).set(
    { ...p, createdAt: now },
    { merge: true }
  );
  written++;
}

console.log("SEED_OK written=" + written + " emulator=" + process.env.FIRESTORE_EMULATOR_HOST + " projectId=" + projectId);
