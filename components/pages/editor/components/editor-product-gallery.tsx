"use client";

import { useId, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { ArrowUp, ImagePlus, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/features/shared/image-cropper";

interface EditorProductGalleryProps {
  images: string[];
  productName: string;
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

function readImageFile(file: File, onLoad: (result: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    onLoad(reader.result as string);
  };
  reader.readAsDataURL(file);
}

export function EditorProductGallery({
  images,
  productName,
  onImagesChange,
  maxImages = 6,
}: EditorProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dropIndexRef = useRef<number | null>(null);
  const addInputId = useId();
  const replaceInputId = useId();

  const safeCurrentIndex = images.length === 0 ? 0 : Math.min(currentIndex, images.length - 1);
  const currentImage = images[safeCurrentIndex];
  const canAddMore = images.length < maxImages;

  const thumbnailImages = useMemo(
    () => images.map((image, index) => ({ image, index })),
    [images],
  );

  const openReplacePicker = () => {
    const input = document.getElementById(replaceInputId) as HTMLInputElement | null;
    input?.click();
  };

  const openAddPicker = () => {
    const input = document.getElementById(addInputId) as HTMLInputElement | null;
    input?.click();
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>, nextReplaceIndex: number | null) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    setReplaceIndex(nextReplaceIndex);
    readImageFile(file, setCropperImage);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    if (replaceIndex !== null) {
      const nextImages = [...images];
      nextImages[replaceIndex] = croppedImageUrl;
      onImagesChange(nextImages);
      setCurrentIndex(replaceIndex);
    } else {
      onImagesChange([...images, croppedImageUrl]);
      setCurrentIndex(images.length);
    }

    setCropperImage(null);
    setReplaceIndex(null);
  };

  const handleRemoveImage = (index: number) => {
    const nextImages = images.filter((_, imageIndex) => imageIndex !== index);
    onImagesChange(nextImages);
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return 0;
      }

      if (prev >= nextImages.length) {
        return Math.max(0, nextImages.length - 1);
      }

      return prev;
    });
  };

  const handleSetFeatured = (index: number) => {
    if (index === 0) {
      return;
    }

    const nextImages = [...images];
    const [featured] = nextImages.splice(index, 1);
    nextImages.unshift(featured);
    onImagesChange(nextImages);
    setCurrentIndex(0);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    dropIndexRef.current = index;
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dropIndexRef.current !== null && draggedIndex !== dropIndexRef.current) {
      const nextImages = [...images];
      const [movedImage] = nextImages.splice(draggedIndex, 1);
      nextImages.splice(dropIndexRef.current, 0, movedImage);
      onImagesChange(nextImages);
      setCurrentIndex(dropIndexRef.current);
    }

    setDraggedIndex(null);
    dropIndexRef.current = null;
  };

  const handleDropNewImage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    setReplaceIndex(null);
    readImageFile(file, setCropperImage);
  };

  return (
    <div className="space-y-4">
      <input
        id={addInputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileSelection(event, null)}
      />
      <input
        id={replaceInputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileSelection(event, safeCurrentIndex)}
      />

      {currentImage ? (
        <div className="space-y-4">
          <div className="rounded-[32px] border border-[var(--system-200)] bg-white p-3 shadow-[0_18px_42px_rgba(15,16,17,0.08)]">
            <div className="relative overflow-hidden rounded-[24px] border border-[var(--system-200)] bg-[var(--system-100)]">
              <div className="relative aspect-[4/4.6]">
                <Image
                  src={currentImage}
                  alt={productName || "Product image"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0)_58%,rgba(0,0,0,0.16)_100%)]" />

              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-[linear-gradient(180deg,rgba(20,20,20,0)_0%,rgba(20,20,20,0.72)_100%)] p-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1 text-caption text-white backdrop-blur">
                    <span>{safeCurrentIndex + 1}</span>
                  <span className="text-white/60">/</span>
                  <span>{images.length}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-full bg-white/12 px-4 text-white hover:bg-white/20 hover:text-white"
                    onClick={openReplacePicker}
                  >
                    Replace
                  </Button>
                  {safeCurrentIndex !== 0 ? (
                    <Button
                      variant="ghost"
                      className="rounded-full bg-white/12 px-4 text-white hover:bg-white/20 hover:text-white"
                      onClick={() => handleSetFeatured(safeCurrentIndex)}
                    >
                      <Star className="h-4 w-4" />
                      Featured
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-2 text-caption text-white backdrop-blur">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      Featured
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    className="rounded-full bg-[rgba(255,59,48,0.2)] px-4 text-white hover:bg-[rgba(255,59,48,0.35)] hover:text-white"
                    onClick={() => handleRemoveImage(currentIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {thumbnailImages.map(({ image, index }) => (
              <button
                key={`${image}-${index}`}
                type="button"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(event) => handleDragOver(event, index)}
                onDragEnd={handleDragEnd}
                onClick={() => setCurrentIndex(index)}
                className={`relative h-[5.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-[22px] border bg-white p-[3px] transition-all ${
                  index === currentIndex
                    ? "border-[var(--system-700)] shadow-[0_10px_24px_rgba(15,16,17,0.14)]"
                    : "border-[var(--system-200)] hover:border-[var(--system-400)]"
                } ${draggedIndex === index ? "scale-[0.96] opacity-60" : ""}`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[18px]">
                  <Image
                    src={image}
                    alt={`${productName || "Product"} thumbnail ${index + 1}`}
                    fill
                    sizes="72px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white">
                    Main
                  </span>
                ) : null}
              </button>
            ))}

            {canAddMore ? (
              <button
                type="button"
                onClick={openAddPicker}
                className="flex h-[5.75rem] w-[4.75rem] shrink-0 flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-[var(--system-300)] bg-white text-[var(--system-500)] transition-colors hover:border-[var(--system-500)] hover:bg-[var(--system-100)]"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-caption">Add</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDropNewImage}
          className={`rounded-[32px] border border-dashed bg-white p-4 shadow-[0_18px_42px_rgba(15,16,17,0.06)] transition-colors ${
            isDragging
              ? "border-[var(--system-700)] bg-[var(--system-100)]"
              : "border-[var(--system-300)]"
          }`}
        >
          <button
            type="button"
            onClick={openAddPicker}
            className="flex w-full flex-col items-center justify-center gap-5 rounded-[26px] border border-[var(--system-200)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f5f5_100%)] px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,16,17,0.06)] transition-transform hover:scale-[1.01]"
          >
            <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-[var(--system-100)] text-[var(--system-700)]">
              <Upload className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <p className="text-title text-[var(--system-700)]">Upload your first product image</p>
              <p className="mx-auto max-w-sm text-body text-[var(--system-400)]">
                Drop an image here or browse your files. The first image becomes the featured storefront image.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--system-700)] px-4 py-2 text-body-sm text-white">
              <ImagePlus className="h-4 w-4" />
              Choose image
            </span>
          </button>
        </div>
      )}

      {cropperImage ? (
        <ImageCropper
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropperImage(null);
            setReplaceIndex(null);
          }}
        />
      ) : null}

      {images.length > 1 ? (
        <div className="rounded-[24px] border border-[var(--system-200)] bg-white p-4 text-body-sm text-[var(--system-500)]">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4" />
            Drag thumbnails to reorder images. The first image is the featured storefront image.
          </div>
        </div>
      ) : null}
    </div>
  );
}
