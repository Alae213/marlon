"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import { Package, Palette, Type, Upload } from "lucide-react";
import { CartIcon } from "@/components/core/cart-icon";
import { Button } from "@/components/core/button";
import { Card } from "@/components/core/card";
import { ImageCropper } from "@/components/image-cropper";
import { useImageUpload } from "./hooks/use-image-upload";
import type { NavbarContent } from "./types";

interface NavbarEditorProps {
  storeId: Id<"stores">;
  navbarContent: { content: unknown } | null | undefined;
}

export function NavbarEditor({ storeId, navbarContent }: NavbarEditorProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const setNavbarStyles = useMutation(api.siteContent.setNavbarStyles);
  const setLogoAndSyncFooter = useMutation(api.siteContent.setLogoAndSyncFooter);
  const { uploadToStorage } = useImageUpload();

  const currentNavbar = (navbarContent?.content ?? undefined) as NavbarContent | undefined;
  const navbarBg = currentNavbar?.background ?? "light";
  const navbarText = currentNavbar?.textColor ?? "dark";
  const navbarLogoUrl = currentNavbar?.logoUrl;

  const navbarBgClass =
    navbarBg === "dark"
      ? "bg-[#0a0a0a]"
      : navbarBg === "transparent"
        ? "bg-transparent"
        : "bg-white";

  const navbarTextClass = navbarText === "light" ? "text-white" : "text-[#171717]";

  const handleSetNavbarStyle = useCallback(
    async (next: { background?: "dark" | "light" | "transparent"; textColor?: "dark" | "light" }) => {
      try {
        await setNavbarStyles({
          storeId,
          background: next.background,
          textColor: next.textColor,
        });
      } catch (error) {
        console.error("Failed to update navbar style:", error);
      }
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
      setIsUploadingLogo(true);
      try {
        const storageId = await uploadToStorage(croppedDataUrl);
        await setLogoAndSyncFooter({ storeId, logoStorageId: storageId });
        setLogoCropSrc(null);
      } catch (error) {
        console.error("Failed to upload logo:", error);
      }
      setIsUploadingLogo(false);
    },
    [uploadToStorage, setLogoAndSyncFooter, storeId]
  );

  return (
    <Card className="mb-6" padding="none">
      <div className="p-4">
        <div
          className={`relative border border-[#e5e5e5] dark:border-[#262626] overflow-hidden ${navbarBgClass}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#f5f5f5] dark:bg-[#171717] overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                {navbarLogoUrl ? (
                  <Image src={navbarLogoUrl} alt="logo" fill className="object-cover" />
                ) : (
                  <Package className="w-5 h-5 text-[#a3a3a3]" />
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-5">
              <span className={`text-sm ${navbarTextClass}`}>المتجر</span>
              <span className={`text-sm ${navbarTextClass}`}>الأسئلة</span>
              <span className={`text-sm ${navbarTextClass}`}>مساعدة</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`w-9 h-9 flex items-center justify-center border border-[#e5e5e5] dark:border-[#262626] ${navbarTextClass}`}
                aria-label="السلة"
              >
                <CartIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isHovered && (
            <div className="absolute top-2 end-2 flex items-center gap-2 bg-white/90 dark:bg-[#0a0a0a]/90 border border-[#e5e5e5] dark:border-[#262626] px-2 py-1.5 rounded-lg">
              <div className="flex items-center gap-1">
                <Palette className="w-4 h-4 text-[#737373]" />
                <button
                  onClick={() => handleSetNavbarStyle({ background: "light" })}
                  className={`px-2 py-1 text-xs border ${navbarBg === "light" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                >
                  فاتح
                </button>
                <button
                  onClick={() => handleSetNavbarStyle({ background: "dark" })}
                  className={`px-2 py-1 text-xs border ${navbarBg === "dark" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                >
                  داكن
                </button>
                <button
                  onClick={() => handleSetNavbarStyle({ background: "transparent" })}
                  className={`px-2 py-1 text-xs border ${navbarBg === "transparent" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                >
                  شفاف
                </button>
              </div>

              <div className="w-px h-6 bg-[#e5e5e5] dark:bg-[#262626]" />

              <div className="flex items-center gap-1">
                <Type className="w-4 h-4 text-[#737373]" />
                <button
                  onClick={() => handleSetNavbarStyle({ textColor: "dark" })}
                  className={`px-2 py-1 text-xs border ${navbarText === "dark" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                >
                  نص داكن
                </button>
                <button
                  onClick={() => handleSetNavbarStyle({ textColor: "light" })}
                  className={`px-2 py-1 text-xs border ${navbarText === "light" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                >
                  نص فاتح
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-[#737373]">رفع شعار (يتم مزامنته تلقائياً مع الفوتر)</div>
          <div className="flex items-center gap-2">
            <input
              id="navbar-logo-upload"
              type="file"
              accept="image/*"
              onChange={handleSelectLogoFile}
              className="hidden"
            />
            <Button
              variant="outline"
              disabled={isUploadingLogo}
              onClick={() => document.getElementById("navbar-logo-upload")?.click()}
            >
              <Upload className="w-4 h-4" />
              {isUploadingLogo ? "جاري الرفع..." : "رفع الشعار"}
            </Button>
          </div>
        </div>
      </div>

      {logoCropSrc && (
        <ImageCropper
          imageSrc={logoCropSrc}
          aspectRatio={1}
          onCancel={() => setLogoCropSrc(null)}
          onCropComplete={handleApplyLogoCrop}
        />
      )}
    </Card>
  );
}
