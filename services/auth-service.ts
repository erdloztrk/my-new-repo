import { signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { logError, logDebug } from "@/lib/logger";

export interface AdminUser {
  uid: string;
  email: string;
}

/**
 * Check if user has admin claim in their token
 */
export async function checkAdminClaim(user: User): Promise<boolean> {
  try {
    const tokenResult = await user.getIdTokenResult(true);
    const isAdmin = tokenResult.claims.admin === true;
    
    if (__DEV__) {
      logDebug("[AuthService] token claims:", tokenResult.claims);
      logDebug("[AuthService] isAdmin(claim):", isAdmin);
    }
    
    return isAdmin;
  } catch (error) {
    logError("[AuthService] Error checking admin claim:", error);
    return false;
  }
}

/**
 * Admin olarak giriş yap (custom claim kontrolü ile)
 */
export async function loginAsAdmin(email: string, password: string): Promise<AdminUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check admin claim from token
    const isAdmin = await checkAdminClaim(user);
    if (!isAdmin) {
      await signOut(auth);
      throw new Error("Access denied. Admin privileges required.");
    }

    logDebug(`[AuthService] Admin logged in: ${user.email}`);

    return {
      uid: user.uid,
      email: user.email || "",
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

/**
 * Check admin status for current user (uses custom claims)
 */
export async function getAdminStatus(user: User | null): Promise<boolean> {
  if (!user) {
    return false;
  }
  return await checkAdminClaim(user);
}


