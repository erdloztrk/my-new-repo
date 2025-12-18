import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAdminStore } from "@/stores/admin-store";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";

export default function AdminLoginScreen() {
  const { colorScheme } = useTheme();
  const { t } = useI18n();
  const isDark = colorScheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, isLoading, isAdmin } = useAdminStore();

  useEffect(() => {
    if (isAdmin) {
      router.replace("/(admin)/dashboard");
    }
  }, [isAdmin]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t("error"), t("admin.login.error_empty_fields"));
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace("/(admin)/dashboard");
    } catch (error: any) {
      Alert.alert(t("admin.login.error_failed"), error.message || t("admin.login.error_invalid_credentials"));
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}>
      <View className="flex-1 justify-center px-6">
        <Text
          className={`text-3xl font-bold mb-2 ${
            isDark ? "text-card-foreground-dark" : "text-card-foreground"
          }`}
        >
          {t("admin.login.title")}
        </Text>
        <Text
          className={`text-base mb-8 ${
            isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
          }`}
        >
          {t("admin.login.subtitle")}
        </Text>

        <TextInput
          placeholder={t("admin.login.email_placeholder")}
          placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className={`border p-4 rounded-xl mb-4 ${
            isDark
              ? "bg-card-dark border-border-dark text-card-foreground-dark"
              : "bg-card border-border text-card-foreground"
          }`}
        />

        <TextInput
          placeholder={t("admin.login.password_placeholder")}
          placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className={`border p-4 rounded-xl mb-6 ${
            isDark
              ? "bg-card-dark border-border-dark text-card-foreground-dark"
              : "bg-card border-border text-card-foreground"
          }`}
        />

        <Pressable
          onPress={handleLogin}
          disabled={isLoading}
          className={`p-4 rounded-xl ${
            isLoading ? "bg-muted" : isDark ? "bg-blue-600" : "bg-blue-500"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">{t("admin.login.button")}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}


