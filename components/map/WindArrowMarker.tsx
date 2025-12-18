import React, { useEffect, useRef } from "react";
import { Marker } from "react-native-maps";
import { View, StyleSheet } from "react-native";
import { Animated } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { CurrentWeather } from "@/components/weather/weatherTypes";

interface WindArrowMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  weather: CurrentWeather | null;
  arrowColor?: string;
  isDark?: boolean;
}

/**
 * Wind Arrow Marker - single, thin, long arrow
 */
export function WindArrowMarker({
  coordinate,
  weather,
  arrowColor = "#3B82F6",
  isDark = false,
}: WindArrowMarkerProps & { isDark?: boolean }) {
  if (!weather || weather.wind_deg === undefined) {
    return null;
  }
  
  const windDeg = weather.wind_deg;

  const arrowSize = 28; // thin & long

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      zIndex={1000}
    >
      <View style={styles.container}>
        <Svg width={arrowSize} height={arrowSize * 2} viewBox="0 0 24 48" style={{ transform: [{ rotate: `${windDeg}deg` }] }}>
          <Path
            d="M12 2 L12 40 M6 28 L12 40 L18 28"
            stroke={arrowColor}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});
