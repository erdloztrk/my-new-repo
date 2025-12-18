import { Pressable, View, Animated } from "react-native";
import { Sun, Moon } from "phosphor-react-native";
import { useTheme } from "@/stores/theme-store";
import { useEffect, useRef } from "react";

interface ThemeToggleProps {
  size?: number;
}

export function ThemeToggle({ size = 20 }: ThemeToggleProps) {
  const { colorScheme, toggleTheme } = useTheme();
  const isDark = colorScheme === "dark";
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [isDark]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    toggleTheme();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"
        } border`}
      >
        {isDark ? (
          <Sun size={size} color="#FFD700" weight="fill" />
        ) : (
          <Moon size={size} color="#6C63FF" weight="fill" />
        )}
      </Animated.View>
    </Pressable>
  );
}

