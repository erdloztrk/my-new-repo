import { useState } from "react";
import { View, Text, Pressable, Animated, LayoutAnimation, Platform, UIManager } from "react-native";
import { CaretDown, CaretUp } from "phosphor-react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FilterAccordionProps {
  title: string;
  summary?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isDark: boolean;
}

export function FilterAccordion({
  title,
  summary,
  isExpanded,
  onToggle,
  children,
  isDark,
}: FilterAccordionProps) {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View
      style={{
        backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        borderRadius: 12,
        marginBottom: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isDark ? "#2E303C" : "#E2E8F0",
      }}
    >
      <Pressable
        onPress={handleToggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: 52, // Touch target size
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#ECEDEE" : "#11181C",
              marginBottom: summary ? 2 : 0,
            }}
          >
            {title}
          </Text>
          {summary && (
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#94A3B8" : "#64748B",
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {summary}
            </Text>
          )}
        </View>
        {isExpanded ? (
          <CaretUp size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
        ) : (
          <CaretDown size={20} color={isDark ? "#94A3B8" : "#64748B"} weight="regular" />
        )}
      </Pressable>

      {isExpanded && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            paddingTop: 4,
            borderTopWidth: 1,
            borderTopColor: isDark ? "#2E303C" : "#E2E8F0",
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}

