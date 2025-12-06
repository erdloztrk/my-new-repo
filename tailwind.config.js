/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        background: {
          DEFAULT: "#F8F9FA",
          dark: "#1A1B26",
        },
        foreground: {
          DEFAULT: "#11181C",
          dark: "#ECEDEE",
        },
        card: {
          DEFAULT: "#FFFFFF",
          dark: "#242538",
        },
        "card-foreground": {
          DEFAULT: "#11181C",
          dark: "#ECEDEE",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          dark: "#2E303C",
        },
        "muted-foreground": {
          DEFAULT: "#64748B",
          dark: "#94A3B8",
        },
        border: {
          DEFAULT: "#E2E8F0",
          dark: "#2E303C",
        },
        primary: {
          DEFAULT: "#6C63FF",
          foreground: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};


