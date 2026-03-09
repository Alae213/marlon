import { HTMLAttributes } from "react";
import { Glasses } from "lucide-react";

interface ImagePlaceholderProps extends HTMLAttributes<HTMLDivElement> {
  aspectRatio?: string | number;
}

export function ImagePlaceholder({ aspectRatio = "4 / 5", className = "", ...props }: ImagePlaceholderProps) {
  const resolvedAspectRatio = typeof aspectRatio === "number" ? `${aspectRatio}` : aspectRatio;

  return (
    <div
      style={{ aspectRatio: resolvedAspectRatio }}
      className={`relative w-full overflow-hidden rounded-[14px] bg-gradient-to-br from-[var(--system-200)]/80 via-[var(--system-100)] to-white text-[var(--system-500)] shadow-[var(--shadow-md)] ${className}`}
      {...props}
    >
      <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_35%),radial-gradient(circle_at_70%_60%,rgba(146,146,146,0.25),transparent_45%)]" />
      <div className="relative flex h-full w-full items-center justify-center text-[var(--system-500)]">
        <Glasses className="h-8 w-8" strokeWidth={1.75} />
      </div>
    </div>
  );
}
