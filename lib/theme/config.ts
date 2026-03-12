export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  warning: string;
  info: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyArabic: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface ThemeRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  full: string;
}

export interface ThemeShadow {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  radius: ThemeRadius;
  shadows: ThemeShadow;
}

export const lightTheme: Theme = {
  name: "light",
  colors: {
    background: "#ffffff",
    foreground: "#000000",
    primary: "#000000",
    primaryForeground: "#ffffff",
    secondary: "#f8f8f8",
    secondaryForeground: "#000000",
    muted: "#f8f8f8",
    mutedForeground: "#666666",
    accent: "#000000",
    accentForeground: "#ffffff",
    destructive: "#ff0000",
    destructiveForeground: "#ffffff",
    border: "#e0e0e0",
    input: "#e0e0e0",
    ring: "#000000",
    success: "#008000",
    warning: "#ff8c00",
    info: "#0000ff",
    card: "#ffffff",
    cardForeground: "#000000",
    popover: "#ffffff",
    popoverForeground: "#000000",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
  },
  typography: {
    fontFamily: '"DM Sans", "IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
    fontFamilyArabic: '"IBM Plex Sans Arabic", "Noto Sans Arabic", "DM Sans", system-ui, sans-serif',
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },
  radius: {
    none: "0",
    sm: "0.125rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px",
  },
  shadows: {
    sm: "none",
    md: "none",
    lg: "none",
    xl: "none",
  },
};

export const darkTheme: Theme = {
  name: "dark",
  colors: {
    background: "#000000",
    foreground: "#ffffff",
    primary: "#ffffff",
    primaryForeground: "#000000",
    secondary: "#1a1a1a",
    secondaryForeground: "#ffffff",
    muted: "#1a1a1a",
    mutedForeground: "#999999",
    accent: "#ffffff",
    accentForeground: "#000000",
    destructive: "#ff4444",
    destructiveForeground: "#ffffff",
    border: "#333333",
    input: "#333333",
    ring: "#ffffff",
    success: "#00cc00",
    warning: "#ffaa00",
    info: "#4444ff",
    card: "#000000",
    cardForeground: "#ffffff",
    popover: "#000000",
    popoverForeground: "#ffffff",
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  radius: lightTheme.radius,
  shadows: {
    sm: "none",
    md: "none",
    lg: "none",
    xl: "none",
  },
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeName = keyof typeof themes;
