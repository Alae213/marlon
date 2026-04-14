"use client";

import { useCallback, useRef, useState, useEffect, type ChangeEvent, type DragEvent, type SyntheticEvent } from "react";
import Image from "next/image";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import { Check, Crop as CropIcon } from "lucide-react";
import { Button } from "@/components/primitives/core/buttons/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  const crop = makeAspectCrop(
    {
      unit: "%",
      width: 90,
    },
    aspect,
    mediaWidth,
    mediaHeight
  );

  return centerCrop(crop, mediaWidth, mediaHeight);
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isOpen, setIsOpen] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = event.currentTarget;
      if (aspectRatio > 0) {
        setCrop(centerAspectCrop(width, height, aspectRatio));
        return;
      }

      setCrop({
        unit: "%",
        x: 5,
        y: 5,
        width: 90,
        height: 90,
      });
    },
    [aspectRatio]
  );

  const getCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const currentCrop = completedCrop;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = currentCrop.width * scaleX;
    canvas.height = currentCrop.height * scaleY;
    context.imageSmoothingQuality = "high";

    context.drawImage(
      image,
      currentCrop.x * scaleX,
      currentCrop.y * scaleY,
      currentCrop.width * scaleX,
      currentCrop.height * scaleY,
      0,
      0,
      currentCrop.width * scaleX,
      currentCrop.height * scaleY
    );

    const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCropComplete(croppedImageUrl);
    setIsOpen(false);
  }, [completedCrop, onCropComplete]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      onCancel();
    }, 200);
  }, [onCancel]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/30"
        style={{ boxShadow: "var(--shadow-xl-shadow)" }}
        className="max-w-[640px] gap-[12px] overflow-hidden rounded-[48px] border-white/10 bg-[--system-100] bg-[image:var(--gradient-popup)] p-[16px] text-white backdrop-blur-[12px] [corner-shape:squircle]"
      >
        <DialogHeader className="w-full gap-[12px]">
          <div className="flex h-[56px] items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-3 text-modal text-white">
              <CropIcon className="h-5 w-5" />
              Crop image
            </DialogTitle>
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Close crop dialog"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 0C4.47714 0 0 4.47714 0 10C0 15.5229 4.47714 20 10 20C15.5229 20 20 15.5229 20 10C20 4.47714 15.5229 0 10 0ZM10.0001 9.03577L6.591 5.62668L5.62677 6.59091L9.03586 10L5.62677 13.4091L6.591 14.3733L10.0001 10.9642L13.4092 14.3733L14.3734 13.4091L10.9643 10L14.3734 6.59091L13.4092 5.62668L10.0001 9.03577Z"
                  fill="currentColor"
                  fillOpacity="0.6"
                />
              </svg>
            </button>
          </div>

          <hr
            className="h-px w-full rounded-full border-0"
            style={{
              background: "rgba(242, 242, 242, 0.30)",
              boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.30)",
            }}
          />
        </DialogHeader>

        <div className="flex min-h-[300px] max-h-[50vh] flex-1 items-center justify-center overflow-auto rounded-[20px] bg-white/10 p-2">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(currentCrop) => setCompletedCrop(currentCrop)}
            aspect={aspectRatio > 0 ? aspectRatio : undefined}
            className="max-h-[45vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[45vh] object-contain"
            />
          </ReactCrop>
        </div>

        <div className="flex w-full items-center justify-end gap-3">
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="rounded-[12px] bg-white/10 px-5 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={getCroppedImage}
              className="rounded-[12px] bg-white px-5 text-[var(--system-600)] hover:bg-white/90"
            >
              <Check className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>

      <canvas ref={canvasRef} className="hidden" />
    </Dialog>
  );
}

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

