"use client";

import { useEffect } from "react";

type StoreBrowserBrandingProps = {
  title?: string;
  iconUrl?: string | null;
};

const BRANDING_ICON_ATTR = "data-store-browser-branding";

export function StoreBrowserBranding({ title, iconUrl }: StoreBrowserBrandingProps) {
  useEffect(() => {
    const previousTitle = document.title;
    const iconSelector = `link[rel="icon"][${BRANDING_ICON_ATTR}="true"]`;
    const previousIcon = document.head.querySelector<HTMLLinkElement>(iconSelector);

    if (previousIcon) {
      previousIcon.remove();
    }

    if (iconUrl) {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = iconUrl;
      link.setAttribute(BRANDING_ICON_ATTR, "true");
      document.head.appendChild(link);
    }

    document.title = title?.trim() || "Marlon";

    return () => {
      document.title = previousTitle;
      const icon = document.head.querySelector<HTMLLinkElement>(iconSelector);
      if (icon) {
        icon.remove();
      }
    };
  }, [iconUrl, title]);

  return null;
}
