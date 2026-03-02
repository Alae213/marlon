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
          <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 border ${
            error 
              ? "border-[#dc2626]" 
              : "border-[#e5e5e5] dark:border-[#404040]"
          } bg-white dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] transition-colors resize-none disabled:bg-[#f5f5f5] dark:disabled:bg-[#0a0a0a] disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[#dc2626]">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
