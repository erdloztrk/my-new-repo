import { create } from "zustand";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { loginAsAdmin, logout, getCurrentUser, onAuthStateChange } from "@/services/auth-service";
import { logError } from "@/lib/logger";

interface AdminStore {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set) => {
  // Auth state değişikliklerini dinle
  onAuthStateChange(async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const isAdmin = userDoc.exists() && userDoc.data()?.role === "admin";
        set({ user, isAdmin });
      } catch (error) {
        logError("[AdminStore] Error fetching user role:", error);
        set({ user: null, isAdmin: false });
      }
    } else {
      set({ user: null, isAdmin: false });
    }
  });

  return {
    user: null,
    isAdmin: false,
    isLoading: false,
    login: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        await loginAsAdmin(email, password);
        set({ isLoading: false });
      } catch (error) {
        logError("[AdminStore] Login error:", error);
        set({ isLoading: false });
        throw error;
      }
    },
    logout: async () => {
      try {
        await logout();
        set({ user: null, isAdmin: false });
      } catch (error) {
        logError("[AdminStore] Logout error:", error);
        throw error;
      }
    },
    checkAuth: async () => {
      const user = getCurrentUser();
      if (!user) {
        set({ user: null, isAdmin: false });
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const isAdmin = userDoc.exists() && userDoc.data()?.role === "admin";
        set({ user, isAdmin });
      } catch (error) {
        logError("[AdminStore] CheckAuth error:", error);
        set({ user: null, isAdmin: false });
      }
    },
  };
});


