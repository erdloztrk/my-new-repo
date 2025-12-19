import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, collection, setLogLevel } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectId = `demo-local-${Date.now()}`;
const rulesPath = path.resolve(__dirname, "../firestore.rules");
const rules = fs.readFileSync(rulesPath, "utf8");

setLogLevel("silent");

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: { host: "127.0.0.1", port: 8080, rules },
});

const userA = testEnv.authenticatedContext("userA");
const userB = testEnv.authenticatedContext("userB");
const admin = testEnv.authenticatedContext("adminUser", { admin: true });

const dbA = userA.firestore();
const dbB = userB.firestore();
const dbAdmin = admin.firestore();

console.log("1) userA own users/userA create (no role) => SUCCEED");
await assertSucceeds(setDoc(doc(dbA, "users/userA"), { uid: "userA", displayName: "A" }));

console.log("2) userA try set role => FAIL");
await assertFails(setDoc(doc(dbA, "users/userA"), { uid: "userA", displayName: "A", role: "admin" }));

console.log("3) userA GET users/userB => FAIL");
await assertFails(getDoc(doc(dbA, "users/userB")));

console.log("4) userA LIST users => FAIL");
await assertFails(getDocs(collection(dbA, "users")));

console.log("5) admin can set users/userB with role => SUCCEED");
await assertSucceeds(setDoc(doc(dbAdmin, "users/userB"), { uid: "userB", displayName: "B", role: "admin" }));

console.log("6) userB create review with createdAt <= now => SUCCEED");
await assertSucceeds(setDoc(doc(dbB, "reviews/rev1"), {
  userId: "userB",
  rating: 5,
  createdAt: Timestamp.fromMillis(Date.now() - 1000),
}));

console.log("7) userB create review with future createdAt => FAIL");
await assertFails(setDoc(doc(dbB, "reviews/rev2"), {
  userId: "userB",
  rating: 5,
  createdAt: Timestamp.fromMillis(Date.now() + 60000),
}));

console.log("\n✅ Smoke test OK");
await testEnv.cleanup();

