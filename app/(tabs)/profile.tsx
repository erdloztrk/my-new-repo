import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/stores/theme-store";

const MENU_ITEMS = [
  { id: "1", title: "Hesap Ayarları", icon: "settings-outline" as const },
  { id: "2", title: "Bildirimler", icon: "notifications-outline" as const },
  { id: "3", title: "Yardım & Destek", icon: "help-circle-outline" as const },
  { id: "4", title: "Hakkında", icon: "information-circle-outline" as const },
];

interface SocialButtonProps {
  provider: "google" | "facebook" | "apple";
  onPress: () => void;
}

function SocialButton({ provider, onPress }: SocialButtonProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const config = {
    google: {
      icon: "logo-google" as const,
      label: "Google ile Giriş Yap",
      bgClass: isDark ? "bg-card-dark border border-border-dark" : "bg-card border border-border",
      textColor: isDark ? "#ECEDEE" : "#11181C",
      iconColor: "#4285F4",
    },
    facebook: {
      icon: "logo-facebook" as const,
      label: "Facebook ile Giriş Yap",
      bgClass: "bg-[#1877F2]",
      textColor: "#FFFFFF",
      iconColor: "#FFFFFF",
    },
    apple: {
      icon: "logo-apple" as const,
      label: "Apple ile Giriş Yap",
      bgClass: isDark ? "bg-card-dark border border-border-dark" : "bg-black",
      textColor: isDark ? "#ECEDEE" : "#FFFFFF",
      iconColor: isDark ? "#ECEDEE" : "#FFFFFF",
    },
  };

  const { icon, label, bgClass, textColor, iconColor } = config[provider];

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-center px-6 py-3.5 rounded-xl ${bgClass} active:opacity-80`}
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={{ color: textColor }} className="ml-3 font-semibold">{label}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { colorScheme, themeMode, setThemeMode } = useTheme();
  const isDark = colorScheme === "dark";

  const THEME_OPTIONS: { mode: "system" | "light" | "dark"; label: string; description: string }[] = [
    { mode: "system", label: "Sistem", description: "Cihaz ayarını kullan" },
    { mode: "light", label: "Açık", description: "Her zaman açık tema" },
    { mode: "dark", label: "Koyu", description: "Her zaman koyu tema" },
  ];

  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      "Yakında!",
      `${provider} ile giriş özelliği yakında aktif olacak.`,
      [{ text: "Tamam" }]
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
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View className={`px-6 pt-4 pb-6 border-b ${isDark ? "border-border-dark bg-card-dark" : "border-border bg-card"}`}>
          <Text className={`text-2xl font-bold ${isDark ? "text-foreground-dark" : "text-foreground"}`}>
            Profil
          </Text>
        </View>

        {/* Profile Card */}
        <View className="px-6 py-6">
          <View className={`rounded-2xl p-6 shadow-sm border items-center ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-4 ${isDark ? "bg-muted-dark" : "bg-muted"}`}>
              <Ionicons
                name="person"
                size={40}
                color={isDark ? "#94A3B8" : "#64748B"}
              />
            </View>
            <Text className={`text-xl font-bold mb-1 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
              Misafir Kullanıcı
            </Text>
            <Text className={`text-sm mb-6 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
              Giriş yap veya kayıt ol
            </Text>

            {/* Social Login Buttons */}
            <View className="w-full gap-3">
              <SocialButton
                provider="google"
                onPress={() => handleSocialLogin("Google")}
              />
              <SocialButton
                provider="facebook"
                onPress={() => handleSocialLogin("Facebook")}
              />
              <SocialButton
                provider="apple"
                onPress={() => handleSocialLogin("Apple")}
              />
            </View>

            {/* Divider */}
            <View className="flex-row items-center w-full my-5">
              <View className={`flex-1 h-px ${isDark ? "bg-border-dark" : "bg-border"}`} />
              <Text className={`mx-4 text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>veya</Text>
              <View className={`flex-1 h-px ${isDark ? "bg-border-dark" : "bg-border"}`} />
            </View>

            {/* Email Login Button */}
            <Pressable
              onPress={() => handleSocialLogin("E-posta")}
              className="w-full bg-primary py-3.5 rounded-xl active:opacity-80"
            >
              <Text className="text-white font-semibold text-center">
                E-posta ile Giriş Yap
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Settings Section */}
        <View className="px-6 mb-6">
          <View className={`rounded-2xl shadow-sm border overflow-hidden ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
            {/* Theme selector */}
            <View className={`px-5 py-4 border-b ${isDark ? "border-border-dark" : "border-border"}`}>
              <Text className={`text-base font-semibold mb-3 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                Tema
              </Text>
              <View className="gap-2">
                {THEME_OPTIONS.map((option) => {
                  const selected = themeMode === option.mode;
                  return (
                    <Pressable
                      key={option.mode}
                      onPress={() => setThemeMode(option.mode)}
                      className={`flex-row items-center justify-between px-4 py-3 rounded-xl border ${
                        selected
                          ? "border-primary bg-primary/10"
                          : isDark ? "border-border-dark bg-transparent" : "border-border bg-transparent"
                      }`}
                    >
                      <View className="flex-1">
                        <Text className={`text-base font-semibold ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                          {option.label}
                        </Text>
                        <Text className={`text-sm mt-1 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
                          {option.description}
                        </Text>
                      </View>
                      <Ionicons
                        name={selected ? "radio-button-on" : "radio-button-off"}
                        size={22}
                        color={selected ? "#6C63FF" : (isDark ? "#94A3B8" : "#64748B")}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Other Menu Items */}
            {MENU_ITEMS.map((item, index) => (
              <Pressable
                key={item.id}
                className={`flex-row items-center px-5 py-4 ${
                  index < MENU_ITEMS.length - 1
                    ? isDark ? "border-b border-border-dark" : "border-b border-border"
                    : ""
                }`}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
                <Text className={`flex-1 ml-4 text-base ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
                  {item.title}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Version */}
        <View className="items-center py-8">
          <Text className={`text-sm ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            LOKAL v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
