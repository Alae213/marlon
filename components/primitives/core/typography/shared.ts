import type { CSSProperties, ReactNode } from "react";

export type TypographyScale = "caption" | "body-sm" | "body" | "title" | "display";

type TypographyToken = {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
};

export const typographyScaleStyles: Record<TypographyScale, TypographyToken> = {
  caption: {
    fontSize: "var(--text-caption)",
    lineHeight: "var(--leading-caption)",
    letterSpacing: "var(--tracking-caption)",
    fontWeight: "var(--weight-caption)",
  },
  "body-sm": {
    fontSize: "var(--text-body-sm)",
    lineHeight: "var(--leading-body-sm)",
    letterSpacing: "var(--tracking-body-sm)",
    fontWeight: "var(--weight-body-sm)",
  },
  body: {
    fontSize: "var(--text-body)",
    lineHeight: "var(--leading-body)",
    letterSpacing: "var(--tracking-body)",
    fontWeight: "var(--weight-body)",
  },
  title: {
    fontSize: "var(--text-title)",
    lineHeight: "var(--leading-title)",
    letterSpacing: "var(--tracking-title)",
    fontWeight: "var(--weight-title)",
  },
  display: {
    fontSize: "var(--text-display)",
    lineHeight: "var(--leading-display)",
    letterSpacing: "var(--tracking-display)",
    fontWeight: "var(--weight-display)",
  },
};

const ARABIC_SCRIPT_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsArabicText(value: ReactNode): boolean {
  if (typeof value === "string") return ARABIC_SCRIPT_PATTERN.test(value);
  if (typeof value === "number") return false;
  if (Array.isArray(value)) return value.some(containsArabicText);
  if (value && typeof value === "object" && "props" in value) {
    return containsArabicText((value as { props?: { children?: ReactNode } }).props?.children);
  }
  return false;
}

export function getTypographyStyle(
  scale: TypographyScale,
  children: ReactNode,
  overrides?: CSSProperties,
): CSSProperties {
  const tokens = typographyScaleStyles[scale];
  const isArabicTitle = (scale === "title" || scale === "display") && containsArabicText(children);

  return {
    ...tokens,
    letterSpacing: isArabicTitle ? "0" : tokens.letterSpacing,
    fontFamily: "var(--font-sans)",
    ...overrides,
  };
}
