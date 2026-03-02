import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variantStyles = {
  primary: "bg-[#171717] text-[#fafafa] hover:bg-[#404040] disabled:bg-[#a3a3a3] disabled:text-[#737373]",
  secondary: "bg-[#f5f5f5] text-[#171717] hover:bg-[#e5e5e5] dark:bg-[#262626] dark:text-[#fafafa] dark:hover:bg-[#404040] disabled:opacity-40",
  outline: "border border-[#e5e5e5] dark:border-[#404040] text-[#171717] dark:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#171717] disabled:opacity-40",
  ghost: "text-[#525252] dark:text-[#a3a3a3] hover:bg-[#f5f5f5] dark:hover:bg-[#171717] disabled:opacity-40",
  danger: "bg-[#dc2626] text-[#fafafa] hover:bg-[#b91c1c] disabled:bg-[#fca5a5]",
};

const sizeStyles = {
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
