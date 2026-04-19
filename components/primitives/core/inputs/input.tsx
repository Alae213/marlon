import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  FieldShell,
  FieldLayout,
  FieldVariant,
  getFieldInputClasses,
} from "./field-shell";

export interface InputProps extends React.ComponentProps<"input"> {
  label?: React.ReactNode;
  supportingText?: React.ReactNode;
  error?: React.ReactNode;
  variant?: FieldVariant;
  layout?: FieldLayout;
  leadingAccessory?: React.ReactNode;
  trailingAccessory?: React.ReactNode;
  showClearButton?: boolean;
  containerClassName?: string;
  surfaceClassName?: string;
}

function getDefaultTraits(type?: React.HTMLInputTypeAttribute) {
  switch (type) {
    case "email":
      return {
        autoCapitalize: "none" as const,
        autoComplete: "email",
        enterKeyHint: "next" as const,
        inputMode: "email" as const,
        spellCheck: false,
      };
    case "password":
      return {
        autoCapitalize: "none" as const,
        autoComplete: "current-password",
        enterKeyHint: "done" as const,
        spellCheck: false,
      };
    case "search":
      return {
        autoCapitalize: "sentences" as const,
        enterKeyHint: "search" as const,
        inputMode: "search" as const,
        spellCheck: true,
      };
    case "tel":
      return {
        autoCapitalize: "none" as const,
        autoComplete: "tel",
        enterKeyHint: "next" as const,
        inputMode: "tel" as const,
        spellCheck: false,
      };
    case "number":
      return {
        autoCapitalize: "none" as const,
        enterKeyHint: "done" as const,
        inputMode: "decimal" as const,
        spellCheck: false,
      };
    case "url":
      return {
        autoCapitalize: "none" as const,
        autoComplete: "url",
        enterKeyHint: "go" as const,
        inputMode: "url" as const,
        spellCheck: false,
      };
    default:
      return {
        autoCapitalize: "sentences" as const,
        enterKeyHint: "next" as const,
        spellCheck: true,
      };
  }
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      autoCapitalize,
      autoComplete,
      className,
      containerClassName,
      disabled,
      enterKeyHint,
      error,
      id,
      inputMode,
      label,
      layout = "stacked",
      leadingAccessory,
      readOnly,
      showClearButton = false,
      spellCheck,
      supportingText,
      surfaceClassName,
      trailingAccessory,
      type = "text",
      value,
      variant = "light",
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? `input-${generatedId}`;
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const mergedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;

        if (typeof ref === "function") {
          ref(node);
          return;
        }

        if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const traits = getDefaultTraits(type);
    const currentValue =
      typeof value === "string" || typeof value === "number" ? String(value) : "";
    const canClear = Boolean(
      showClearButton &&
        currentValue &&
        !disabled &&
        !readOnly &&
        type !== "password" &&
        props.onChange,
    );

    const handleClear = React.useCallback(() => {
      const node = inputRef.current;

      if (!node) return;

      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;

      setter?.call(node, "");
      node.dispatchEvent(new window.Event("input", { bubbles: true }));
      node.dispatchEvent(new window.Event("change", { bubbles: true }));
      node.focus();
    }, []);

    const describedBy = error || supportingText ? `${inputId}-support` : undefined;

    return (
      <FieldShell
        id={inputId}
        label={label}
        supportingText={supportingText}
        error={error}
        variant={variant}
        layout={layout}
        disabled={disabled}
        containerClassName={containerClassName}
        surfaceClassName={surfaceClassName}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-[var(--field-accessory-gap)]",
            layout === "stacked" &&
              "min-h-[calc(var(--field-row-min-height)-var(--field-padding-y)*2)]",
          )}
        >
          {leadingAccessory ? (
            <span className="shrink-0 text-[color:inherit]/70">{leadingAccessory}</span>
          ) : null}

          <input
            ref={mergedRef}
            id={inputId}
            type={type}
            data-slot="ios-input"
            data-variant={variant}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            autoCapitalize={autoCapitalize ?? traits.autoCapitalize}
            autoComplete={autoComplete ?? traits.autoComplete}
            enterKeyHint={enterKeyHint ?? traits.enterKeyHint}
            inputMode={inputMode ?? traits.inputMode}
            spellCheck={spellCheck ?? traits.spellCheck}
            readOnly={readOnly}
            disabled={disabled}
            className={cn(
              "min-w-0 flex-1 border-0 bg-transparent p-0 text-body outline-none ring-0",
              "disabled:cursor-not-allowed",
              layout === "row" && "text-right",
              getFieldInputClasses(variant),
              className,
            )}
            value={value}
            {...props}
          />

          {canClear || trailingAccessory ? (
            <span className="flex shrink-0 items-center gap-1.5">
              {canClear ? (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label={`Clear ${typeof label === "string" ? label.toLowerCase() : "field"}`}
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                    variant === "dark"
                      ? "bg-white/12 text-white/60 hover:bg-white/18 hover:text-white/80"
                      : "bg-black/6 text-black/45 hover:bg-black/10 hover:text-black/60",
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
              {trailingAccessory ? <span className="shrink-0">{trailingAccessory}</span> : null}
            </span>
          ) : null}
        </div>
      </FieldShell>
    );
  },
);

Input.displayName = "Input";
