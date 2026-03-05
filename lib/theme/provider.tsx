"use client";

import { createContext, useContext, useLayoutEffect, useState, ReactNode, useEffect } from "react";
import { themes, ThemeName } from "./config";
import { useAuth, useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  colors: typeof themes.light.colors;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ThemeName {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("marlon-theme") as ThemeName | null;
  return stored || getSystemTheme();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch user theme preference from database
  const userData = useQuery(
    api.users.getUserByClerkId,
    isSignedIn && user ? { clerkId: user.id } : "skip"
  );
  
  // Update theme mutation
  const updateThemeMutation = useMutation(api.users.updateUserTheme);

  // Set initial theme based on user preference or fallback
  useEffect(() => {
    if (isSignedIn && userData) {
      // Priority: user's saved preference > system preference > light
      const userTheme = userData.theme as ThemeName;
      if (userTheme && (userTheme === "light" || userTheme === "dark")) {
        setThemeState(userTheme);
        localStorage.setItem("marlon-theme", userTheme);
      } else {
        const systemTheme = getSystemTheme();
        setThemeState(systemTheme);
        localStorage.setItem("marlon-theme", systemTheme);
      }
      setIsLoading(false);
    } else if (!isSignedIn) {
      // Not signed in, use localStorage or system preference
      const fallbackTheme = getInitialTheme();
      setThemeState(fallbackTheme);
      setIsLoading(false);
    }
  }, [isSignedIn, userData]);

  useLayoutEffect(() => {
    if (!isLoading) {
      applyTheme(theme);
    }
  }, [theme, isLoading]);

  const setTheme = async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem("marlon-theme", newTheme);
    applyTheme(newTheme);
    
    // Update database if user is signed in
    if (isSignedIn && user) {
      try {
        await updateThemeMutation({ clerkId: user.id, theme: newTheme });
      } catch (error) {
        console.error("Failed to update theme in database:", error);
      }
    }
  };

  const colors = themes[theme].colors;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

function applyTheme(themeName: ThemeName) {
  const root = document.documentElement;
  const theme = themes[themeName];

  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${kebabCase(key)}`, value);
  });
}

function kebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
