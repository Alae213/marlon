"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

export function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // If only one image, don't show carousel controls
  if (images.length === 1) {
    return (
      <div className="relative aspect-square bg-[var(--system-100)] dark:bg-[var(--system-600)] rounded-2xl overflow-hidden">
        <Image
          src={images[0]}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative aspect-square bg-[var(--system-100)] dark:bg-[var(--system-600)] rounded-2xl overflow-hidden">
        <Image
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
        
        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute start-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-black/50 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-black/70 transition-colors shadow-lg"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--system-600)] dark:text-[var(--system-50)]" />
        </button>
        
        <button
          onClick={goToNext}
          className="absolute end-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-black/50 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-black/70 transition-colors shadow-lg"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5 text-[var(--system-600)] dark:text-[var(--system-50)]" />
        </button>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                index === currentIndex
                  ? "border-[var(--system-600)] dark:border-[var(--system-50)]"
                  : "border-transparent hover:border-[var(--system-300)]"
              }`}
            >
              <Image
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? "bg-[var(--system-600)] dark:bg-[var(--system-50)]"
                  : "bg-[var(--system-200)] dark:bg-[var(--system-400)]"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
