"use client";

import { ReactNode, CSSProperties } from "react";

/**
 * Heading Component - Typography scale 0-9
 * 
 * Use instead of raw <h1>–<h6> tags.
 * Maps to Frosted UI size scale.
 * 
 * @example
 * <Heading size={9}>Landing Hero Headline</Heading>
 * <Heading size={6}>Modal Heading</Heading>
 * <Heading size={5}>Card Title</Heading>
 */

export type HeadingSize = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps {
  children: ReactNode;
  size?: HeadingSize;
  level?: HeadingLevel;
  weight?: "normal" | "medium" | "semibold" | "bold";
  className?: string;
  align?: "left" | "center" | "right";
}

// Size to pixel mapping
const sizeMap: Record<HeadingSize, string> = {
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
const leadingMap: Record<HeadingSize, string> = {
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

// Letter spacing mapping for headings
const trackingMap: Record<HeadingSize, string> = {
  0: "0.025em",
  1: "0.025em",
  2: "0",
  3: "0",
  4: "-0.01em",
  5: "-0.01em",
  6: "-0.02em",
  7: "-0.02em",
  8: "-0.03em",
  9: "-0.03em",
};

// Default level mapping from size (for semantic HTML)
const defaultLevelMap: Record<HeadingSize, HeadingLevel> = {
  9: "h1",
  8: "h1",
  7: "h2",
  6: "h2",
  5: "h3",
  4: "h3",
  3: "h4",
  2: "h4",
  1: "h5",
  0: "h6",
};

// Font weight mapping
const weightMap: Record<string, string> = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

export function Heading({
  children,
  size = 6,
  level,
  weight = "semibold",
  className = "",
  align = "left",
}: HeadingProps) {
  const Component = level || defaultLevelMap[size as HeadingSize];
  
  const style: CSSProperties = {
    fontSize: sizeMap[size as HeadingSize],
    lineHeight: leadingMap[size as HeadingSize],
    letterSpacing: trackingMap[size as HeadingSize],
    fontWeight: weightMap[weight],
    fontFamily: "var(--font-sans)",
    textAlign: align,
    color: "var(--system-700)",
  };

  return (
    <Component style={style} className={className}>
      {children}
    </Component>
  );
}

export default Heading;