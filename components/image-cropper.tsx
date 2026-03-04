"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import { X, Crop as CropIcon, Check, RotateCcw, Image as ImageIcon, GripVertical, ZoomIn } from "lucide-react";
import { Button } from "@/components/core/button";
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
  const [rotation, setRotation] = useState(0);
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

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rotRad = (rotation * Math.PI) / 180;
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.translate(crop.x * scaleX, crop.y * scaleY);
    ctx.rotate(rotRad);
    ctx.translate(-image.width * scaleX / 2, -image.height * scaleY / 2);
    ctx.scale(scaleX, scaleY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-bBoxWidth / 2, -bBoxHeight / 2);

    ctx.drawImage(image, 0, 0, bBoxWidth, bBoxHeight, 0, 0, bBoxWidth, bBoxHeight);

    const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCropComplete(croppedImageUrl);
  }, [completedCrop, rotation, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <CropIcon className="w-5 h-5" />
            قص الصورة
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-h-[50vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop"
              onLoad={onImageLoad}
              className="max-h-[50vh] object-contain"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </ReactCrop>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex items-center gap-2 px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            تدوير
          </button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button onClick={getCroppedImage}>
              <Check className="w-4 h-4" />
              تطبيق
            </Button>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
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
        <X className="w-8 h-8" />
      </button>
      
      <button
        onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
        className="absolute start-4 p-2 text-white/70 hover:text-white"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
        <Image
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          fill
          className="object-contain"
        />
      </div>
      
      <button
        onClick={() => onIndexChange((currentIndex + 1) % images.length)}
        className="absolute end-4 p-2 text-white/70 hover:text-white"
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
              className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-move transition-all ${
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
                  className="p-2 bg-white rounded-lg text-zinc-900 hover:bg-zinc-100"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {index !== 0 && (
                  <button
                    onClick={() => handleSetFeatured(index)}
                    className="p-2 bg-white rounded-lg text-xs font-medium text-zinc-900 hover:bg-zinc-100"
                  >
                    رئيسية
                  </button>
                )}
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {index === 0 && (
                <span className="absolute top-1 start-1 bg-[#00853f] text-white text-xs px-2 py-0.5 rounded-full">
                  رئيسية
                </span>
              )}
              <div className="absolute top-1 end-1 opacity-0 hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-[#00853f] bg-[#00853f]/5"
              : "border-zinc-200 dark:border-zinc-700 hover:border-[#00853f] hover:bg-[#00853f]/5"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
            <p className="text-sm text-zinc-500 mb-1">
              اسحب وأفلت الصور هنا
            </p>
            <p className="text-xs text-zinc-400">
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
