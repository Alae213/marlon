import { HTMLAttributes, ReactNode } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  bgColor?: string;
  textColor?: string;
}

const variantStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  secondary: "bg-secondary text-secondary-foreground",
};

const variantIconColors = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
  secondary: "text-secondary-foreground",
};

export function Badge({ 
  className = "", 
  variant = "default", 
  icon,
  iconPosition = "left",
  bgColor,
  textColor,
  children, 
  ...props 
}: BadgeProps) {
  // If custom colors provided, use them; otherwise use variant styles
  const customStyle = bgColor || textColor ? {
    backgroundColor: bgColor,
    color: textColor,
  } : undefined;

  const iconColor = textColor || variantIconColors[variant];

  return (
    <span
      className={`overflow-hidden rounded-[8px] inline-flex items-center gap-1.5 px-2 py-1 text-micro-label shadow-[var(--shadow-badge)] ${!bgColor ? variantStyles[variant] : ""} ${className}`}
      style={customStyle}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span style={{ color: iconColor }}>{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span style={{ color: iconColor }}>{icon}</span>
      )}
    </span>
  );
}
