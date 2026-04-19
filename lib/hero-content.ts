export type HeroAlignment = "left" | "center" | "right";

export const DEFAULT_HERO_TITLE = "Meet E-commerce\nAgain";
export const DEFAULT_HERO_CTA = "Buy Now";
export const DEFAULT_HERO_BG_URL = "/Hero-bg.jpg";
export const DEFAULT_HERO_TITLE_COLOR = "#173052";
export const DEFAULT_HERO_CTA_COLOR = "#173052";
export const DEFAULT_HERO_ALIGNMENT: HeroAlignment = "center";
export const DEFAULT_HERO_FOCAL_X = 50;
export const DEFAULT_HERO_FOCAL_Y = 50;
export const DEFAULT_HERO_ZOOM = 1;
export const HERO_TITLE_MAX = 40;
export const HERO_CTA_MAX = 18;

export const HERO_TITLE_COLOR_PRESETS = [
  "#173052",
  "#7A2434",
  "#4A2169",
  "#194B41",
] as const;

export const HERO_CTA_COLOR_PRESETS = [
  "#173052",
  "#C84B31",
  "#1E6F5C",
  "#7C3AED",
] as const;

export function clampHeroText(value: string, max: number) {
  return value.slice(0, max);
}

export function resolveHeroTitle(value?: string) {
  return value?.trim() ? value : DEFAULT_HERO_TITLE;
}

export function resolveHeroCta(value?: string) {
  return value?.trim() ? value : DEFAULT_HERO_CTA;
}

export function resolveHeroImage(value?: string) {
  return value || DEFAULT_HERO_BG_URL;
}

export function resolveHeroTitleColor(value?: string) {
  return value || DEFAULT_HERO_TITLE_COLOR;
}

export function resolveHeroCtaColor(value?: string) {
  return value || DEFAULT_HERO_CTA_COLOR;
}

export function resolveHeroAlignment(value?: HeroAlignment) {
  return value || DEFAULT_HERO_ALIGNMENT;
}

export function resolveHeroFocalX(value?: number) {
  return typeof value === "number" ? value : DEFAULT_HERO_FOCAL_X;
}

export function resolveHeroFocalY(value?: number) {
  return typeof value === "number" ? value : DEFAULT_HERO_FOCAL_Y;
}

export function resolveHeroZoom(value?: number) {
  return typeof value === "number" ? value : DEFAULT_HERO_ZOOM;
}
