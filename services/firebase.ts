import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

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

// Initialize Auth (default persistence handled by Firebase Web SDK)
export const auth: Auth = getAuth(app);

export default app;

