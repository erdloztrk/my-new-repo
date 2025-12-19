#!/usr/bin/env node
/**
 * Verification script to check Firebase Auth React Native persistence setup
 * 
 * This script verifies:
 * 1. @react-native-async-storage/async-storage is installed
 * 2. services/firebase.ts uses initializeAuth with React Native persistence
 * 3. No direct getAuth() calls exist (except in fallback)
 * 4. Auth instance is properly exported
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Check 1: Verify AsyncStorage package is installed
console.log("✓ Checking @react-native-async-storage/async-storage installation...");
const packageJsonPath = path.join(projectRoot, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const hasAsyncStorage = 
  (packageJson.dependencies && "@react-native-async-storage/async-storage" in packageJson.dependencies) ||
  (packageJson.devDependencies && "@react-native-async-storage/async-storage" in packageJson.devDependencies);

if (!hasAsyncStorage) {
  console.error("❌ @react-native-async-storage/async-storage is not installed!");
  process.exit(1);
}
console.log("  ✓ Package found:", packageJson.dependencies["@react-native-async-storage/async-storage"] || 
  packageJson.devDependencies["@react-native-async-storage/async-storage"]);

// Check 2: Verify firebase.ts uses initializeAuth
console.log("\n✓ Checking services/firebase.ts...");
const firebaseTsPath = path.join(projectRoot, "services", "firebase.ts");
const firebaseTsContent = fs.readFileSync(firebaseTsPath, "utf8");

const checks = {
  hasInitializeAuth: firebaseTsContent.includes("initializeAuth"),
  hasGetReactNativePersistence: firebaseTsContent.includes("getReactNativePersistence"),
  hasAsyncStorageImport: firebaseTsContent.includes('from "@react-native-async-storage/async-storage"'),
  hasAuthExport: firebaseTsContent.includes("export { auth }") || firebaseTsContent.includes("export const auth"),
  noDirectGetAuth: !firebaseTsContent.match(/export\s+const\s+auth.*=\s*getAuth\(/),
  hasFallbackGetAuth: firebaseTsContent.includes('error.code === "auth/already-initialized"') && 
                      firebaseTsContent.includes("getAuth(app)"),
};

let allPassed = true;
for (const [check, passed] of Object.entries(checks)) {
  if (passed) {
    console.log(`  ✓ ${check.replace(/([A-Z])/g, " $1").toLowerCase()}`);
  } else {
    console.error(`  ❌ ${check.replace(/([A-Z])/g, " $1").toLowerCase()}`);
    allPassed = false;
  }
}

// Check 3: Verify no other getAuth() calls in codebase (except in firebase.ts fallback)
console.log("\n✓ Checking for other getAuth() calls...");
const srcFiles = [];
function findTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      findTsFiles(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      srcFiles.push(fullPath);
    }
  }
}

findTsFiles(path.join(projectRoot, "services"));
findTsFiles(path.join(projectRoot, "stores"));
findTsFiles(path.join(projectRoot, "app"));

let foundOtherGetAuth = false;
for (const file of srcFiles) {
  const content = fs.readFileSync(file, "utf8");
  // Check for getAuth() calls that aren't in firebase.ts or aren't the fallback pattern
  if (file !== firebaseTsPath && content.includes("getAuth(")) {
    console.error(`  ❌ Found getAuth() in ${path.relative(projectRoot, file)}`);
    foundOtherGetAuth = true;
  }
}

if (foundOtherGetAuth) {
  allPassed = false;
} else {
  console.log("  ✓ No other getAuth() calls found");
}

// Final result
console.log("\n" + "=".repeat(50));
if (allPassed) {
  console.log("✅ All checks passed! Firebase Auth persistence is correctly configured.");
  console.log("\nTo verify the warning is gone:");
  console.log("1. Run: npm start");
  console.log("2. Check console for Firebase Auth persistence warnings");
  console.log("3. Warning should be gone: 'Using an unsupported persistence method'");
} else {
  console.error("❌ Some checks failed. Please review the errors above.");
  process.exit(1);
}

