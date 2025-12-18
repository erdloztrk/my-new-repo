import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/stores/theme-store";

interface EmptyStateProps {
  icon: React.ReactNode; // Icon component or emoji
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className={`rounded-3xl p-8 shadow-sm border items-center max-w-xs ${isDark ? "bg-card-dark border-border-dark" : "bg-card border-border"}`}>
        {/* Icon Container */}
        <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isDark ? "bg-primary-dark/20" : "bg-primary/20"}`}>
          {typeof icon === "string" ? (
            <Text className="text-4xl">{icon}</Text>
          ) : (
            icon
          )}
        </View>

        {/* Title */}
        <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-card-foreground-dark" : "text-card-foreground"}`}>
          {title}
        </Text>

        {/* Description */}
        {description && (
          <Text className={`text-base text-center leading-6 mb-6 ${isDark ? "text-muted-foreground-dark" : "text-muted-foreground"}`}>
            {description}
          </Text>
        )}

        {/* Action Button */}
        {actionLabel && onAction && (
          <Pressable
            onPress={onAction}
            className={`px-6 py-3 rounded-full ${isDark ? "bg-primary-dark" : "bg-primary"}`}
          >
            <Text className="text-white font-semibold">{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

