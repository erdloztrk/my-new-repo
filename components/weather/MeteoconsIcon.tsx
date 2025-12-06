import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import { weatherIcons, astronomicalIcons, moonPhaseIcons, miscIcons, beaufortIcons, uvIndexIcons } from "./weatherIcons";

interface MeteoconsIconProps {
  name?: string; // Icon name from maps
  xml?: string; // Direct SVG string
  size?: number;
  color?: string;
}

/**
 * Meteocons weather icon component
 * Renders SVG weather icons from the Meteocons library
 * Reference: https://github.com/basmilius/weather-icons
 */
export function MeteoconsIcon({
  name,
  xml,
  size = 64,
}: MeteoconsIconProps) {
  let svgContent: string;
  
  if (xml) {
    svgContent = xml;
  } else if (name) {
    // Try all icon maps
    svgContent = 
      weatherIcons[name] ||
      astronomicalIcons[name] ||
      moonPhaseIcons[name] ||
      miscIcons[name] ||
      weatherIcons["clear-day"];
  } else {
    svgContent = weatherIcons["clear-day"];
  }

  return (
    <View style={{ width: size, height: size }}>
      <SvgXml xml={svgContent} width={size} height={size} />
    </View>
  );
}
