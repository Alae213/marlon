/**
 * @file lib/theme/design-tokens.ts
 * 
 * DESIGN TOKENS - TypeScript Exports
 * 
 * Single source of truth for design values.
 * Use these tokens in components instead of hardcoded values.
 * 
 * Based on: context/design/DESIGN_SYSTEM.md
 */

import { cssVariables } from "./config";

// ===========================================
// COLOR TOKENS
// ===========================================

/** Primary brand color - Apple systemBlue */
export const colors = {
  primary: "#0070F3",
  primaryForeground: "#FFFFFF",
} as const;

/** Gray scale - Apple systemGray equivalents */
export const system = {
 50: "#FAFAFA",
 100: "#F5F5F5",
 200: "#E5E5E5",
 300: "#A3A3A3",
 400: "#737373",
 500: "#525252",
 600: "#404040",
 700: "#171717",
 800: "#0A0A0A",
 900: "#000000",
} as const;

/** Semantic colors - Apple system colors */
export const semantic = {
  success: "#34C759",
  successBg: "#34C7591A",
  warning: "#FF9500",
  warningBg: "#FF95001A",
  error: "#FF3B30",
  errorBg: "#FF3B301A",
  info: "#5AC8FA",
  infoBg: "#5AC8FA1A",
} as const;

/** Legacy status colors (keep hardcoded in components) */
export const status = {
  success: "#1BC57D",
  warning: "#FA9A34",
  error: "#F44055",
} as const;

/** Brand color */
export const brand = {
  green: "#00853F",
} as const;

// ===========================================
// TYPOGRAPHY TOKENS
// ===========================================

export const typography = {
  fontFamily: {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
    arabic: '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    caption: "0.75rem",    // 12px
    bodySm: "0.875rem",   // 14px
    body: "1rem",         // 16px - MOST USED
    headingSm: "1.125rem", // 18px
    heading: "1.25rem",   // 20px
    modal: "1.5rem",       // 24px
    page: "2.25rem",       // 36px
  },
  lineHeight: {
    caption: "1rem",           // 16px
    bodySm: "1.25rem",         // 20px
    body: "1.5rem",            // 24px
    headingSm: "1.333rem",     // 24px
    heading: "1.4rem",         // 28px
    modal: "1.333rem",         // 32px
    page: "1.222rem",          // 44px
  },
  letterSpacing: {
    tight: "-0.03em",
    snug: "-0.02em",
    normal: "0",
    wide: "0.025em",
  },
} as const;

// ===========================================
// SPACING TOKENS
// ===========================================

export const spacing = {
  xs: "0.25rem",   // 4px
  sm: "0.5rem",    // 8px
  md: "1rem",      // 16px - MOST USED
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
  "2xl": "3rem",   // 48px
  "3xl": "4rem",   // 64px
} as const;

// ===========================================
// RADIUS TOKENS
// ===========================================

export const radius = {
  none: "0",
  sm: "0.375rem",  // 6px
  md: "0.625rem",  // 10px
  lg: "1rem",      // 16px
  xl: "1.25rem",   // 20px
  "2xl": "1.5rem", // 24px
  full: "9999px",
} as const;

// ===========================================
// SHADOW TOKENS
// ===========================================

export const shadows = {
  sm: "0 1px 2px rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

// ===========================================
// CSS VARIABLES (for inline styles)
// ===========================================

/** Export CSS variables for dynamic styling */
export const cssVar = {
  colors: {
    primary: "var(--color-primary)",
    primaryForeground: "var(--color-primary-foreground)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    error: "var(--color-error)",
    info: "var(--color-info)",
    destructive: "var(--destructive)",
  },
  system: {
    50: "var(--system-50)",
    100: "var(--system-100)",
    200: "var(--system-200)",
    300: "var(--system-300)",
    400: "var(--system-400)",
    500: "var(--system-500)",
    600: "var(--system-600)",
    700: "var(--system-700)",
    800: "var(--system-800)",
    900: "var(--system-900)",
  },
  spacing: {
    xs: "var(--spacing-xs)",
    sm: "var(--spacing-sm)",
    md: "var(--spacing-md)",
    lg: "var(--spacing-lg)",
    xl: "var(--spacing-xl)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    full: "var(--radius-full)",
  },
  shadows: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    xl: "var(--shadow-xl)",
  },
} as const;

// ===========================================
// COMPOSED VALUES
// ===========================================

/** Common color combinations */
export const bg = {
  primary: "var(--color-primary)",
  secondary: "var(--system-100)",
  surface: "var(--system-50)",
  card: "#FFFFFF",
  overlay: "rgba(0, 0, 0, 0.4)",
} as const;

export const text = {
  primary: "var(--system-700)",
  secondary: "var(--system-500)",
  tertiary: "var(--system-400)",
  placeholder: "var(--system-300)",
  inverse: "#FFFFFF",
  primaryBlue: "var(--color-primary)",
} as const;

export const border = {
  default: "var(--system-200)",
  subtle: "var(--system-100)",
  strong: "var(--system-300)",
} as const;

// ===========================================
// USAGE EXAMPLES
// ===========================================

/**
 * @example
 * // ✅ CORRECT - Using design tokens
 * 
 * import { system, colors, spacing, typography } from "@/lib/theme/design-tokens";
 * 
 * // In JSX:
 * <div style={{ backgroundColor: system[100], color: system[700] }}>
 * <button style={{ backgroundColor: colors.primary, color: colors.primaryForeground }}>
 * <div style={{ padding: spacing.md, borderRadius: radius.md }}>
 * <span style={{ fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.medium }}>
 * 
 * @example
 * // ✅ ALSO CORRECT - Using CSS classes with tokens
 * 
 * // In Tailwind (use var(--) for CSS variables):
 * <div className="bg-[--system-100] text-[--system-700]">
 * <button className="bg-[--color-primary] text-white">
 * <div className="p-[--spacing-md] rounded-[--radius-md]">
 */

// ===========================================
// EXPORT ALL
// ===========================================

export const tokens = {
  colors,
  system,
  semantic,
  status,
  brand,
  typography,
  spacing,
  radius,
  shadows,
  cssVar,
  bg,
  text,
  border,
} as const;

export default tokens;