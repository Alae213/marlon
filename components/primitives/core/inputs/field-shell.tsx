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
      "border-[color:var(--field-border-light)] bg-[color:var(--field-surface-light)] text-[color:var(--field-text-light)] shadow-[var(--field-shadow-light)] focus-within:border-[color:var(--field-focus-light)] focus-within:ring-[3px] focus-within:ring-[color:var(--field-focus-ring-light)]",
    label: "text-[color:var(--field-label-light)]",
    supporting: "text-[color:var(--field-supporting-light)]",
    input:
      "text-[color:var(--field-text-light)] placeholder:text-[color:var(--field-placeholder-light)]",
  },
  dark: {
    surface:
      "border-[color:var(--field-border-dark)] bg-[color:var(--field-surface-dark)] text-[color:var(--field-text-dark)] shadow-[var(--field-shadow-dark)] focus-within:border-[color:var(--field-focus-dark)] focus-within:ring-[3px] focus-within:ring-[color:var(--field-focus-ring-dark)]",
    label: "text-[color:var(--field-label-dark)]",
    supporting: "text-[color:var(--field-supporting-dark)]",
    input:
      "text-[color:var(--field-text-dark)] placeholder:text-[color:var(--field-placeholder-dark)]",
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
            "mb-[var(--field-label-gap)] block text-body-sm",
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
          "group relative w-full rounded-[var(--field-group-radius)] border transition-[border-color,box-shadow,background-color,color]",
          layout === "row"
            ? "flex min-h-[var(--field-row-min-height)] items-center gap-[var(--field-accessory-gap)] px-[var(--field-padding-x)] py-[var(--field-padding-y)]"
            : "px-[var(--field-padding-x)] py-[var(--field-padding-y)]",
          disabled && "opacity-60",
          tone.surface,
          error &&
            (variant === "dark"
              ? "border-[color:var(--field-error-dark)] focus-within:border-[color:var(--field-error-dark)] focus-within:ring-[color:var(--field-error-ring-dark)]"
              : "border-[color:var(--field-error-light)] focus-within:border-[color:var(--field-error-light)] focus-within:ring-[color:var(--field-error-ring-light)]"),
          surfaceClassName,
        )}
      >
        {label && layout === "row" ? (
          <label
            htmlFor={id}
            className={cn(
              "min-w-0 shrink-0 pe-[var(--field-separator-inset)] text-body-sm",
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
            "mt-[var(--field-support-gap)] text-caption",
            error
              ? variant === "dark"
                ? "text-[color:var(--field-error-dark)]"
                : "text-[color:var(--field-error-light)]"
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
