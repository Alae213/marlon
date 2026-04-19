"use client";

import type { CSSProperties, ReactNode } from "react";
import { getTypographyStyle, type TypographyScale } from "./shared";

export type TextScale = Exclude<TypographyScale, never>;
export type TextVariant = "default" | "muted" | "secondary" | "accent" | "success" | "warning" | "error";

interface TextProps {
  children: ReactNode;
  scale?: TextScale;
  variant?: TextVariant;
  className?: string;
  as?: "p" | "span" | "div" | "label";
  style?: CSSProperties;
  lang?: string;
}

const variantMap: Record<TextVariant, string> = {
  default: "var(--system-700)",
  muted: "var(--system-400)",
  secondary: "var(--system-500)",
  accent: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
};

export function Text({
  children,
  scale = "body",
  variant = "default",
  className = "",
  as: Component = "p",
  style,
  lang,
}: TextProps) {
  return (
    <Component
      className={className}
      lang={lang}
      style={getTypographyStyle(scale, children, {
        color: variantMap[variant],
        ...style,
      })}
    >
      {children}
    </Component>
  );
}

export default Text;
