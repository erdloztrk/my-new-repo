import { Pressable, View, Text } from "react-native";
import { Sun, Moon } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";

interface ThemeToggleProps {
  size?: number;
  showLabel?: boolean;
}

export function ThemeToggle({ size = 24, showLabel = false }: ThemeToggleProps) {
  const { colorScheme, toggleTheme } = useTheme();
  const isDark = colorScheme === "dark";

  return (
    <Pressable
      onPress={toggleTheme}
      className="flex-row items-center active:opacity-70"
    >
      <View className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center">
        {isDark ? (
          <Sun size={size} color="#FFD700" weight="fill" />
        ) : (
          <Moon size={size} color="#6C63FF" weight="fill" />
        )}
      </View>
      {showLabel && (
        <View className="ml-2">
          <Text className="text-sm font-medium text-foreground">
            {isDark ? "Açık Tema" : "Koyu Tema"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

