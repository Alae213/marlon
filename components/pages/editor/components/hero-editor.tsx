"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import {
  Image as ImageIcon,
  Palette,
  Type,
  WandSparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EditorHoverHighlight } from "@/components/ui/EditorHoverHighlight";
import { cn } from "@/lib/utils";
import {
  clampHeroText,
  HERO_CTA_COLOR_PRESETS,
  HERO_CTA_MAX,
  HERO_FONT_LABELS,
  HERO_TITLE_COLOR_PRESETS,
  HERO_TITLE_MAX,
  resolveHeroAlignment,
  resolveHeroCta,
  resolveHeroCtaColor,
  resolveHeroFocalX,
  resolveHeroFocalY,
  resolveHeroFont,
  resolveHeroImage,
  resolveHeroTitle,
  resolveHeroTitleColor,
  resolveHeroZoom,
  type HeroAlignment,
  type HeroFontFamily,
} from "@/lib/hero-content";
import { getHeroFontClass } from "@/lib/hero-fonts";
import { useImageUpload } from "../hooks/use-image-upload";
import type { HeroContent } from "../types";

interface HeroEditorProps {
  storeId: Id<"stores">;
  heroContent: { content: unknown } | null | undefined;
}

type ActivePanel = "title" | "cta" | null;

type HeroUpdate = {
  title?: string;
  ctaText?: string;
  titleColor?: string;
  ctaColor?: string;
  fontFamily?: HeroFontFamily;
  alignment?: HeroAlignment;
  backgroundImageStorageId?: string;
  focalPointX?: number;
  focalPointY?: number;
  zoom?: number;
};

interface DraftImageState {
  previewUrl: string;
  storageId: string;
  focalPointX: number;
  focalPointY: number;
  zoom: number;
}

interface SharedTypographyControlsProps {
  alignment: HeroAlignment;
  fontFamily: HeroFontFamily;
  onUpdate: (updates: HeroUpdate) => void | Promise<void>;
}

interface SettingsShellProps {
  icon: ReactNode;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const ALIGNMENT_OPTIONS: HeroAlignment[] = ["left", "center", "right"];
const FONT_OPTIONS: HeroFontFamily[] = ["serif", "sans", "playful"];

function getSharedTextAlignment(alignment: HeroAlignment) {
  if (alignment === "left") return "items-start text-left";
  if (alignment === "right") return "items-end text-right";
  return "items-center text-center";
}

function getHeroImageStyle(imageUrl: string, focalX: number, focalY: number, zoom: number): CSSProperties {
  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundPosition: `${focalX}% ${focalY}%`,
    backgroundSize: `${Math.max(zoom, 1) * 100}%`,
    backgroundRepeat: "no-repeat",
  };
}

