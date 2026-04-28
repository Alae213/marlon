import * as React from "react";

import { cn } from "@/lib/utils";

import { FieldShell, FieldVariant, getFieldInputClasses } from "./field-shell";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  supportingText?: React.ReactNode;
  error?: React.ReactNode;
  variant?: FieldVariant;
  containerClassName?: string;
  surfaceClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      disabled,
      error,
      id,
      label,
      rows = 4,
      spellCheck = true,
      supportingText,
      surfaceClassName,
      variant = "light",
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? `textarea-${generatedId}`;
    const describedBy = error || supportingText ? `${textareaId}-support` : undefined;

    return (
      <FieldShell
        id={textareaId}
        label={label}
        supportingText={supportingText}
        error={error}
        variant={variant}
        disabled={disabled}
        containerClassName={containerClassName}
        surfaceClassName={surfaceClassName}
      >
        <textarea
          ref={ref}
          id={textareaId}
          data-slot="ios-textarea"
          data-variant={variant}
          data-invalid={error ? "true" : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          rows={rows}
          disabled={disabled}
          spellCheck={spellCheck}
          className={cn(
            "text-[var(--system-100)] block min-h-[var(--field-textarea-min-height)] w-full resize-none border-0 bg-transparent p-0 text-body outline-none ring-0",
            "disabled:cursor-not-allowed",
            getFieldInputClasses(variant),
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);

Textarea.displayName = "Textarea";
