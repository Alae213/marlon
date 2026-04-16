"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CardPadding = "none" | "sm" | "md" | "lg";

const cardPaddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-[var(--spacing-sm)]",
  md: "p-[var(--spacing-md)]",
  lg: "p-[var(--spacing-lg)]",
};

function Card({
  className,
  padding = "md",
  ...props
}: React.ComponentProps<"div"> & { padding?: CardPadding }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)] shadow-[var(--shadow-md)]",
        cardPaddingClasses[padding],
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-[var(--spacing-lg)]", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-heading text-[var(--system-700)]", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-body-sm text-[var(--system-400)]", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-[var(--spacing-lg)]", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center p-[var(--spacing-lg)] pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
