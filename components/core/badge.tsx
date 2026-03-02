import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "secondary";
}

const variantStyles = {
  default: "bg-[#f5f5f5] text-[#525252] dark:bg-[#262626] dark:text-[#d4d4d4]",
  success: "bg-[#dcfce7] text-[#16a34a] dark:bg-[#14532d] dark:text-[#86efac]",
  warning: "bg-[#fef3c7] text-[#d97706] dark:bg-[#78350f] dark:text-[#fcd34d]",
  danger: "bg-[#fee2e2] text-[#dc2626] dark:bg-[#7f1d1d] dark:text-[#fca5a5]",
  info: "bg-[#dbeafe] text-[#2563eb] dark:bg-[#1e3a8a] dark:text-[#93c5fd]",
  secondary: "bg-[#171717] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#171717]",
};

export function Badge({ 
  className = "", 
  variant = "default", 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
