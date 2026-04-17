import { Fredoka, Lora } from "next/font/google";
import { cn } from "@/lib/utils";
import type { HeroFontFamily } from "./hero-content";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-hero-serif",
  weight: ["500", "700"],
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-hero-playful",
  weight: ["500", "600", "700"],
});

export const heroFontVariables = cn(lora.variable, fredoka.variable);

export function getHeroFontClass(fontFamily: HeroFontFamily) {
  if (fontFamily === "serif") {
    return "font-[family-name:var(--font-hero-serif)]";
  }
  if (fontFamily === "playful") {
    return "font-[family-name:var(--font-hero-playful)]";
  }
  return "font-[family-name:var(--font-inter)]";
}