function Lightbox({ images, currentIndex, onClose, onIndexChange }: LightboxProps) {
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: globalThis.KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "ArrowLeft") {
      onIndexChange((currentIndex - 1 + images.length) % images.length);
    } else if (event.key === "ArrowRight") {
      onIndexChange((currentIndex + 1) % images.length);
    }
  }, [onClose, onIndexChange, currentIndex, images.length]);

  useEffect(() => {
    // Add keyboard listener
    window.addEventListener("keydown", handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div 
      className="fixed inset-0 z-[var(--z-dialog)] relative flex items-center justify-center bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${currentIndex + 1} of ${images.length}`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 end-4 z-10 p-2 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40 rounded-lg"
        aria-label="Close lightbox"
      >
        <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 0C4.47714 0 0 4.47714 0 10C0 15.5229 4.47714 20 10 20C15.5229 20 20 15.5229 20 10C20 4.47714 15.5229 0 10 0ZM10.0001 9.03577L6.591 5.62668L5.62677 6.59091L9.03586 10L5.62677 13.4091L6.591 14.3733L10.0001 10.9642L13.4092 14.3733L14.3734 13.4091L10.9643 10L14.3734 6.59091L13.4092 5.62668L10.0001 9.03577Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <button
        onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
        className="absolute start-4 rounded-full p-3 text-white/70 transition-all hover:bg-white/10 hover:text-white"
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="relative flex h-full max-h-[80vh] w-full max-w-4xl items-center justify-center p-16">
        <Image
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          fill
          unoptimized
          className="object-contain"
        />
      </div>

      <button
        onClick={() => onIndexChange((currentIndex + 1) % images.length)}
        className="absolute end-4 rounded-full p-3 text-white/70 transition-all hover:bg-white/10 hover:text-white"
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-4 start-1/2 flex -translate-x-1/2 gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => onIndexChange(index)}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function ImageUploader({ images, onImagesChange, maxImages = 5 }: ImageUploaderProps) {
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const [file] = files;
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    onImagesChange([...images, croppedImageUrl]);
    setCropperImage(null);
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleSetFeatured = (index: number) => {
    if (index === 0) {
      return;
    }

    const reorderedImages = [...images];
    [reorderedImages[0], reorderedImages[index]] = [reorderedImages[index], reorderedImages[0]];
    onImagesChange(reorderedImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    dragOverRef.current = index;
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverRef.current !== null && draggedIndex !== dragOverRef.current) {
      const reorderedImages = [...images];
      const [removedImage] = reorderedImages.splice(draggedIndex, 1);
      reorderedImages.splice(dragOverRef.current, 0, removedImage);
      onImagesChange(reorderedImages);
    }

    setDraggedIndex(null);
    dragOverRef.current = null;
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(event) => handleDragOver(event, index)}
              onDragEnd={handleDragEnd}
              className={`relative aspect-square cursor-move overflow-hidden rounded-2xl border-2 transition-all ${
                index === 0 ? "border-[#00853f]" : "border-transparent"
              } ${draggedIndex === index ? "scale-95 opacity-50" : ""}`}
            >
              <Image
                src={image}
                alt={`Product ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <button
                  onClick={() => setLightboxIndex(index)}
                  className="rounded-xl bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  title="Zoom"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </button>
                {index !== 0 && (
                  <button
                    onClick={() => handleSetFeatured(index)}
                    className="rounded-xl bg-white/20 p-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                  >
                    Featured
                  </button>
                )}
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="rounded-xl bg-red-500/80 p-2 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {index === 0 && (
                <span className="absolute top-2 start-2 rounded-full bg-[#00853f] px-2.5 py-1 text-xs font-medium text-white">
                  Featured
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? "border-[#00853f] bg-[#00853f]/5"
              : "border-[var(--system-200)] hover:border-[#00853f] hover:bg-[#00853f]/5"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="flex cursor-pointer flex-col items-center">
            <svg className="mb-3 h-10 w-10 text-[var(--system-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mb-1 text-sm text-[var(--system-400)]">Drag and drop images here</p>
            <p className="text-xs text-[var(--system-300)]">Or click to browse ({images.length}/{maxImages})</p>
          </label>
        </div>
      )}

      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
        />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
