"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import { Crop as CropIcon, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/core/button";
import { 
  Dialog, 
  DialogPortal, 
  DialogOverlay, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/animate-ui/primitives/radix/dialog";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
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
  aspectRatio = 1 
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isOpen, setIsOpen] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(
      centerAspectCrop(width, height, aspectRatio)
    );
  }, [aspectRatio]);

  const getCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return;

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate scaling between displayed image and natural image
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to the cropped area size in natural pixels
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.imageSmoothingQuality = "high";

    // Draw the specific part of the image onto the canvas
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCropComplete(croppedImageUrl);
    setIsOpen(false);
  }, [completedCrop, onCropComplete]);

  const handleCancel = () => {
    setIsOpen(false);
    setTimeout(() => {
      onCancel();
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center z-[70]">
          <DialogContent
            style={{
              boxShadow: "var(--shadow-xl-shadow)",
            } satisfies React.CSSProperties}
            className="w-[90vw] max-w-[640px] bg-[--system-100] [corner-shape:squircle] rounded-[48px] overflow-hidden bg-[image:var(--gradient-popup)] p-[16px] flex flex-col gap-[12px] items-start backdrop-blur-[12px]"
            from="top"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <DialogHeader className="flex flex-row justify-between w-full h-[56px]">
              <DialogTitle className="title-xl text-white flex items-center gap-3">
                <CropIcon className="w-5 h-5" />
                قص الصورة
              </DialogTitle>
              <div 
                onClick={handleCancel} 
                className="w-5 h-5 cursor-pointer transition-opacity hover:opacity-60"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47714 0 0 4.47714 0 10C0 15.5229 4.47714 20 10 20C15.5229 20 20 15.5229 20 10C20 4.47714 15.5229 0 10 0ZM10.0001 9.03577L6.591 5.62668L5.62677 6.59091L9.03586 10L5.62677 13.4091L6.591 14.3733L10.0001 10.9642L13.4092 14.3733L14.3734 13.4091L10.9643 10L14.3734 6.59091L13.4092 5.62668L10.0001 9.03577Z" fill="white" fillOpacity="0.35"/>
                </svg>
              </div>
            </DialogHeader>

            <hr className="h-px w-full border-0 rounded-full"
              style={{
                background: "rgba(242, 242, 242, 0.30)",
                boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.30)",
              }}/>

            <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-white/10 rounded-[20px] min-h-[300px] max-h-[50vh]">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-h-[45vh]"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop"
                  onLoad={onImageLoad}
                  className="max-h-[45vh] object-contain"
                />
              </ReactCrop>
            </div>

            <div className="flex items-center justify-end w-full gap-3">
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-[12px] px-5"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={getCroppedImage}
                  className="bg-white text-[var(--system-600)] hover:bg-white/90 rounded-[12px] px-5"
                >
                  <Check className="w-4 h-4" />
                  تطبيق
                </Button>
              </div>
            </div>
          </DialogContent>
        </div>
      </DialogPortal>

      <canvas ref={canvasRef} className="hidden" />
    </Dialog>
  );
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

function Lightbox({ images, currentIndex, onClose, onIndexChange }: { 
  images: string[]; 
  currentIndex: number; 
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center relative">
      <button
        onClick={onClose}
        className="absolute top-4 end-4 p-2 text-white/70 hover:text-white z-10"
      >
        <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47714 0 0 4.47714 0 10C0 15.5229 4.47714 20 10 20C15.5229 20 20 15.5229 20 10C20 4.47714 15.5229 0 10 0ZM10.0001 9.03577L6.591 5.62668L5.62677 6.59091L9.03586 10L5.62677 13.4091L6.591 14.3733L10.0001 10.9642L13.4092 14.3733L14.3734 13.4091L10.9643 10L14.3734 6.59091L13.4092 5.62668L10.0001 9.03577Z" fill="currentColor"/>
        </svg>
      </button>
      
      <button
        onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
        className="absolute start-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center p-16">
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
        className="absolute end-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      
      <div className="absolute bottom-4 start-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => onIndexChange(idx)}
            className={`w-2 h-2 rounded-full transition-colors ${
              idx === currentIndex ? "bg-white" : "bg-white/40"
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    const newImages = [...images, croppedImageUrl];
    onImagesChange(newImages);
    setCropperImage(null);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleSetFeatured = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[0], newImages[index]] = [newImages[index], newImages[0]];
    onImagesChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverRef.current = index;
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverRef.current !== null && draggedIndex !== dragOverRef.current) {
      const newImages = [...images];
      const [removed] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverRef.current, 0, removed);
      onImagesChange(newImages);
    }
    setDraggedIndex(null);
    dragOverRef.current = null;
  };

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((img, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-move transition-all ${
                index === 0 ? "border-[#00853f]" : "border-transparent"
              } ${draggedIndex === index ? "opacity-50 scale-95" : ""}`}
            >
              <Image
                src={img}
                alt={`Product ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setLightboxIndex(index)}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-colors"
                  title="تكبير"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                {index !== 0 && (
                  <button
                    onClick={() => handleSetFeatured(index)}
                    className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-xs font-medium text-white hover:bg-white/30 transition-colors"
                  >
                    رئيسية
                  </button>
                )}
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="p-2 bg-red-500/80 backdrop-blur-sm rounded-xl text-white hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {index === 0 && (
                <span className="absolute top-2 start-2 bg-[#00853f] text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  رئيسية
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
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
          <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
            <svg className="w-10 h-10 mb-3 text-[var(--system-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-[var(--system-400)] mb-1">
              اسحب وأفلت الصور هنا
            </p>
            <p className="text-xs text-[var(--system-300)]">
              أو انقر للتصفح ({images.length}/{maxImages})
            </p>
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
