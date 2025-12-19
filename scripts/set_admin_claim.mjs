import admin from "firebase-admin";
import fs from "node:fs";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS env set etmelisin (service account json path).");
  process.exit(1);
}

const uid = process.argv[2];
if (!uid) {
  console.error("Kullanım: node scripts/set_admin_claim.mjs <UID>");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

await admin.auth().setCustomUserClaims(uid, { admin: true });

const user = await admin.auth().getUser(uid);
console.log("✅ Claim basıldı:", uid);
console.log("customClaims:", user.customClaims);
