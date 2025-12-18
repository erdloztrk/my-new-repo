/**
 * Card component - Inspired by heroui-native design language
 * Stateless, dark/light mode compatible, NativeWind-based
 */

import React from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "@/stores/theme-store";

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "bordered" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  style,
}: CardProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const variantStyles = {
    default: isDark
      ? "bg-card-dark border-border-dark"
      : "bg-card border-border",
    bordered: isDark
      ? "bg-transparent border-border-dark"
      : "bg-transparent border-border",
    flat: isDark ? "bg-card-dark" : "bg-card",
  };

  const baseClasses = `
    rounded-2xl
    ${variantStyles[variant]}
    ${variant !== "flat" ? "border" : ""}
    ${paddingStyles[padding]}
    ${className}
  `;

  return (
    <View
      className={baseClasses}
      style={[
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.1 : 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

