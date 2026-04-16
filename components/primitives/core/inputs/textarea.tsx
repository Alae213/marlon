import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full rounded-[var(--radius-md)] px-4 py-3 ${
            error 
              ? "ring-1 ring-destructive" 
              : ""
          } bg-card text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors resize-none disabled:bg-muted disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
