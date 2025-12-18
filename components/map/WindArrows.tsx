/**
 * Wind Arrows component for displaying wind vectors on the map.
 * Creates a grid of animated wind arrows based on current wind data.
 */

import React, { useMemo } from "react";
import { Marker } from "react-native-maps";
import { View, StyleSheet } from "react-native";
import { Animated } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { CurrentWeather } from "@/components/weather/weatherTypes";

interface WindArrowsProps {
  weather: CurrentWeather | null;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  enabled: boolean;
  gridSize?: number; // Number of arrows per side (default: 8 = 8x8 grid = 64 arrows)
  minSpeed?: number; // Minimum wind speed to show arrow (m/s)
  arrowColor?: string;
  selectedWindPoint?: { latitude: number; longitude: number } | null;
}

interface WindVector {
  lat: number;
  lon: number;
  speed: number; // m/s
  bearing: number; // degrees (0° = North, clockwise)
}

/**
 * Arrow icon component with rotation and animation.
 * Simplified version that definitely renders.
 */
function ArrowIcon({
  bearing,
  speed,
  color,
  baseSize,
}: {
  bearing: number;
  speed: number;
  color: string;
  baseSize: number;
}) {
  // Scale arrow size by speed (min 24px, max 56px) - larger for visibility
  const size = Math.min(56, Math.max(24, baseSize + speed * 80));
  
  // Animation for wind movement (pulsing effect)
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    // Pulse animation - faster for higher wind speeds
    const duration = Math.max(500, 1800 - speed * 200);
    
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();
    return () => pulse.stop();
  }, [speed, pulseAnim]);
  
  return (
    <View
      style={{
        width: size + 10,
        height: size + 10,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
      }}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [
            { rotate: `${bearing}deg` },
            { scale: pulseAnim },
          ],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 24 24">
          {/* Arrow - thicker and more visible */}
          <Path
            d="M12 1 L12 20 M5 12 L12 20 L19 12"
            stroke={color}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Generate wind vectors for a grid covering the map region.
 */
function generateWindGrid(
  weather: CurrentWeather | null,
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  gridSize: number
): WindVector[] {
  if (!weather || !weather.wind_deg) {
    return [];
  }
  
  const windSpeed = weather.wind_speed || 0; // m/s
  const windDeg = weather.wind_deg; // degrees (0° = North, clockwise)
  
  // Convert wind direction to bearing (same as wind_deg)
  const bearing = windDeg;
  
  // Calculate grid step
  const latStep = region.latitudeDelta / (gridSize + 1);
  const lonStep = region.longitudeDelta / (gridSize + 1);
  
  // Start from top-left corner
  const startLat = region.latitude + region.latitudeDelta / 2 - (gridSize / 2) * latStep;
  const startLon = region.longitude - region.longitudeDelta / 2 + (gridSize / 2) * lonStep;
  
  const vectors: WindVector[] = [];
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = startLat - i * latStep;
      const lon = startLon + j * lonStep;
      
      vectors.push({
        lat,
        lon,
        speed: windSpeed,
        bearing,
      });
    }
  }
  
  return vectors;
}

/**
 * Wind Arrows component for map display.
 * 
 * Creates a grid of animated wind arrows covering the visible map region.
 */
export function WindArrows({
  weather,
  region,
  enabled,
  gridSize = 8,
  minSpeed = 0.1, // Default: show arrows for wind speed >= 0.1 m/s (lowered for visibility)
  arrowColor = "#3B82F6", // Default: blue-500 (more visible)
  selectedWindPoint = null,
}: WindArrowsProps) {
  // Generate wind vectors for a single point (if selected) or grid (fallback)
  const vectors = useMemo(() => {
    if (!enabled) {
      console.log("[WindArrows] Not enabled");
      return [];
    }
    
    if (!weather) {
      console.log("[WindArrows] No weather data");
      return [];
    }
    
    if (!region) {
      console.log("[WindArrows] No region data");
      return [];
    }
    
    // Check if wind data is available - be more lenient
    const hasWindData = weather.wind_deg !== undefined || weather.wind_speed !== undefined;
    
    if (!hasWindData) {
      console.log("[WindArrows] No wind data in weather:", weather);
      return [];
    }
    
    // Use default values if missing
    const windSpeed = weather.wind_speed || 2; // Default 2 m/s if missing
    const windDeg = weather.wind_deg || 0; // Default 0° (North) if missing
    
    console.log("[WindArrows] Wind data:", { windSpeed, windDeg });
    
    // If user tapped a specific point, render only that point
    if (selectedWindPoint) {
      return [
        {
          lat: selectedWindPoint.latitude,
          lon: selectedWindPoint.longitude,
          speed: windSpeed,
          bearing: windDeg,
        },
      ];
    }

    // Otherwise, fallback to grid (legacy)
    const grid = generateWindGrid(
      { ...weather, wind_speed: windSpeed, wind_deg: windDeg },
      region,
      gridSize
    );

    const filtered = grid.filter((v) => v.speed >= minSpeed);
    console.log("[WindArrows] Generated vectors:", filtered.length);

    return filtered;
  }, [enabled, weather, region, gridSize, minSpeed, selectedWindPoint]);
  
  // Debug log - more detailed
  React.useEffect(() => {
    console.log("=== [WindArrows] Debug ===");
    console.log("Enabled:", enabled);
    console.log("Weather:", weather);
    console.log("Region:", region);
    console.log("Vectors count:", vectors.length);
    if (vectors.length > 0) {
      console.log("First 3 vectors:", vectors.slice(0, 3));
    }
    console.log("========================");
  }, [enabled, weather, region, vectors]);
  
  if (!enabled) {
    console.log("[WindArrows] Component disabled, returning null");
    return null;
  }
  
  if (vectors.length === 0) {
    console.log("[WindArrows] No vectors to render");
    return null;
  }
  
  console.log("[WindArrows] Rendering", vectors.length, "markers");
  
  // Disable test mode; render actual arrows
  const TEST_MODE = false;
  
  return (
    <>
      {vectors.map((vector, idx) => {
        // Use a simpler key for better reconciliation
        const key = `wind-${idx}-${Math.round(vector.lat * 10000)}-${Math.round(vector.lon * 10000)}`;
        
        return (
          <Marker
            key={key}
            coordinate={{ lat: vector.lat, lon: vector.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={1000}
            flat={false}
          >
            {TEST_MODE ? (
              // TEST: Simple red box to verify markers render
              <View
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: "red",
                  borderRadius: 15,
                  borderWidth: 2,
                  borderColor: "white",
                }}
              />
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "transparent",
                }}
              >
                <ArrowIcon
                  bearing={vector.bearing}
                  speed={vector.speed}
                  color={arrowColor}
                  baseSize={28}
                />
              </View>
            )}
          </Marker>
        );
      })}
    </>
  );
}


