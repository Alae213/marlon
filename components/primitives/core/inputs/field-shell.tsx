import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type FieldVariant = "light" | "dark";
export type FieldLayout = "stacked" | "row";

interface FieldShellProps {
  id: string;
  label?: ReactNode;
  supportingText?: ReactNode;
  error?: ReactNode;
  variant?: FieldVariant;
  layout?: FieldLayout;
  disabled?: boolean;
  containerClassName?: string;
  surfaceClassName?: string;
  labelClassName?: string;
  supportingTextClassName?: string;
  children: ReactNode;
}

const toneClasses: Record<
  FieldVariant,
  {
    surface: string;
    label: string;
    supporting: string;
    input: string;
  }
> = {
  light: {
    surface:
      "border-none bg-[var(--system-600)] text-[var(--system-100)] ",
    label: "text-[var(--system-300)]",
    supporting: "text-[var(--system-200)]",
    input:
      "text-[var(--system-100)] placeholder:text-[var(--system-400)]",
  },
  dark: {
    surface:
      "border-none bg-[var(--system-600)] text-[var(--system-100)] ",
    label: "text-[var(--system-300)]",
    supporting: "text-[var(--system-200)]",
    input:
      "text-[var(--system-100)] placeholder:text-[var(--system-400)]",
  },
};

export function getFieldInputClasses(variant: FieldVariant = "light") {
  return toneClasses[variant].input;
}

export function FieldShell({
  id,
  label,
  supportingText,
  error,
  variant = "light",
  layout = "stacked",
  disabled = false,
  containerClassName,
  surfaceClassName,
  labelClassName,
  supportingTextClassName,
  children,
}: FieldShellProps) {
  const supportText = error ?? supportingText;
  const tone = toneClasses[variant];

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && layout === "stacked" ? (
        <label
          htmlFor={id}
          className={cn(
            "mb-2 block text-body-sm font-medium",
            tone.label,
            labelClassName,
          )}
        >
          {label}
        </label>
      ) : null}

      <div
        data-variant={variant}
        data-layout={layout}
        data-invalid={error ? "true" : "false"}
        className={cn(
          "group relative w-full rounded-[16px] border transition-[border-color,background-color,color]",
          layout === "row"
            ? "flex min-h-10 items-center gap-2 px-3 py-2"
            : "px-3 py-2",
          disabled && "opacity-60",
          tone.surface,
          error &&
            (variant === "dark"
              ? "border-[var(--color-error)] focus-within:border-[var(--color-error)] focus-within:ring-[var(--color-error)]/20"
              : "border-[var(--color-error)] focus-within:border-[var(--color-error)] focus-within:ring-[var(--color-error)]/20"),
          surfaceClassName,
        )}
      >
        {label && layout === "row" ? (
          <label
            htmlFor={id}
            className={cn(
              "min-w-0 shrink-0 pr-2 text-body-sm font-medium",
              tone.label,
              labelClassName,
            )}
          >
            {label}
          </label>
        ) : null}
        {children}
      </div>

      {supportText ? (
        <p
          id={`${id}-support`}
          className={cn(
            "mt-1 text-caption",
            error
              ? variant === "dark"
                ? "text-[var(--color-error)]"
                : "text-[var(--color-error)]"
              : tone.supporting,
            supportingTextClassName,
          )}
        >
          {supportText}
        </p>
      ) : null}
    </div>
  );
}
