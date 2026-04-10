import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variantStyles = {
  primary: 
    "bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground shadow-[var(--shadow-xl-shadow)] overflow-hidden",
  
  secondary: 
    "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 disabled:opacity-40",
  
  outline: 
    "border border-border text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/40",
  
  ghost: 
    "text-foreground hover:bg-accent/50 dark:hover:bg-accent/50",
  
  link: 
    "text-primary underline-offset-4 hover:underline",
  
  danger: 
    "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 disabled:bg-destructive/50",
};

const sizeStyles = {
  sm: "h-8 px-4 text-sm rounded-xl",
  md: "h-9 px-6 text-sm rounded-xl",
  lg: "h-11 px-8 text-base rounded-2xl",
};  

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`body-base cursor-pointer inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
