"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group relative inline-flex items-center justify-center outline-none cursor-pointer",
    "rounded-[22px]",
    "text-box-trim-both text-box-edge-cap-alphabetic",
    "transition-all duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-55",
    "focus-visible:ring-1 focus-visible:ring-[#6B97FF] ",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-[#00ACFF] text-[#EFEFEF] shadow-onboarding-cta hover:bg-[#009CE8] active:translate-y-px active:bg-[#008ED4]",
        secondary:
          "bg-[#EFEFEF] text-[#404040] shadow-button-soft hover:bg-[#E9E9E9] active:translate-y-px active:bg-[#E1E1E1]",
        outline:
          "border border-[#DCDCDC] bg-white text-[#404040] shadow-button-soft hover:bg-[#F7F7F7] active:translate-y-px active:bg-[#EFEFEF]",
        tertiary:
          "border border-[#DCDCDC] bg-white text-[#404040] shadow-button-soft hover:bg-[#F7F7F7] active:translate-y-px active:bg-[#EFEFEF]",
        ghost:
          "bg-transparent text-[#737373] hover:bg-[#EFEFEF] hover:text-[#404040] active:translate-y-px active:bg-[#E9E9E9]",
        danger:
          "bg-[var(--color-error)] text-white shadow-button-soft hover:opacity-90 active:translate-y-px active:opacity-80",
      },
      size: {
        sm: "text-caption h-8 gap-1 px-3 font-bold",
        md: "text-body-sm h-10 gap-1.5 px-4 font-bold",
        lg: "text-body h-11 gap-1.5 px-5 font-bold",
        xl: "onboarding-button-text h-12 gap-1.5 px-6",
        "icon-sm": "h-8 w-8 rounded-full p-0 [&_svg]:h-3.5 [&_svg]:w-3.5",
        icon: "h-10 w-10 rounded-full p-0 [&_svg]:h-4 [&_svg]:w-4",
        "icon-lg": "h-11 w-11 rounded-full p-0 [&_svg]:h-5 [&_svg]:w-5",
      },
      iconLeft: { true: "" },
      iconRight: { true: "" },
    },
    compoundVariants: [
      { size: "sm", iconLeft: true, className: "pl-[6px]" },
      { size: "md", iconLeft: true, className: "pl-[10px]" },
      { size: "lg", iconLeft: true, className: "pl-[14px]" },
      { size: "xl", iconLeft: true, className: "pl-[18px]" },
      { size: "sm", iconRight: true, className: "pr-[6px]" },
      { size: "md", iconRight: true, className: "pr-[10px]" },
      { size: "lg", iconRight: true, className: "pr-[14px]" },
      { size: "xl", iconRight: true, className: "pr-[16px]" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leadingIcon?: IconComponent;
  trailingIcon?: IconComponent;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isIconOnly = size === "icon" || size === "icon-sm" || size === "icon-lg";
    const iconSize = size === "sm" ? 14 : size === "lg" || size === "xl" ? 20 : 16;
    const isDisabled = disabled || loading;
    const childElement = isValidElement(children)
      ? (children as ReactElement<{ children?: ReactNode }>)
      : null;
    const contentChildren = asChild && childElement ? childElement.props.children : children;
    const buttonClassName = cn(
      buttonVariants({
        variant,
        size,
        iconLeft: !isIconOnly && !!LeadingIcon,
        iconRight: !isIconOnly && !!TrailingIcon,
      }),
      className
    );
    const buttonContent = loading ? (
      <>
        <span className="flex items-center justify-center gap-[inherit] opacity-0">
          {LeadingIcon && !isIconOnly && (
            <LeadingIcon size={iconSize} strokeWidth={2} />
          )}
          {contentChildren}
          {TrailingIcon && !isIconOnly && (
            <TrailingIcon size={iconSize} strokeWidth={2} />
          )}
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
              stroke="currentColor"
              strokeWidth="1.125"
              strokeLinecap="round"
              pathLength="100"
              style={{
                strokeDasharray: "15 85",
                animation: "spinner-move 2s linear infinite, spinner-dash 4s ease-in-out infinite",
              }}
            />
          </svg>
        </span>
      </>
    ) : isIconOnly ? (
      <span className="[&_svg]:stroke-[1.5] [&_svg]:transition-[stroke-width] [&_svg]:duration-80 group-hover:[&_svg]:stroke-[2]">
        {contentChildren}
      </span>
    ) : (
      <>
        {LeadingIcon && (
          <LeadingIcon
            size={iconSize}
            strokeWidth={1.5}
            className="transition-[stroke-width] duration-80 group-hover:stroke-[2]"
          />
        )}
        <span>{contentChildren}</span>
        {TrailingIcon && (
          <TrailingIcon
            size={iconSize}
            strokeWidth={1.5}
            className="transition-[stroke-width] duration-80 group-hover:stroke-[2]"
          />
        )}
      </>
    );

    if (asChild) {
      if (!childElement) return null;

      const child = childElement as ReactElement<{
        className?: string;
        onClick?: (event: MouseEvent<HTMLElement>) => void;
        style?: React.CSSProperties;
      }>;
      const childOnClick = child.props.onClick;

      return cloneElement(child, {
        ...props,
        className: cn(buttonClassName, child.props.className),
        "aria-disabled": isDisabled || undefined,
        style: { ...style, ...child.props.style },
        onClick: (event: MouseEvent<HTMLElement>) => {
          if (isDisabled) {
            event.preventDefault();
            return;
          }
          props.onClick?.(event as MouseEvent<HTMLButtonElement>);
          childOnClick?.(event);
        },
      }, buttonContent);
    }

    return (
      <button
        ref={ref}
        className={buttonClassName}
        disabled={isDisabled}
        style={style}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
