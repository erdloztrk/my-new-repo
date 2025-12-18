import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Envelope, RadioButton, Briefcase, MapPin } from "phosphor-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/theme-store";
import { useI18n } from "@/stores/i18n-store";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
// ViewModel
import { useProfileViewModel, type UserRole } from "@/viewmodels/profile/useProfileViewModel";
import { useAdminStore } from "@/stores/admin-store";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { colorScheme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const isDark = colorScheme === "dark";

  // ViewModel - Business logic extracted
  const { userRole, setUserRole, handleLogin } = useProfileViewModel();
  const { isAdmin } = useAdminStore();

  // Eğer kullanıcı admin ise, profil ekranına geldiğinde otomatik admin dashboard'a yönlendir
  React.useEffect(() => {
    if (isAdmin) {
      router.replace("/(admin)/dashboard");
    }
  }, [isAdmin]);

  const LANGUAGE_OPTIONS: { code: "tr" | "en"; label: string; nativeLabel: string }[] = [
    { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
    { code: "en", label: "English", nativeLabel: "English" },
  ];

  const USER_ROLES: { 
    role: UserRole; 
    labelKey: string; 
    descriptionKey: string;
    icon: React.ComponentType<any>;
    iconColor: string;
  }[] = [
    {
      role: "local",
      labelKey: "user_role.local",
      descriptionKey: "user_role.local_desc",
      icon: User,
      iconColor: "#6C63FF",
    },
    {
      role: "unlocal",
      labelKey: "user_role.unlocal",
      descriptionKey: "user_role.unlocal_desc",
      icon: MapPin,
      iconColor: "#10B981",
    },
    {
      role: "business",
      labelKey: "user_role.business",
      descriptionKey: "user_role.business_desc",
      icon: Briefcase,
      iconColor: "#F59E0B",
    },
  ];


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
        <View className={`px-6 pt-6 pb-4 flex-row items-center justify-between`}>
          <Text className={`text-3xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            {t("profile")}
          </Text>
          <ThemeToggle size={20} />
        </View>

        {/* Profile Card */}
        <View className="px-6 mb-6">
          <Card variant="default" padding="lg" className="items-center">
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
          </Card>
        </View>

        {/* User Role Selection Card */}
        <View className="px-6 mb-6">
          <Card variant="default" padding="md">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className={`text-lg font-bold ${
                  isDark ? "text-card-foreground-dark" : "text-card-foreground"
                }`}
              >
                {t("user_type")}
              </Text>
              {!userRole && (
                <Text
                  className={`text-xs ${
                    isDark ? "text-orange-400" : "text-orange-600"
                  } font-medium`}
                >
                  {t("required")}
                </Text>
              )}
            </View>

            {/* Horizontal Icon Cards */}
            <View className="flex-row gap-3">
              {USER_ROLES.map((roleOption) => {
                const selected = userRole === roleOption.role;
                const IconComponent = roleOption.icon;
                return (
                  <Pressable
                    key={roleOption.role}
                    onPress={() => setUserRole(roleOption.role)}
                    className={`flex-1 items-center justify-center py-4 px-3 rounded-xl border ${
                      selected
                        ? "border-primary bg-primary/10"
                        : isDark
                        ? "border-border-dark bg-transparent"
                        : "border-border bg-transparent"
                    } active:opacity-70`}
                    style={{
                      minHeight: 100,
                    }}
                  >
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                        selected
                          ? "bg-primary/20"
                          : isDark
                          ? "bg-muted-dark"
                          : "bg-muted"
                      }`}
                    >
                      <IconComponent
                        size={24}
                        color={selected ? roleOption.iconColor : (isDark ? "#94A3B8" : "#64748B")}
                        weight={selected ? "fill" : "regular"}
                      />
                    </View>
                    <Text
                      className={`text-xs font-semibold text-center ${
                        selected
                          ? isDark ? "text-card-foreground-dark" : "text-card-foreground"
                          : isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
                      }`}
                      numberOfLines={2}
                    >
                      {t(roleOption.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Login Methods Card - Shown for all roles */}
        {userRole && (
          <View className="px-6 mb-6">
            <Card variant="default" padding="md">
              <Text
                className={`text-lg font-bold mb-4 ${
                  isDark ? "text-card-foreground-dark" : "text-card-foreground"
                }`}
              >
                {t("login_methods")}
              </Text>

              {/* Horizontal Icon Cards - 4 in a row */}
              <View className="flex-row gap-2">
                {/* Google Login */}
                <Pressable
                  onPress={() => handleLogin("Google")}
                  className={`flex-1 items-center justify-center py-4 px-2 rounded-xl border ${
                    isDark
                      ? "bg-card-dark border-border-dark"
                      : "bg-muted border-border"
                  } active:opacity-80`}
                  style={{ minHeight: 100 }}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                      isDark ? "bg-muted-dark" : "bg-card"
                    }`}
                  >
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                  </View>
                  <Text
                    className={`text-xs font-semibold text-center ${
                      isDark ? "text-card-foreground-dark" : "text-card-foreground"
                    }`}
                    numberOfLines={2}
                  >
                    {t("login.google")}
                  </Text>
                </Pressable>

                {/* Apple Login */}
                <Pressable
                  onPress={() => handleLogin("Apple")}
                  className={`flex-1 items-center justify-center py-4 px-2 rounded-xl border ${
                    isDark
                      ? "bg-card-dark border-border-dark"
                      : "bg-muted border-border"
                  } active:opacity-80`}
                  style={{ minHeight: 100 }}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                      isDark ? "bg-muted-dark" : "bg-card"
                    }`}
                  >
                    <Ionicons name="logo-apple" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
                  </View>
                  <Text
                    className={`text-xs font-semibold text-center ${
                      isDark ? "text-card-foreground-dark" : "text-card-foreground"
                    }`}
                    numberOfLines={2}
                  >
                    {t("login.apple")}
                  </Text>
                </Pressable>

                {/* Facebook Login */}
                <Pressable
                  onPress={() => handleLogin("Facebook")}
                  className={`flex-1 items-center justify-center py-4 px-2 rounded-xl border ${
                    isDark
                      ? "bg-card-dark border-border-dark"
                      : "bg-muted border-border"
                  } active:opacity-80`}
                  style={{ minHeight: 100 }}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                      isDark ? "bg-muted-dark" : "bg-card"
                    }`}
                  >
                    <Ionicons name="logo-facebook" size={20} color={isDark ? "#94A3B8" : "#1877F2"} />
                  </View>
                  <Text
                    className={`text-xs font-semibold text-center ${
                      isDark ? "text-card-foreground-dark" : "text-card-foreground"
                    }`}
                    numberOfLines={2}
                  >
                    {t("login.facebook")}
                  </Text>
                </Pressable>

                {/* Email Login - use for admin login */}
                <Pressable
                  onPress={() => router.push("/(admin)/login")}
                  className={`flex-1 items-center justify-center py-4 px-2 rounded-xl border ${
                    isDark
                      ? "bg-card-dark border-border-dark"
                      : "bg-muted border-border"
                  } active:opacity-80`}
                  style={{ minHeight: 100 }}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${
                      isDark ? "bg-muted-dark" : "bg-card"
                    }`}
                  >
                    <Envelope size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
                  </View>
                  <Text
                    className={`text-xs font-semibold text-center ${
                      isDark ? "text-card-foreground-dark" : "text-card-foreground"
                    }`}
                    numberOfLines={2}
                  >
                    {t("login.email")}
                  </Text>
                </Pressable>
              </View>
            </Card>
          </View>
        )}

        {/* Admin Dashboard Entry - Only visible for admins */}
        {isAdmin && (
          <View className="px-6 mb-6">
            <Card variant="default" padding="md">
              <Pressable
                onPress={() => router.push("/(admin)/dashboard")}
                className={`py-4 px-4 rounded-xl flex-row items-center justify-center gap-3 ${
                  isDark ? "bg-blue-600" : "bg-blue-500"
                } active:opacity-80`}
              >
                <Text className="text-white text-center font-semibold text-base">
                  Admin Dashboard
                </Text>
              </Pressable>
            </Card>
          </View>
        )}

        {/* Language Settings Card */}
        <View className="px-6 mb-6">
          <Card variant="default" padding="md">
            <Text
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-card-foreground-dark" : "text-card-foreground"
              }`}
            >
              {t("language")}
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
          </Card>
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
