"use client";

import { useState, useCallback, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "../hooks/use-image-upload";
import type { HeroContent, EditingField } from "../types";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadRequestIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setHeroStyles = useMutation(api.siteContent.setHeroStyles);
  const { uploadToStorage } = useImageUpload();

  const currentHero = (heroContent?.content ?? undefined) as HeroContent | undefined;
  const heroTitle = currentHero?.title ?? "Our Online Store";
  const heroCtaText = currentHero?.ctaText ?? "Shop Now";
  const heroCtaColor = currentHero?.ctaColor ?? "var(--system-700)";
  const heroLayout = currentHero?.layout ?? "center";
  const heroBgUrl = currentHero?.backgroundImageUrl;

  const isEditingTitle = editingField?.field === "heroTitle";
  const isEditingCta = editingField?.field === "heroCtaText";

  const commitTitleEdit = useCallback(async () => {
    const nextTitle = editValue.trim();
    try {
      if (nextTitle) {
        await setHeroStyles({ storeId, title: nextTitle });
      }
    } catch (error) {
      console.error("Failed to save hero title:", error);
      setErrorMessage("Failed to save hero title");
    } finally {
      onSaveEdit();
    }
  }, [editValue, onSaveEdit, setHeroStyles, storeId]);

  const handleTitleBlur = useCallback(async () => {
    await commitTitleEdit();
  }, [commitTitleEdit]);

  const handleTitleKeyDown = useCallback(
    async (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        // Prevent form submit when nested in a <form>.
        e.preventDefault();
        await commitTitleEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSaveEdit();
      }
    },
    [commitTitleEdit, onSaveEdit]
  );

  const commitCtaEdit = useCallback(async () => {
    const nextCtaText = editValue.trim();
    try {
      if (nextCtaText) {
        await setHeroStyles({ storeId, ctaText: nextCtaText });
      }
    } catch (error) {
      console.error("Failed to save hero button text:", error);
      setErrorMessage("Failed to save hero button text");
    } finally {
      onSaveEdit();
    }
  }, [editValue, onSaveEdit, setHeroStyles, storeId]);

  const handleCtaBlur = useCallback(async () => {
    await commitCtaEdit();
  }, [commitCtaEdit]);

  const handleCtaKeyDown = useCallback(
    async (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        // Prevent form submit when nested in a <form>.
        e.preventDefault();
        await commitCtaEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSaveEdit();
      }
    },
    [commitCtaEdit, onSaveEdit]
  );

  const handleLayoutChange = useCallback(
    async (layout: "left" | "center" | "right") => {
      setErrorMessage(null);
      try {
        await setHeroStyles({ storeId, layout });
      } catch (error) {
        console.error("Failed to update hero layout:", error);
        setErrorMessage("Failed to update hero layout");
      }
    },
    [setHeroStyles, storeId]
  );

  const handleBackgroundUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const inputEl = e.currentTarget;
      const file = inputEl.files?.[0];
      // Allow selecting the same file again.
      inputEl.value = "";

      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please select an image file");
        return;
      }

      setErrorMessage(null);

      const requestId = ++uploadRequestIdRef.current;
      setIsUploading(true);

      const reader = new FileReader();

      const finishIfCurrent = () => {
        if (uploadRequestIdRef.current === requestId) {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        console.error("Failed to read hero background file");
        if (uploadRequestIdRef.current === requestId) {
          setErrorMessage("Failed to read image file");
        }
        finishIfCurrent();
      };

      reader.onabort = () => {
        if (uploadRequestIdRef.current === requestId) {
          setErrorMessage("Image upload canceled");
        }
        finishIfCurrent();
      };

      reader.onload = async () => {
        if (uploadRequestIdRef.current !== requestId) return;

        try {
          const storageId = await uploadToStorage(reader.result as string);
          if (uploadRequestIdRef.current !== requestId) return;
          await setHeroStyles({ storeId, backgroundImageStorageId: storageId });
        } catch (error) {
          console.error("Failed to upload hero background:", error);
          if (uploadRequestIdRef.current === requestId) {
            setErrorMessage("Failed to upload background image");
          }
        } finally {
          finishIfCurrent();
        }
      };

      try {
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Failed to read hero background file:", error);
        if (uploadRequestIdRef.current === requestId) {
          setErrorMessage("Failed to read image file");
        }
        finishIfCurrent();
      }
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
          className="group relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8"
          style={
            heroBgUrl
              ? { backgroundImage: `url(${heroBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : {}
          }
        >
          {!heroBgUrl && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[--system-100] to-[--system-200]" />
          )}

          {heroBgUrl && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/75 via-white/55 to-white/75" />
          )}

          <div className={`relative z-10 text-center w-full ${layoutClass} flex flex-col`}>
            {/* Hero Title - Inline Edit */}
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                aria-label="Hero title"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="text-3xl font-bold text-[--system-700] bg-transparent border-b-2 border-[--system-700] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--system-700]/30"
                placeholder="Page title"
              />
            ) : (
              <h1
                role="button"
                tabIndex={0}
                aria-label="Edit hero title"
                className="text-3xl font-bold text-[--system-700] mb-4 cursor-pointer hover:text-[--system-500] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[--system-700]/40"
                onClick={() => {
                  setErrorMessage(null);
                  onStartEditing("heroTitle", heroTitle);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setErrorMessage(null);
                    onStartEditing("heroTitle", heroTitle);
                  }
                }}
              >
                {heroTitle}
              </h1>
            )}

            {/* Hero CTA Button - Inline Edit */}
            {isEditingCta ? (
              <input
                autoFocus
                type="text"
                aria-label="Hero button text"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={handleCtaBlur}
                onKeyDown={handleCtaKeyDown}
                className="px-6 py-3 text-white font-medium bg-transparent border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style={{ backgroundColor: heroCtaColor }}
                placeholder="Button text"
              />
            ) : (
              <button
                type="button"
                aria-label="Edit hero button text"
                className="px-6 py-3 text-white font-medium cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[--system-700]/40"
                style={{ backgroundColor: heroCtaColor }}
                onClick={() => {
                  setErrorMessage(null);
                  onStartEditing("heroCtaText", heroCtaText);
                }}
              >
                {heroCtaText}
              </button>
            )}
          </div>

          {/* Layout Toggle - Show on hover */}
          <div className="absolute top-2 end-2 flex items-center gap-2 bg-white/90 border border-[--system-200] px-2 py-1.5 rounded-lg opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <span className="text-xs text-[--system-400]">Position:</span>
            <button
              type="button"
              aria-pressed={heroLayout === "left"}
              onClick={async () => {
                await handleLayoutChange("left");
              }}
              className={`px-2 py-1 text-xs border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--system-700]/30 ${heroLayout === "left" ? "border-[--system-700]" : "border-[--system-200]"}`}
            >
              Left
            </button>
            <button
              type="button"
              aria-pressed={heroLayout === "center"}
              onClick={async () => {
                await handleLayoutChange("center");
              }}
              className={`px-2 py-1 text-xs border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--system-700]/30 ${heroLayout === "center" ? "border-[--system-700]" : "border-[--system-200]"}`}
            >
              Center
            </button>
            <button
              type="button"
              aria-pressed={heroLayout === "right"}
              onClick={async () => {
                await handleLayoutChange("right");
              }}
              className={`px-2 py-1 text-xs border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--system-700]/30 ${heroLayout === "right" ? "border-[--system-700]" : "border-[--system-200]"}`}
            >
              Right
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
         
          <div className="flex items-center gap-2">
            <input
              id="hero-bg-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              aria-label="Upload hero background image"
              disabled={isUploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-busy={isUploading}
            >
              <Upload className="w-4 h-4" />
              Upload Image
            </Button>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-2 text-xs text-red-600" role="alert" aria-live="polite">
            {errorMessage}
          </p>
        )}
      </div>
    </>
  );
}
