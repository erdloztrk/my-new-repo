import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  colorScheme: "light" | "dark"; // effective color scheme
  themeMode: ThemeMode; // user preference
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@lokal_theme_mode";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [colorScheme, setColorScheme] = useState<"light" | "dark">(
    systemColorScheme === "dark" ? "dark" : "light"
  );
  const [hydrated, setHydrated] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") {
          setThemeModeState(stored);
        } else {
          setThemeModeState("system");
        }
      } catch {
        setThemeModeState("system");
      } finally {
        setHydrated(true);
      }
    };
    loadPreference();
  }, []);

  // Update effective color scheme based on mode and system preference
  useEffect(() => {
    const effective =
      themeMode === "system"
        ? systemColorScheme === "dark"
          ? "dark"
          : "light"
        : themeMode;
    setColorScheme(effective);
  }, [themeMode, systemColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore persistence errors
    }
  };

  const toggleTheme = async () => {
    if (themeMode === "system") {
      await setThemeMode(systemColorScheme === "dark" ? "light" : "dark");
    } else if (themeMode === "light") {
      await setThemeMode("dark");
    } else {
      await setThemeMode("light");
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        themeMode,
        setThemeMode,
        toggleTheme,
      }}
    >
      {/* Avoid flashing incorrect theme before hydration */}
      {hydrated ? children : null}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

