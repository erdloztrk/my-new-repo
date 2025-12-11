import React from "react";
import * as PhosphorIcons from "phosphor-react-native";

type PhosphorIconName = keyof typeof PhosphorIcons;

interface PhosphorIconProps {
  name: PhosphorIconName;
  size?: number;
  color?: string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
}

export function PhosphorIcon({ 
  name, 
  size = 24, 
  color = "currentColor",
  weight = "regular" 
}: PhosphorIconProps) {
  const IconComponent = PhosphorIcons[name];
  
  if (!IconComponent) {
    console.warn(`PhosphorIcon: Icon "${name}" not found`);
    return null;
  }
  
  return <IconComponent size={size} color={color} weight={weight} />;
}

