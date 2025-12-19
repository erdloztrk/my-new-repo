import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";
import { initializeAuth, getAuth, getReactNativePersistence, Auth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { logDebug } from "@/lib/logger";

// Firebase configuration from environment variables
// IMPORTANT: These values are public (client-side), but should still be in env for:
// 1. Different configs per environment (dev/staging/prod)
// 2. Easy rotation without code changes
// 3. Security best practices
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyB_WUXzTEBaZHRtR3cUd8mM-HFe6xSy25Y",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "lokal-app-bf19b.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "lokal-app-bf19b",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "lokal-app-bf19b.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "355279159426",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:355279159426:web:8a75c148b51b42c9b7749b",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-WXCKJJQLPQ",
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Connect to Firestore Emulator (dev-only)
const useEmulator = process.env.EXPO_PUBLIC_USE_FIRESTORE_EMULATOR === "true";
if (useEmulator) {
  try {
    // Host priority: 1) env variable, 2) platform-specific defaults
    let host = process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST;
    
    if (!host) {
      // Use platform-specific defaults for emulators/simulators
      if (Platform.OS === "android") {
        host = "10.0.2.2"; // Android emulator
      } else if (Platform.OS === "ios") {
        host = "127.0.0.1"; // iOS simulator
      } else {
        // Physical device or other platform - require env variable
        console.warn(
          "[Firestore] EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST is required for physical devices or non-standard platforms. " +
          "Set it to your computer's IP address (e.g., 192.168.1.105). Skipping emulator connection."
        );
        // Don't connect to emulator
      }
    }
    
    if (host) {
      const port = 8080;
      connectFirestoreEmulator(db, host, port);
      logDebug(`[Firestore] emulator connected ${host}:8080`);
    }
  } catch (error: any) {
    // Emulator already connected (e.g., during hot reload)
    if (error.code !== "failed-precondition") {
      logDebug("[Firestore] emulator connection error:", error);
    }
  }
}

// Initialize Auth with React Native persistence
// Use initializeAuth for React Native, fallback to getAuth if already initialized
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: any) {
  // Auth already initialized (e.g., during hot reload), use existing instance
  if (error.code === "auth/already-initialized") {
    auth = getAuth(app);
  } else {
    throw error;
  }
}
export { auth };

export default app;

