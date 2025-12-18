/**
 * ViewModel hook for Profile screen.
 * Handles user role selection and login actions.
 */

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useI18n } from "@/stores/i18n-store";

export type UserRole = "local" | "unlocal" | "business" | null;

interface UseProfileViewModelResult {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  handleLogin: (method: string) => void;
}

export function useProfileViewModel(): UseProfileViewModelResult {
  const { t } = useI18n();
  const [userRole, setUserRole] = useState<UserRole>(null);

  const handleLogin = useCallback(
    (method: string) => {
      Alert.alert(t("coming_soon"), `${method} ${t("coming_soon_message")}`, [
        { text: t("ok") },
      ]);
    },
    [t]
  );

  return {
    userRole,
    setUserRole,
    handleLogin,
  };
}

