"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Upload } from "lucide-react";
import { Button } from "@/components/core/button";
import { Card } from "@/components/core/card";
import { useImageUpload } from "./hooks/use-image-upload";
import type { HeroContent, EditingField } from "./types";

interface HeroEditorProps {
  storeId: Id<"stores">;
  heroContent: { content: unknown } | null | undefined;
  editingField: EditingField | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: (field: "heroTitle" | "heroCtaText", value: string) => void;
  onSaveEdit: () => void;
}

export function HeroEditor({
  storeId,
  heroContent,
  editingField,
  editValue,
  onEditValueChange,
  onStartEditing,
  onSaveEdit,
}: HeroEditorProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const setHeroStyles = useMutation(api.siteContent.setHeroStyles);
  const { uploadToStorage } = useImageUpload();

  const currentHero = (heroContent?.content ?? undefined) as HeroContent | undefined;
  const heroTitle = currentHero?.title ?? "Our Online Store";
  const heroCtaText = currentHero?.ctaText ?? "Shop Now";
  const heroCtaColor = currentHero?.ctaColor ?? "#171717";
  const heroLayout = currentHero?.layout ?? "center";
  const heroBgUrl = currentHero?.backgroundImageUrl;

  const isEditingTitle = editingField?.field === "heroTitle";
  const isEditingCta = editingField?.field === "heroCtaText";

  const handleTitleBlur = useCallback(async () => {
    if (editValue.trim()) {
      await setHeroStyles({ storeId, title: editValue.trim() });
    }
    onSaveEdit();
  }, [editValue, setHeroStyles, storeId, onSaveEdit]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (editValue.trim()) {
          setHeroStyles({ storeId, title: editValue.trim() });
        }
        onSaveEdit();
      } else if (e.key === "Escape") {
        onSaveEdit();
      }
    },
    [editValue, setHeroStyles, storeId, onSaveEdit]
  );

  const handleCtaBlur = useCallback(async () => {
    if (editValue.trim()) {
      await setHeroStyles({ storeId, ctaText: editValue.trim() });
    }
    onSaveEdit();
  }, [editValue, setHeroStyles, storeId, onSaveEdit]);

  const handleCtaKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (editValue.trim()) {
          setHeroStyles({ storeId, ctaText: editValue.trim() });
        }
        onSaveEdit();
      } else if (e.key === "Escape") {
        onSaveEdit();
      }
    },
    [editValue, setHeroStyles, storeId, onSaveEdit]
  );

  const handleBackgroundUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      setUploadError(null);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const storageId = await uploadToStorage(reader.result as string);
          await setHeroStyles({ storeId, backgroundImageStorageId: storageId });
        } catch (error) {
          console.error("Failed to upload hero background:", error);
          setUploadError("Failed to upload background image");
        }
      };
      reader.readAsDataURL(file);
    },
    [uploadToStorage, setHeroStyles, storeId]
  );

  const layoutClass =
    heroLayout === "left"
      ? "text-start items-start"
      : heroLayout === "right"
        ? "text-end items-end"
        : "text-center items-center";

  return (
    <>
      <div>

        <div
          className="relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8"
          style={
            heroBgUrl
              ? { backgroundImage: `url(${heroBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {}
          }
        >
          {!heroBgUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5] dark:from-[#171717] dark:to-[#262626]" />
          )}

          <div className={`relative z-10 text-center w-full ${layoutClass} flex flex-col`}>
            {/* Hero Title - Inline Edit */}
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-3xl font-bold text-[#171717] dark:text-[#fafafa] bg-transparent border-b-2 border-[#171717] dark:border-[#fafafa] focus:outline-none text-center"
                placeholder="Page title"
              />
            ) : (
              <h1
                className="text-3xl font-bold text-[#171717] dark:text-[#fafafa] mb-4 cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                onClick={() => onStartEditing("heroTitle", heroTitle)}
              >
                {heroTitle}
              </h1>
            )}

            {/* Hero CTA Button - Inline Edit */}
            {isEditingCta ? (
              <input
                autoFocus
                type="text"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={handleCtaBlur}
                onKeyDown={handleCtaKeyDown}
                className="px-6 py-3 text-white font-medium bg-transparent border-b-2 focus:outline-none"
                style={{ backgroundColor: heroCtaColor }}
                placeholder="Button text"
              />
            ) : (
              <button
                className="px-6 py-3 text-white font-medium cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: heroCtaColor }}
                onClick={() => onStartEditing("heroCtaText", heroCtaText)}
              >
                {heroCtaText}
              </button>
            )}
          </div>

          {/* Layout Toggle - Show on hover */}
          <div className="absolute top-2 end-2 flex items-center gap-2 bg-white/90 dark:bg-[#0a0a0a]/90 border border-[#e5e5e5] dark:border-[#262626] px-2 py-1.5 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-xs text-[#737373]">Position:</span>
            <button
              onClick={() => setHeroStyles({ storeId, layout: "left" })}
              className={`px-2 py-1 text-xs border ${heroLayout === "left" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
            >
              Left
            </button>
            <button
              onClick={() => setHeroStyles({ storeId, layout: "center" })}
              className={`px-2 py-1 text-xs border ${heroLayout === "center" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
            >
              Center
            </button>
            <button
              onClick={() => setHeroStyles({ storeId, layout: "right" })}
              className={`px-2 py-1 text-xs border ${heroLayout === "right" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
            >
              Right
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
         
          <div className="flex items-center gap-2">
            <input
              id="hero-bg-upload"
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            <Button variant="outline" onClick={() => document.getElementById("hero-bg-upload")?.click()}>
              <Upload className="w-4 h-4" />
              Upload Image
            </Button>
          </div>
        </div>

        {uploadError && (
          <p className="mt-2 text-xs text-red-500">{uploadError}</p>
        )}
      </div>
    </>
  );
}
