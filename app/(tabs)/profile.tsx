import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Envelope, RadioButton } from "phosphor-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";

type UserRole = "local" | "unlocal" | "business" | null;

export default function ProfileScreen() {
  const { colorScheme, themeMode, setThemeMode } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const isDark = colorScheme === "dark";
  const [userRole, setUserRole] = useState<UserRole>(null);

  const THEME_OPTIONS: { mode: "system" | "light" | "dark"; labelKey: string }[] = [
    { mode: "system", labelKey: "system" },
    { mode: "light", labelKey: "light" },
    { mode: "dark", labelKey: "dark" },
  ];

  const LANGUAGE_OPTIONS: { code: "tr" | "en"; label: string; nativeLabel: string }[] = [
    { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
    { code: "en", label: "English", nativeLabel: "English" },
  ];

  const USER_ROLES: { role: UserRole; label: string; description: string }[] = [
    {
      role: "local",
      label: "Local Kullanıcı",
      description: "Bulunduğun şehirde hizmet veren kullanıcılar",
    },
    {
      role: "unlocal",
      label: "Ziyaretçi / Unlocal Kullanıcı",
      description: "Sadece keşfetmek isteyen kullanıcılar",
    },
    {
      role: "business",
      label: "Business Kullanıcı",
      description: "İşletme sahipleri ve profesyoneller",
    },
  ];

  const handleLogin = (method: string) => {
    Alert.alert(
      t("coming_soon"),
      `${method} ${t("coming_soon_message")}`,
      [{ text: t("ok") }]
    );
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-background-dark" : "bg-background"}`}
      edges={["top"]}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View className={`px-6 pt-6 pb-4`}>
          <Text className={`text-3xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("profile")}
          </Text>
        </View>

        {/* Profile Card */}
        <View className="px-6 mb-6">
          <View
            className={`rounded-2xl p-8 shadow-sm border items-center ${
              isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Avatar */}
            <View
              className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
                isDark ? "bg-muted-dark" : "bg-muted"
              }`}
            >
              <User size={36} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
            </View>

            {/* User Status */}
            <Text
              className={`text-xl font-bold mb-2 ${
                isDark ? "text-card-foreground-dark" : "text-card-foreground"
              }`}
            >
              {t("guest_user")}
            </Text>
            <Text
              className={`text-sm text-center ${
                isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
              }`}
            >
              {t("login_or_signup")}
            </Text>
          </View>
        </View>

        {/* User Role Selection Card */}
        <View className="px-6 mb-6">
          <View
            className={`rounded-2xl p-6 shadow-sm border ${
              isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className={`text-lg font-bold ${
                  isDark ? "text-card-foreground-dark" : "text-card-foreground"
                }`}
              >
                Kullanıcı Türü
              </Text>
              {!userRole && (
                <Text
                  className={`text-xs ${
                    isDark ? "text-orange-400" : "text-orange-600"
                  } font-medium`}
                >
                  * Zorunlu
                </Text>
              )}
            </View>

            <View className="gap-3">
              {USER_ROLES.map((roleOption) => {
                const selected = userRole === roleOption.role;
                return (
                  <Pressable
                    key={roleOption.role}
                    onPress={() => setUserRole(roleOption.role)}
                    className={`flex-row items-center justify-between px-4 py-4 rounded-xl border ${
                      selected
                        ? "border-primary bg-primary/10"
                        : isDark
                        ? "border-border-dark bg-transparent"
                        : "border-border bg-transparent"
                    } active:opacity-70`}
                    style={{
                      minHeight: 56, // Touch target
                    }}
                  >
                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold ${
                          isDark ? "text-card-foreground-dark" : "text-card-foreground"
                        }`}
                      >
                        {roleOption.label}
                      </Text>
                      <Text
                        className={`text-sm mt-1 ${
                          isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                        }`}
                      >
                        {roleOption.description}
                      </Text>
                    </View>
                    <RadioButton
                      size={22}
                      color={selected ? "#6C63FF" : isDark ? "#94A3B8" : "#64748B"}
                      weight={selected ? "fill" : "regular"}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Login Methods Card - Shown for all roles */}
        {userRole && (
          <View className="px-6 mb-6">
            <View
              className={`rounded-2xl p-6 shadow-sm border ${
                isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                className={`text-lg font-bold mb-4 ${
                  isDark ? "text-card-foreground-dark" : "text-card-foreground"
                }`}
              >
                Giriş Yöntemleri
              </Text>

              <View className="gap-3">
                {/* Google Login */}
                <Pressable
                  onPress={() => handleLogin("Google")}
                  className={`flex-row items-center justify-center px-6 py-4 rounded-xl border ${
                    isDark
                      ? "bg-card-dark border-border-dark"
                      : "bg-card border-border"
                  } active:opacity-80`}
                  style={{ minHeight: 52 }}
                >
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text
                    className={`ml-3 font-semibold ${
                      isDark ? "text-card-foreground-dark" : "text-card-foreground"
                    }`}
                  >
                    Google ile Giriş
                  </Text>
                </Pressable>

                {/* Apple Login */}
                <Pressable
                  onPress={() => handleLogin("Apple")}
                  className={`flex-row items-center justify-center px-6 py-4 rounded-xl ${
                    isDark ? "bg-black border border-border-dark" : "bg-black"
                  } active:opacity-80`}
                  style={{ minHeight: 52 }}
                >
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text className="ml-3 font-semibold text-white">Apple ile Giriş</Text>
                </Pressable>

                {/* Facebook Login */}
                <Pressable
                  onPress={() => handleLogin("Facebook")}
                  className="flex-row items-center justify-center px-6 py-4 rounded-xl bg-[#1877F2] active:opacity-80"
                  style={{ minHeight: 52 }}
                >
                  <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
                  <Text className="ml-3 font-semibold text-white">Facebook ile Giriş</Text>
                </Pressable>

                {/* Email Login */}
                <Pressable
                  onPress={() => handleLogin("E-posta")}
                  className={`flex-row items-center justify-center px-6 py-4 rounded-xl ${
                    isDark ? "bg-muted-dark" : "bg-muted"
                  } active:opacity-80`}
                  style={{ minHeight: 52 }}
                >
                  <Envelope size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
                  <Text
                    className={`ml-3 font-semibold ${
                      isDark ? "text-card-foreground-dark" : "text-card-foreground"
                    }`}
                  >
                    E-posta ile Giriş
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Theme Settings Card */}
        <View className="px-6 mb-6">
          <View
            className={`rounded-2xl p-6 shadow-sm border ${
              isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-card-foreground-dark" : "text-card-foreground"
              }`}
            >
              Tema
            </Text>

            <View className="gap-3">
              {THEME_OPTIONS.map((option) => {
                const selected = themeMode === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => setThemeMode(option.mode)}
                    className={`flex-row items-center justify-between px-4 py-4 rounded-xl border ${
                      selected
                        ? "border-primary bg-primary/10"
                        : isDark
                        ? "border-border-dark bg-transparent"
                        : "border-border bg-transparent"
                    } active:opacity-70`}
                    style={{
                      minHeight: 56, // Touch target
                    }}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        isDark ? "text-card-foreground-dark" : "text-card-foreground"
                      }`}
                    >
                      {t(option.labelKey)}
                    </Text>
                    <RadioButton
                      size={22}
                      color={selected ? "#6C63FF" : isDark ? "#94A3B8" : "#64748B"}
                      weight={selected ? "fill" : "regular"}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Language Settings Card */}
        <View className="px-6 mb-6">
          <View
            className={`rounded-2xl p-6 shadow-sm border ${
              isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-card-foreground-dark" : "text-card-foreground"
              }`}
            >
              Dil
            </Text>

            <View className="gap-3">
              {LANGUAGE_OPTIONS.map((option) => {
                const selected = language === option.code;
                return (
                  <Pressable
                    key={option.code}
                    onPress={() => setLanguage(option.code)}
                    className={`flex-row items-center justify-between px-4 py-4 rounded-xl border ${
                      selected
                        ? "border-primary bg-primary/10"
                        : isDark
                        ? "border-border-dark bg-transparent"
                        : "border-border bg-transparent"
                    } active:opacity-70`}
                    style={{
                      minHeight: 56, // Touch target
                    }}
                  >
                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold ${
                          isDark ? "text-card-foreground-dark" : "text-card-foreground"
                        }`}
                      >
                        {option.nativeLabel}
                      </Text>
                      <Text
                        className={`text-sm mt-1 ${
                          isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </View>
                    <RadioButton
                      size={22}
                      color={selected ? "#6C63FF" : isDark ? "#94A3B8" : "#64748B"}
                      weight={selected ? "fill" : "regular"}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Version */}
        <View className="items-center py-4">
          <Text className={`text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            LOKAL v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
