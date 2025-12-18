/**
 * Button component - Inspired by heroui-native design language
 * Stateless, dark/light mode compatible, NativeWind-based
 */

import React from "react";
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@/stores/theme-store";

export interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  className = "",
  style,
  textStyle,
}: ButtonProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-6 py-4",
  };

  const textSizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  // Variant styles
  const variantStyles = {
    primary: isDark
      ? "bg-primary border-primary"
      : "bg-primary border-primary",
    secondary: isDark
      ? "bg-muted-dark border-muted-dark"
      : "bg-muted border-muted",
    outline: isDark
      ? "bg-transparent border-border-dark"
      : "bg-transparent border-border",
    ghost: "bg-transparent border-transparent",
    danger: isDark
      ? "bg-red-600 border-red-600"
      : "bg-red-500 border-red-500",
  };

  const textVariantStyles = {
    primary: isDark ? "text-white" : "text-white",
    secondary: isDark ? "text-foreground-dark" : "text-foreground",
    outline: isDark ? "text-foreground-dark" : "text-foreground",
    ghost: isDark ? "text-foreground-dark" : "text-foreground",
    danger: "text-white",
  };

  // Helper to get actual color string for ActivityIndicator
  const getSpinnerColor = (variant: string): string => {
    switch (variant) {
      case "primary":
      case "danger":
        return "#FFFFFF"; // white
      case "secondary":
      case "outline":
      case "ghost":
        return isDark ? "#ECEDEE" : "#11181C"; // foreground colors
      default:
        return "#FFFFFF";
    }
  };

  const baseClasses = `
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${fullWidth ? "w-full" : ""}
    rounded-xl
    border
    items-center
    justify-center
    flex-row
    ${isDisabled || isLoading ? "opacity-50" : ""}
  `;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled || isLoading}
      className={`${baseClasses} ${className}`}
      style={[
        {
          shadowColor: variant === "primary" ? "#6C63FF" : "#000",
          shadowOffset: { width: 0, height: variant === "primary" ? 4 : 2 },
          shadowOpacity: variant === "primary" ? 0.2 : 0.1,
          shadowRadius: variant === "primary" ? 8 : 4,
          elevation: variant === "primary" ? 4 : 2,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={getSpinnerColor(variant)}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Text
        className={`${textSizeStyles[size]} font-semibold ${textVariantStyles[variant]}`}
        style={textStyle}
      >
        {children}
      </Text>
    </Pressable>
  );
}

