/**
 * Input component - Inspired by heroui-native design language
 * Stateless, dark/light mode compatible, NativeWind-based
 */

import React from "react";
import { TextInput, View, Text, TextInputProps, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@/stores/theme-store";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "bordered" | "underlined";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = "default",
  size = "md",
  fullWidth = true,
  containerClassName = "",
  inputClassName = "",
  containerStyle,
  inputStyle,
  ...textInputProps
}: InputProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-5 py-4 text-lg",
  };

  const variantStyles = {
    default: isDark
      ? "bg-muted-dark border-border-dark"
      : "bg-muted border-border",
    bordered: isDark
      ? "bg-transparent border-border-dark"
      : "bg-transparent border-border",
    underlined: isDark
      ? "bg-transparent border-b border-border-dark rounded-none"
      : "bg-transparent border-b border-border rounded-none",
  };

  const baseInputClasses = `
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${variant !== "underlined" ? "rounded-xl" : ""}
    border
    ${isDark ? "text-foreground-dark" : "text-foreground"}
    ${fullWidth ? "w-full" : ""}
    ${inputClassName}
  `;

  return (
    <View className={`${fullWidth ? "w-full" : ""} ${containerClassName}`} style={containerStyle}>
      {label && (
        <Text
          className={`text-sm font-semibold mb-2 ${
            isDark ? "text-foreground-dark" : "text-foreground"
          }`}
        >
          {label}
        </Text>
      )}
      <View className="flex-row items-center">
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className={baseInputClasses}
          placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
          style={inputStyle}
          {...textInputProps}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && (
        <Text className="text-sm text-red-500 mt-1">{error}</Text>
      )}
      {helperText && !error && (
        <Text
          className={`text-sm mt-1 ${
            isDark ? "text-muted-foreground-dark" : "text-muted-foreground"
          }`}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
}
