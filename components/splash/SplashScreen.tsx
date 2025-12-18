/**
 * Splash Screen Component
 * Shows "Lokal" text with letter-by-letter drop animation
 */

import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useTheme } from "@/stores/theme-store";

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const TEXT = "Lokal";
const ANIMATION_DURATION = 300; // ms per letter
const STAGGER_DELAY = 100; // ms delay between letters

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  
  // Create animated values for each letter
  const letterAnimations = useRef(
    TEXT.split("").map(() => ({
      translateY: new Animated.Value(-100),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Animate each letter with stagger
    const animations = letterAnimations.map((anim, index) => {
      return Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          delay: index * STAGGER_DELAY,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          delay: index * STAGGER_DELAY,
          useNativeDriver: true,
        }),
      ]);
    });

    // Start all animations
    Animated.parallel(animations).start(() => {
      // Wait a bit after animation completes, then call onAnimationComplete
      setTimeout(() => {
        onAnimationComplete();
      }, 500);
    });
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0F172A" : "#FFFFFF" },
      ]}
    >
      <View style={styles.textContainer}>
        {TEXT.split("").map((letter, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.letter,
              {
                color: isDark ? "#ECEDEE" : "#11181C",
                transform: [{ translateY: letterAnimations[index].translateY }],
                opacity: letterAnimations[index].opacity,
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  letter: {
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: 4,
  },
});

