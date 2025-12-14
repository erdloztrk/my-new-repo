import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_WUXzTEBaZHRtR3cUd8mM-HFe6xSy25Y",
  authDomain: "lokal-app-bf19b.firebaseapp.com",
  projectId: "lokal-app-bf19b",
  storageBucket: "lokal-app-bf19b.firebasestorage.app",
  messagingSenderId: "355279159426",
  appId: "1:355279159426:web:8a75c148b51b42c9b7749b",
  measurementId: "G-WXCKJJQLPQ",
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

