import { signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { logError, logDebug } from "@/lib/logger";

export interface AdminUser {
  uid: string;
  email: string;
  role: "admin" | "user";
}

/**
 * Admin olarak giriş yap
 */
export async function loginAsAdmin(email: string, password: string): Promise<AdminUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error("User not found in database");
    }

    const userData = userDoc.data();
    if (userData?.role !== "admin") {
      await signOut(auth);
      throw new Error("Access denied. Admin privileges required.");
    }

    logDebug(`[AuthService] Admin logged in: ${user.email}`);

    return {
      uid: user.uid,
      email: user.email || "",
      role: userData.role,
    };
  } catch (error: any) {
    logError("[AuthService] Login error:", error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth);
    logDebug("[AuthService] User logged out");
  } catch (error) {
    logError("[AuthService] Logout error:", error);
    throw error;
  }
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}


