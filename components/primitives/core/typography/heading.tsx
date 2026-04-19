"use client";

import type { CSSProperties, ReactNode } from "react";
import { getTypographyStyle, type TypographyScale } from "./shared";

export type HeadingScale = Extract<TypographyScale, "title" | "display">;
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps {
  children: ReactNode;
  scale?: HeadingScale;
  level?: HeadingLevel;
  className?: string;
  align?: "left" | "center" | "right";
  style?: CSSProperties;
  lang?: string;
}

const defaultLevelMap: Record<HeadingScale, HeadingLevel> = {
  display: "h1",
  title: "h2",
};

export function Heading({
  children,
  scale = "title",
  level,
  className = "",
  align = "left",
  style,
  lang,
}: HeadingProps) {
  const Component = level ?? defaultLevelMap[scale];

  return (
    <Component
      className={className}
      lang={lang}
      style={getTypographyStyle(scale, children, {
        textAlign: align,
        color: "var(--system-700)",
        ...style,
      })}
    >
      {children}
    </Component>
  );
}

export default Heading;
