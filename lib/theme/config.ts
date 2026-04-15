/**
 * @file lib/theme/config.ts
 * 
 * DESIGN SYSTEM CONFIGURATION
 * 
 * This file defines the light theme tokens for Marlon.
 * These tokens are the single source of truth for all design values.
 * 
 * IMPORTANT: Do not use hardcoded colors in components.
 * Always import and use tokens from this file or from design-tokens.ts
 */

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

/**
 * Light theme - Primary theme for Marlon
 * 
 * Design tokens derived from context/design/DESIGN_SYSTEM.md
 * 
 * System color scale:
 * - 50: Page background
 * - 100: Card backgrounds, secondary surfaces
 * - 200: Borders, dividers
 * - 300: Placeholder text, disabled states
 * - 400: Secondary text
 * - 500: Tertiary text, icons
 * - 600: Body text
 * - 700: Headings, primary text
 * - 800: Emphasis
 * - 900: Primary brand
 */
export const lightTheme: Theme = {
  name: "light",
  colors: {
    background: "#FAFAFA",
    foreground: "#404040",
    primary: "#0070F3",
    primaryForeground: "#ffffff",
    secondary: "#F5F5F5",
    secondaryForeground: "#525252",
    muted: "#F5F5F5",
    mutedForeground: "#737373",
    accent: "#F5F5F5",
    accentForeground: "#525252",
    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",
    border: "#E5E5E5",
    input: "#E5E5E5",
    ring: "#0070F3",
    success: "#34C759",
    warning: "#FF9500",
    info: "#5AC8FA",
    card: "#FFFFFF",
    cardForeground: "#171717",
    popover: "#FFFFFF",
    popoverForeground: "#171717",
  },
  spacing: {
    xs: "0.25rem",  // 4px
    sm: "0.5rem",   // 8px
    md: "1rem",     // 16px
    lg: "1.5rem",   // 24px
    xl: "2rem",     // 32px
    "2xl": "3rem",  // 48px
    "3xl": "4rem",  // 64px
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    fontFamilyArabic: '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
    fontSize: {
      xs: "0.75rem",    // 12px
      sm: "0.875rem",   // 14px
      base: "1rem",     // 16px
      lg: "1.125rem",   // 18px
      xl: "1.25rem",    // 20px
      "2xl": "1.5rem",  // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
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
    sm: "0.375rem",  // 6px
    md: "0.625rem",  // 10px
    lg: "1rem",      // 16px
    xl: "1.25rem",   // 20px
    "2xl": "1.5rem", // 24px
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
};

// Export only light theme (no dark mode in Marlon)
export const themes = {
  light: lightTheme,
} as const;

export type ThemeName = keyof typeof themes;

/**
 * Get a theme by name
 * @param name - Theme name (only 'light' available)
 * @returns Theme configuration object
 */
export function getTheme(name: ThemeName): Theme {
  return themes[name];
}

// ===========================================
// CSS Variable exports for globals.css
// ===========================================
// These should be used in globals.css to set CSS custom properties

export const cssVariables = {
  // Core colors
  "--background": lightTheme.colors.background,
  "--foreground": lightTheme.colors.foreground,
  "--primary": lightTheme.colors.primary,
  "--primary-foreground": lightTheme.colors.primaryForeground,
  "--secondary": lightTheme.colors.secondary,
  "--secondary-foreground": lightTheme.colors.secondaryForeground,
  "--muted": lightTheme.colors.muted,
  "--muted-foreground": lightTheme.colors.mutedForeground,
  "--accent": lightTheme.colors.accent,
  "--accent-foreground": lightTheme.colors.accentForeground,
  "--destructive": lightTheme.colors.destructive,
  "--destructive-foreground": lightTheme.colors.destructiveForeground,
  "--border": lightTheme.colors.border,
  "--input": lightTheme.colors.input,
  "--ring": lightTheme.colors.ring,
  "--success": lightTheme.colors.success,
  "--warning": lightTheme.colors.warning,
  "--info": lightTheme.colors.info,
  "--card": lightTheme.colors.card,
  "--card-foreground": lightTheme.colors.cardForeground,
  "--popover": lightTheme.colors.popover,
  "--popover-foreground": lightTheme.colors.popoverForeground,
  
  // System colors (for flexible use)
  "--system-50": "#fafafa",
  "--system-100": "#f5f5f5",
  "--system-200": "#e5e5e5",
  "--system-300": "#a3a3a3",
  "--system-400": "#737373",
  "--system-500": "#525252",
  "--system-600": "#404040",
  "--system-700": "#171717",
  "--system-800": "#0a0a0a",
  "--system-900": "#000000",
  
  // Spacing
  "--spacing-xs": lightTheme.spacing.xs,
  "--spacing-sm": lightTheme.spacing.sm,
  "--spacing-md": lightTheme.spacing.md,
  "--spacing-lg": lightTheme.spacing.lg,
  "--spacing-xl": lightTheme.spacing.xl,
  "--spacing-2xl": lightTheme.spacing["2xl"],
  "--spacing-3xl": lightTheme.spacing["3xl"],
  
  // Radius
  "--radius-none": lightTheme.radius.none,
  "--radius-sm": lightTheme.radius.sm,
  "--radius-md": lightTheme.radius.md,
  "--radius-lg": lightTheme.radius.lg,
  "--radius-xl": lightTheme.radius.xl,
  "--radius-2xl": lightTheme.radius["2xl"],
  "--radius-full": lightTheme.radius.full,
  
  // Shadows
  "--shadow-sm": lightTheme.shadows.sm,
  "--shadow-md": lightTheme.shadows.md,
  "--shadow-lg": lightTheme.shadows.lg,
  "--shadow-xl": lightTheme.shadows.xl,
  
  // Typography
  "--font-sans": lightTheme.typography.fontFamily,
  "--font-arabic": lightTheme.typography.fontFamilyArabic,
};
