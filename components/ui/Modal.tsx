/**
 * Modal component - Inspired by heroui-native design language
 * Stateless, dark/light mode compatible, NativeWind-based
 */

import React from "react";
import { Modal as RNModal, View, Pressable, ViewStyle } from "react-native";
import { useTheme } from "@/stores/theme-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  showCloseButton?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function Modal({
  visible,
  onClose,
  children,
  size = "md",
  showCloseButton = false,
  className = "",
  style,
}: ModalProps) {
  const { colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    full: "w-full",
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={`
            ${sizeStyles[size]}
            w-full
            ${isDark ? "bg-card-dark" : "bg-card"}
            rounded-t-3xl
            ${className}
          `}
          style={[
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 16,
            },
            style,
          ]}
        >
          {showCloseButton && (
            <Pressable
              onPress={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 items-center justify-center rounded-full bg-muted"
            >
              {/* Close icon would go here - using X from phosphor */}
            </Pressable>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