function SwatchButton({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Choose ${color}`}
      className={cn(
        "h-8 w-8 rounded-full border-2 transition-transform hover:scale-105",
        selected ? "border-[var(--color-primary)]" : "border-white/20"
      )}
      style={{ backgroundColor: color }}
    />
  );
}

function SettingsShell({ icon, title, onClose, children }: SettingsShellProps) {
  return (
    <>
      <PopoverHeader className="mb-4 flex-row items-center justify-between gap-3 text-[var(--system-600)]">
        <div className="flex items-center gap-2">
          {icon}
          <PopoverTitle className="text-sm font-semibold">{title}</PopoverTitle>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="rounded-full text-[var(--system-400)] hover:bg-black/5 hover:text-[var(--system-600)]"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close panel</span>
        </Button>
      </PopoverHeader>
      <div className="space-y-4">{children}</div>
    </>
  );
}

function SharedTypographyControls({
  alignment,
  fontFamily,
  onUpdate,
}: SharedTypographyControlsProps) {
  return (
    <>
      <div className="space-y-2">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
          <WandSparkles className="h-3.5 w-3.5" />
          Shared font
        </span>
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => void onUpdate({ fontFamily: option })}
              className={cn(
                "rounded-[18px] border px-3 py-2 text-xs font-medium transition-colors",
                fontFamily === option
                  ? "border-[var(--color-primary)] bg-[color:rgb(0_112_243_/_0.12)] text-[var(--system-600)]"
                  : "border-black/10 bg-white text-[var(--system-500)] hover:bg-black/5",
                getHeroFontClass(option)
              )}
            >
              {HERO_FONT_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
          Shared alignment
        </span>
        <div className="grid grid-cols-3 gap-2">
          {ALIGNMENT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => void onUpdate({ alignment: option })}
              className={cn(
                "rounded-[18px] border px-3 py-2 text-xs font-medium capitalize transition-colors",
                alignment === option
                  ? "border-[var(--color-primary)] bg-[color:rgb(0_112_243_/_0.12)] text-[var(--system-600)]"
                  : "border-black/10 bg-white text-[var(--system-500)] hover:bg-black/5"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function HeroEditor({ storeId, heroContent }: HeroEditorProps) {
  const setHeroStyles = useMutation(api.siteContent.setHeroStyles);
  const { uploadToStorage } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftImage, setDraftImage] = useState<DraftImageState | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [ctaInput, setCtaInput] = useState("");

  const currentHero = useMemo(
    () => (heroContent?.content ?? undefined) as HeroContent | undefined,
    [heroContent]
  );

  const heroTitle = resolveHeroTitle(currentHero?.title);
  const heroCtaText = resolveHeroCta(currentHero?.ctaText);
  const titleColor = resolveHeroTitleColor(currentHero?.titleColor);
  const ctaColor = resolveHeroCtaColor(currentHero?.ctaColor);
  const fontFamily = resolveHeroFont(currentHero?.fontFamily);
  const alignment = resolveHeroAlignment(currentHero?.alignment);
  const backgroundImageUrl = resolveHeroImage(currentHero?.backgroundImageUrl);
  const focalPointX = resolveHeroFocalX(currentHero?.focalPointX);
  const focalPointY = resolveHeroFocalY(currentHero?.focalPointY);
  const zoom = resolveHeroZoom(currentHero?.zoom);
  const textAlignmentClass = getSharedTextAlignment(alignment);
  const fontClass = getHeroFontClass(fontFamily);
  const liveTitle = activePanel === "title" ? titleInput : heroTitle;
  const liveCta = activePanel === "cta" ? ctaInput : heroCtaText;

  useEffect(() => {
    setTitleInput(heroTitle);
  }, [heroTitle]);

  useEffect(() => {
    setCtaInput(heroCtaText);
  }, [heroCtaText]);

  const persistSharedSettings = useCallback(
    async (updates: HeroUpdate) => {
      setErrorMessage(null);
      try {
        await setHeroStyles({ storeId, ...updates });
      } catch {
        setErrorMessage("Failed to update the hero. Please retry.");
      }
    },
    [setHeroStyles, storeId]
  );

  const commitPanelDraft = useCallback(
    (panel: ActivePanel) => {
      if (panel === "title") {
        void persistSharedSettings({ title: titleInput });
        return;
      }
      if (panel === "cta") {
        void persistSharedSettings({ ctaText: ctaInput });
      }
    },
    [ctaInput, persistSharedSettings, titleInput]
  );

  const closePanel = useCallback(() => {
    commitPanelDraft(activePanel);
    setActivePanel(null);
  }, [activePanel, commitPanelDraft]);

  const handlePanelOpenChange = useCallback(
    (panel: Exclude<ActivePanel, null>, open: boolean) => {
      if (open) {
        setActivePanel(panel);
        return;
      }
      if (activePanel === panel) {
        commitPanelDraft(panel);
      }
      setActivePanel(null);
    },
    [activePanel, commitPanelDraft]
  );

  const handleBackgroundClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleBackgroundSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Please choose an image file.");
        return;
      }

      setErrorMessage(null);
      setIsUploading(true);

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Unable to read selected image."));
          reader.readAsDataURL(file);
        });

        const storageId = await uploadToStorage(dataUrl);
        setDraftImage({
          previewUrl: dataUrl,
          storageId,
          focalPointX: 50,
          focalPointY: 50,
          zoom: 1,
        });
      } catch {
        setErrorMessage("Failed to upload the hero image.");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadToStorage]
  );

  const saveDraftImage = useCallback(async () => {
    if (!draftImage) return;
    await persistSharedSettings({
      backgroundImageStorageId: draftImage.storageId,
      focalPointX: draftImage.focalPointX,
      focalPointY: draftImage.focalPointY,
      zoom: draftImage.zoom,
    });
    setDraftImage(null);
  }, [draftImage, persistSharedSettings]);

  const heroSurfaceStyle = useMemo(
    () => getHeroImageStyle(backgroundImageUrl, focalPointX, focalPointY, zoom),
    [backgroundImageUrl, focalPointX, focalPointY, zoom]
  );

  const draftSurfaceStyle = useMemo(
    () =>
      draftImage
        ? getHeroImageStyle(
            draftImage.previewUrl,
            draftImage.focalPointX,
            draftImage.focalPointY,
            draftImage.zoom
          )
        : undefined,
    [draftImage]
  );

  return (
    <>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundSelected}
          className="hidden"
        />

        <div
          className="relative min-h-[470px] overflow-hidden rounded-[32px]"
          style={heroSurfaceStyle}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.66)_52%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/95 to-transparent" />
          <button
            type="button"
            aria-label="Change hero background image"
            onClick={handleBackgroundClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleBackgroundClick();
              }
            }}
            className="group absolute inset-0 z-[5] cursor-pointer rounded-[32px]"
          >
            <EditorHoverHighlight
              isDisabled={!!draftImage || activePanel !== null}
              className="rounded-[32px] transition-opacity duration-100"
            />
          </button>
          {isUploading && (
            <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full bg-[color:rgb(9_17_31_/_0.72)] px-3 py-2 text-[11px] font-medium text-white/88">
              <ImageIcon className="h-3.5 w-3.5" />
              Uploading image...
            </div>
          )}

          <div
            className={cn(
              "pointer-events-none relative z-10 flex min-h-[470px] flex-col justify-center gap-6 px-6 py-12 md:px-10",
              textAlignmentClass
            )}
          >
            <div className="relative flex max-w-3xl flex-col gap-6">
              <Popover
                open={activePanel === "title"}
                onOpenChange={(open) => handlePanelOpenChange("title", open)}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    className={cn(
                      "pointer-events-auto group relative cursor-pointer rounded-[28px] p-3 transition-all duration-75"
                    )}
                  >
                    <EditorHoverHighlight
                      isDisabled={activePanel === "title"}
                      className="rounded-[28px] transition-opacity duration-75"
                    />
                    <h1
                      className={cn(
                        "relative z-10 whitespace-pre-line text-4xl leading-[0.9] md:text-6xl",
                        fontClass
                      )}
                      style={{ color: titleColor }}
                    >
                      {liveTitle}
                    </h1>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  side="bottom"
                  sideOffset={10}
                  className="w-[min(360px,calc(100vw-2rem))] rounded-[28px] border-white/60 bg-[color:rgb(255_255_255_/_0.96)] p-4 text-[var(--system-600)] shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm"
                >
                  <SettingsShell
                    icon={<Type className="h-4 w-4" />}
                    title="Title settings"
                    onClose={closePanel}
                  >
                    <label className="block space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
                        {`Title (${titleInput.length}/${HERO_TITLE_MAX})`}
                      </span>
                      <textarea
                        value={titleInput}
                        rows={3}
                        maxLength={HERO_TITLE_MAX}
                        onChange={(event) => setTitleInput(clampHeroText(event.target.value, HERO_TITLE_MAX))}
                        onBlur={() => void persistSharedSettings({ title: titleInput })}
                        className="w-full rounded-[20px] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--system-600)] outline-none ring-0 transition-colors focus:border-[var(--color-primary)]"
                      />
                    </label>

                    <div className="space-y-2">
                      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
                        <Palette className="h-3.5 w-3.5" />
                        Title colors
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {HERO_TITLE_COLOR_PRESETS.map((color) => (
                          <SwatchButton
                            key={color}
                            color={color}
                            selected={titleColor === color}
                            onClick={() => void persistSharedSettings({ titleColor: color })}
                          />
                        ))}
                        <input
                          type="color"
                          value={titleColor}
                          onChange={(event) =>
                            void persistSharedSettings({ titleColor: event.target.value })
                          }
                          className="h-8 w-12 cursor-pointer rounded-full border border-white/20 bg-transparent p-0"
                        />
                      </div>
                    </div>

                    <SharedTypographyControls
                      alignment={alignment}
                      fontFamily={fontFamily}
                      onUpdate={persistSharedSettings}
                    />
                  </SettingsShell>
                </PopoverContent>
              </Popover>

              <Popover
                open={activePanel === "cta"}
                onOpenChange={(open) => handlePanelOpenChange("cta", open)}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    className={cn(
                      "pointer-events-auto h-11 rounded-full border-0 px-6 text-[15px] shadow-[0_20px_50px_rgba(23,48,82,0.18)]",
                      fontClass
                    )}
                    style={{ backgroundColor: ctaColor, color: "#ffffff" }}
                  >
                    <EditorHoverHighlight
                      isDisabled={activePanel === "cta"}
                      className="rounded-full transition-opacity duration-75"
                    />
                    <span className="relative z-10">
                      {liveCta}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  side="bottom"
                  sideOffset={10}
                  className="w-[min(360px,calc(100vw-2rem))] rounded-[28px] border-white/60 bg-[color:rgb(255_255_255_/_0.96)] p-4 text-[var(--system-600)] shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm"
                >
                  <SettingsShell
                    icon={<Palette className="h-4 w-4" />}
                    title="CTA settings"
                    onClose={closePanel}
                  >
                    <label className="block space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
                        {`CTA (${ctaInput.length}/${HERO_CTA_MAX})`}
                      </span>
                      <input
                        value={ctaInput}
                        maxLength={HERO_CTA_MAX}
                        onChange={(event) => setCtaInput(clampHeroText(event.target.value, HERO_CTA_MAX))}
                        onBlur={() => void persistSharedSettings({ ctaText: ctaInput })}
                        className="w-full rounded-[20px] border border-black/10 bg-white px-4 py-3 text-sm text-[var(--system-600)] outline-none ring-0 transition-colors focus:border-[var(--color-primary)]"
                      />
                    </label>

                    <div className="space-y-2">
                      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
                        <Palette className="h-3.5 w-3.5" />
                        CTA colors
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {HERO_CTA_COLOR_PRESETS.map((color) => (
                          <SwatchButton
                            key={color}
                            color={color}
                            selected={ctaColor === color}
                            onClick={() => void persistSharedSettings({ ctaColor: color })}
                          />
                        ))}
                        <input
                          type="color"
                          value={ctaColor}
                          onChange={(event) =>
                            void persistSharedSettings({ ctaColor: event.target.value })
                          }
                          className="h-8 w-12 cursor-pointer rounded-full border border-white/20 bg-transparent p-0"
                        />
                      </div>
                    </div>

                    <SharedTypographyControls
                      alignment={alignment}
                      fontFamily={fontFamily}
                      onUpdate={persistSharedSettings}
                    />
                  </SettingsShell>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="mt-3 text-sm text-[var(--color-error)]">{errorMessage}</p>
        )}
      </div>

      <Dialog open={!!draftImage} onOpenChange={(open) => !open && setDraftImage(null)}>
        <DialogContent className="max-w-5xl rounded-[32px] border-white/20 bg-[color:rgb(255_255_255_/_0.96)] p-0 text-[var(--system-600)] shadow-[0_30px_120px_rgba(15,23,42,0.22)]">
          <DialogHeader className="border-b border-black/6 px-6 py-5">
            <DialogTitle className="text-lg font-semibold">Adjust hero image</DialogTitle>
          </DialogHeader>

          {draftImage && (
            <div className="grid gap-6 p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-5">
                <label className="block space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
                    Zoom
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.05"
                    value={draftImage.zoom}
                    onChange={(event) =>
                      setDraftImage((current) =>
                        current
                          ? { ...current, zoom: Number(event.target.value) }
                          : current
                      )
                    }
                    className="w-full"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
                    Horizontal focal point
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={draftImage.focalPointX}
                    onChange={(event) =>
                      setDraftImage((current) =>
                        current
                          ? { ...current, focalPointX: Number(event.target.value) }
                          : current
                      )
                    }
                    className="w-full"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
                    Vertical focal point
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={draftImage.focalPointY}
                    onChange={(event) =>
                      setDraftImage((current) =>
                        current
                          ? { ...current, focalPointY: Number(event.target.value) }
                          : current
                      )
                    }
                    className="w-full"
                  />
                </label>

                <div className="rounded-[24px] bg-[var(--system-50)] p-4 text-sm text-[var(--system-500)]">
                  One image is used for both desktop and phone. Adjust zoom and focal point until both previews look right.
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
                    Desktop preview
                  </p>
                  <div
                    className="relative min-h-[280px] overflow-hidden rounded-[28px]"
                    style={draftSurfaceStyle}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.68)_56%,rgba(255,255,255,0)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/95 to-transparent" />
                    <div className={cn("relative z-10 flex min-h-[280px] flex-col justify-center gap-4 px-8", textAlignmentClass)}>
                      <h2 className={cn("max-w-2xl whitespace-pre-line text-5xl leading-[0.92]", fontClass)} style={{ color: titleColor }}>
                        {liveTitle}
                      </h2>
                      <Button
                        variant="primary"
                        size="lg"
                        className={cn("h-11 w-fit rounded-full px-6", fontClass)}
                        style={{ backgroundColor: ctaColor, color: "#fff" }}
                      >
                        {liveCta}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--system-400)]">
                    Phone preview
                  </p>
                  <div className="mx-auto w-[240px] overflow-hidden rounded-[32px] border border-black/8 bg-white p-2">
                    <div
                      className="relative min-h-[360px] overflow-hidden rounded-[24px]"
                      style={draftSurfaceStyle}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.74)_58%,rgba(255,255,255,0)_100%)]" />
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/95 to-transparent" />
                      <div className={cn("relative z-10 flex min-h-[360px] flex-col justify-center gap-4 px-5", textAlignmentClass)}>
                        <h2 className={cn("whitespace-pre-line text-3xl leading-[0.96]", fontClass)} style={{ color: titleColor }}>
                          {liveTitle}
                        </h2>
                        <Button
                          variant="primary"
                          size="md"
                          className={cn("w-fit rounded-full px-5", fontClass)}
                          style={{ backgroundColor: ctaColor, color: "#fff" }}
                        >
                          {liveCta}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-black/6 px-6 py-5">
            <Button variant="ghost" onClick={() => setDraftImage(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveDraftImage()}>Save image</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
