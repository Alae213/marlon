"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronDown, ImageIcon, MoonStar, Package, SunMedium, Upload } from "lucide-react";
import { Button } from "@/components/primitives/core/buttons/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/primitives/ui/switch";
import { CartIcon } from "@/components/primitives/core/media/cart-icon";
import { cn } from "@/lib/utils";
import { useImageUpload } from "../hooks/use-image-upload";
import type { NavbarContent, NavbarLink } from "../types";

const ImageCropper = dynamic(() =>
  import("@/components/features/shared/image-cropper").then((mod) => mod.ImageCropper),
);

const DEFAULT_LINKS: NavbarLink[] = [
  { id: "link-shop", text: "Shop", url: "#products", isDefault: true, enabled: true },
  { id: "link-faq", text: "FAQ", url: "/", isDefault: true, enabled: true },
  { id: "link-help", text: "Help", url: "/", isDefault: true, enabled: true },
];

interface NavbarEditorProps {
  storeId: Id<"stores">;
  navbarContent: { content: unknown } | null | undefined;
}

type NavbarMode = "light" | "dark";
type RenderableNavbarLink = NavbarLink & { renderKey: string };

export function NavbarEditor({ storeId, navbarContent }: NavbarEditorProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);

  const setNavbarStyles = useMutation(api.siteContent.setNavbarStyles);
  const setLogoAndSyncFooter = useMutation(api.siteContent.setLogoAndSyncFooter);
  const { uploadToStorage } = useImageUpload();

  const currentNavbar = (navbarContent?.content ?? undefined) as NavbarContent | undefined;
  const mode = (currentNavbar?.background === "dark" ? "dark" : "light") as NavbarMode;
  const logoUrl = currentNavbar?.logoUrl;
  const showCart = currentNavbar?.showCart ?? true;
  const links = useMemo<RenderableNavbarLink[]>(
    () =>
      DEFAULT_LINKS.map((link, index) => ({
        ...link,
        renderKey: `${link.id || "link"}-${index}`,
      })),
    []
  );

  const previewClasses =
    mode === "dark"
      ? "border-white/12 bg-[color:rgb(23_23_23_/_0.82)] text-white"
      : "border-white/70 bg-[color:rgb(255_255_255_/_0.82)] text-[var(--system-700)]";
  const actionChipClasses =
    mode === "dark"
      ? " hover:bg-[color:rgb(255_255_255_/_0.08)]"
      : " hover:bg-[color:rgb(15_23_42_/_0.04)]";
  const cartClasses =
    mode === "dark"
      ? "bg-transparent hover:bg-white/10"
      : "bg-transparent hover:bg-black/5";
  const panelCardClasses = "rounded-md border bg-[var(--system-600)] p-2";

  const handleModeChange = useCallback(
    async (nextMode: NavbarMode) => {
      await setNavbarStyles({
        storeId,
        background: nextMode,
        textColor: nextMode === "dark" ? "light" : "dark",
      });
    },
    [setNavbarStyles, storeId]
  );

  const handleCartToggle = useCallback(
    async (enabled: boolean) => {
      await setNavbarStyles({ storeId, showCart: enabled });
    },
    [setNavbarStyles, storeId]
  );

  const handleSelectLogoFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setLogoCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleApplyLogoCrop = useCallback(
    async (croppedDataUrl: string) => {
      const storageId = await uploadToStorage(croppedDataUrl);
      await setLogoAndSyncFooter({ storeId, logoStorageId: storageId });
      setLogoCropSrc(null);
    },
    [setLogoAndSyncFooter, storeId, uploadToStorage]
  );

  return (
    <>
      <Popover open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <div className="sticky top-3 z-40 ">
          <div className="relative mx-auto h-full max-w-5xl">
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Open navbar settings"
                className={`cursor-pointer group absolute inset-x-0 top-0 z-20 flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left backdrop-blur-xl transition-all duration-200 ${previewClasses}`}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-2xl transition-colors duration-200 -m-2 cursor-pointer",
                    isPanelOpen
                      ? "bg-[color:rgb(0_112_243_/_0.2)]"
                      : "bg-transparent group-hover:bg-[color:rgb(0_112_243_/_0.2)]"
                  )}
                />

                <div className="relative z-20 flex min-w-0 flex-1 items-center">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Store logo"
                      width={160}
                      height={40}
                      className="h-10 w-auto rounded-md object-contain"
                    />
                  ) : (
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${actionChipClasses}`}
                    >
                      <Package className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <nav className="relative z-20 hidden flex-1 items-center justify-center gap-2 lg:flex">
                  {links.map((link) => (
                    <span key={link.renderKey} className="truncate rounded-full px-3 py-2 text-body font-bold">
                      {link.text}
                    </span>
                  ))}
                </nav>

                <div className="relative z-20 flex flex-1 items-center justify-end gap-2">
                  <span
                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border lg:hidden ${actionChipClasses}`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                  {showCart && (
                    <span className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ${cartClasses}`}>
                      <CartIcon className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="center"
              side="bottom"
              sideOffset={10}
              className="w-[min(340px,calc(100vw-24px))] rounded-lg border-[var(--system-700)] bg-[var(--system-800)] p-2 text-[var(--system-100)] shadow-[var(--shadow-lg)]"
            >
              <div className="space-y-2">
                <div className={cn(panelCardClasses, "min-w-0")}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-caption text-[var(--system-300)]">Brand</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-[var(--system-600)] text-[var(--system-300)]">
                      <ImageIcon className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <div className="flex h-16 items-center justify-center rounded-sm border border-dashed border-[var(--system-600)] bg-[var(--system-800)] px-3">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Store logo preview"
                        width={170}
                        height={40}
                        className="h-10 w-auto object-contain"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-caption text-[var(--system-300)]">
                        <Package className="h-3.5 w-3.5" />
                        No logo
                      </div>
                    )}
                  </div>

                  <input
                    id="navbar-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleSelectLogoFile}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("navbar-logo-upload")?.click()}
                    className="mt-2 h-9 w-full rounded-sm border-[var(--system-600)] bg-[var(--system-700)] text-[var(--system-100)] hover:bg-[var(--system-600)]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {logoUrl ? "Replace Logo" : "Upload Logo"}
                  </Button>
                </div>

                <div className={panelCardClasses}>
                  <p className="mb-2 text-caption text-[var(--system-300)]">Appearance</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["light", "dark"] as NavbarMode[]).map((option) => {
                      const selected = mode === option;
                      const Icon = option === "light" ? SunMedium : MoonStar;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleModeChange(option)}
                          className={cn(
                            "min-h-9 rounded-sm border px-2 py-1.5 text-left transition-colors duration-200",
                            selected
                              ? "border-[var(--color-primary)] bg-[color:rgb(0_112_243_/_0.2)] text-[var(--system-100)]"
                              : "border-[var(--system-600)] bg-[var(--system-800)] text-[var(--system-300)] hover:bg-[var(--system-600)] hover:text-[var(--system-100)]"
                          )}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" />
                              <span className="text-caption capitalize">{option}</span>
                            </span>
                          </button>
                      );
                    })}
                  </div>
                </div>

                <div className={panelCardClasses}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-caption text-[var(--system-300)]">Cart</p>
                    <Switch
                      label=""
                      checked={showCart}
                      onToggle={() => handleCartToggle(!showCart)}
                      className="-mr-3 px-0 py-0"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </div>
        </div>
      </Popover>

      {logoCropSrc && (
        <ImageCropper
          imageSrc={logoCropSrc}
          aspectRatio={0}
          onCancel={() => setLogoCropSrc(null)}
          onCropComplete={handleApplyLogoCrop}
        />
      )}
    </>
  );
}
