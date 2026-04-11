"use client";

import { ReactNode, CSSProperties } from "react";

/**
 * Text Component - Typography scale 0-9
 * 
 * Use instead of raw <p>, <span> tags.
 * Maps to Frosted UI size scale.
 * 
 * @example
 * <Text size={3}>Primary body copy</Text>
 * <Text size={1} variant="muted">Timestamps, badges</Text>
 * <Text size={2} variant="secondary">Form labels</Text>
 */

export type TextSize = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type TextVariant = "default" | "muted" | "secondary" | "accent" | "success" | "warning" | "error";

interface TextProps {
  children: ReactNode;
  size?: TextSize;
  variant?: TextVariant;
  weight?: "normal" | "medium" | "semibold" | "bold";
  className?: string;
  as?: "p" | "span" | "div" | "label";
}

// Size to pixel mapping
const sizeMap: Record<TextSize, string> = {
  0: "10px",
  1: "12px",
  2: "14px",
  3: "16px",
  4: "18px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "36px",
  9: "48px",
};

// Size to line-height mapping
const leadingMap: Record<TextSize, string> = {
  0: "10px",
  1: "12px",
  2: "14px",
  3: "16px",
  4: "18px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "36px",
  9: "48px",
};

// Letter spacing mapping
const trackingMap: Record<TextSize, string> = {
  0: "0.025em",
  1: "0",
  2: "0",
  3: "0",
  4: "-0.01em",
  5: "-0.01em",
  6: "-0.02em",
  7: "-0.02em",
  8: "-0.03em",
  9: "-0.03em",
};

// Variant to color mapping
const variantMap: Record<TextVariant, string> = {
  default: "var(--system-700)",
  muted: "var(--system-400)",
  secondary: "var(--system-500)",
  accent: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
};

// Font weight mapping
const weightMap: Record<string, string> = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export function Text({
  children,
  size = 3,
  variant = "default",
  weight = "normal",
  className = "",
  as: Component = "p",
}: TextProps) {
  const style: CSSProperties = {
    fontSize: sizeMap[size as TextSize],
    lineHeight: leadingMap[size as TextSize],
    letterSpacing: trackingMap[size as TextSize],
    color: variantMap[variant],
    fontWeight: weightMap[weight],
    fontFamily: "var(--font-sans)",
  };

  return (
    <Component style={style} className={className}>
      {children}
    </Component>
  );
}

export default Text;