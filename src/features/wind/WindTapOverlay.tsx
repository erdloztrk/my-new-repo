/**
 * WindTapOverlay - Skia-based canvas overlay for rendering wind particle animations.
 * Renders particle trails with fading alpha based on wind speed.
 */

import React, { useEffect, useRef, useState } from "react";
import { View, Dimensions } from "react-native";
import { Canvas, Path, Skia, useValue, useFrameCallback } from "@shopify/react-native-skia";
import { ParticleEmitter, Particle } from "./ParticleEmitter";
import { VectorField } from "./VectorField";
import { lonLatToScreen, mercatorToLonLat } from "./projection";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface WindTapOverlayProps {
  enabled: boolean;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  tappedPoint: { latitude: number; longitude: number } | null;
  vectorField: VectorField | null;
  screenWidth: number;
  screenHeight: number;
  isDark: boolean;
}

export function WindTapOverlay({
  enabled,
  region,
  tappedPoint,
  vectorField,
  screenWidth,
  screenHeight,
  isDark,
}: WindTapOverlayProps) {
  const emitterRef = useRef<ParticleEmitter | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const opacity = useValue(0);
  const frameCountRef = useRef(0);

  // Initialize emitter when tapped point changes
  useEffect(() => {
    if (!enabled || !tappedPoint || !vectorField) {
      emitterRef.current = null;
      setParticles([]);
      opacity.current = 0;
      return;
    }

    // Calculate adaptive particle count based on zoom level
    const zoomLevel = Math.log2(360 / region.longitudeDelta);
    const particleCount = Math.min(120, Math.max(40, Math.floor(zoomLevel * 10)));

    // Create new emitter
    const emitter = new ParticleEmitter({
      originLat: tappedPoint.latitude,
      originLon: tappedPoint.longitude,
      vectorField,
      maxAge: 120, // 2 seconds at 60fps
      trailLength: 6,
      particleCount,
      jitterRadius: 0.0005, // Small jitter in Mercator units
      speedMultiplier: 0.8, // Slow down animation for visibility
      dt: 1 / 60, // 60fps
    });

    emitterRef.current = emitter;
    frameCountRef.current = 0;

    // Fade in
    opacity.current = 1;

    // Cleanup after animation duration
    const timeout = setTimeout(() => {
      opacity.current = 0;
      setTimeout(() => {
        emitterRef.current = null;
        setParticles([]);
      }, 300); // Wait for fade-out
    }, 1500); // 1.5 second animation

    return () => {
      clearTimeout(timeout);
      if (emitterRef.current) {
        emitterRef.current.stop();
      }
    };
  }, [enabled, tappedPoint, vectorField, region.longitudeDelta]);

  // Animation frame callback
  useFrameCallback(() => {
    if (!emitterRef.current || !vectorField) {
      return;
    }

    const emitter = emitterRef.current;
    const isActive = emitter.update();
    
    if (isActive) {
      setParticles(emitter.getParticles());
    } else {
      setParticles([]);
      emitterRef.current = null;
    }
  });

  if (!enabled || !tappedPoint || !vectorField || particles.length === 0) {
    return null;
  }

  // Determine color based on theme
  const particleColor = isDark ? "#60A5FA" : "#3B82F6"; // blue-400 / blue-500

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <Canvas
        style={{
          width: screenWidth,
          height: screenHeight,
        }}
      >
        {particles.map((particle, idx) => {
          if (particle.trail.length < 2) {
            return null;
          }

          // Convert trail from Mercator to screen coordinates
          const screenTrail = particle.trail.map((point) => {
            const { lat, lon } = mercatorToLonLat(point.x, point.y);
            return lonLatToScreen(lat, lon, region, screenWidth, screenHeight);
          });

          // Create path from trail
          const path = Skia.Path.Make();
          path.moveTo(screenTrail[0].sx, screenTrail[0].sy);
          for (let i = 1; i < screenTrail.length; i++) {
            path.lineTo(screenTrail[i].sx, screenTrail[i].sy);
          }

          // Calculate alpha based on age and wind speed
          const ageRatio = particle.age / 120; // Normalize to 0..1
          
          // Sample wind speed at current particle position for accurate speed
          const { lat, lon } = mercatorToLonLat(particle.x, particle.y);
          const wind = vectorField.sample(lat, lon);
          const windSpeed = vectorField.speed(wind.u, wind.v);
          
          const speedAlpha = Math.min(1, windSpeed / 10); // Normalize speed to 0..1 (10 m/s = max)
          
          // Fade out as particle ages, fade in based on speed
          const baseAlpha = (1 - ageRatio) * speedAlpha;
          const alpha = Math.max(0.1, Math.min(0.8, baseAlpha * opacity.current));

          return (
            <Path
              key={`particle-${idx}`}
              path={path}
              color={particleColor}
              style="stroke"
              strokeWidth={Math.max(1, Math.min(3, windSpeed / 5))}
              opacity={alpha}
            />
          );
        })}
      </Canvas>
    </View>
  );
}

