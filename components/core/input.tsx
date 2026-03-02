import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute start-4 top-1/2 -translate-y-1/2 text-[#a3a3a3]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full h-11 ${icon ? "ps-12" : "px-4"} pe-4 bg-white dark:bg-[#171717] border ${
              error 
                ? "border-[#dc2626]" 
                : "border-[#e5e5e5] dark:border-[#404040]"
            } text-[#171717] dark:text-[#fafafa] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] transition-colors disabled:bg-[#f5f5f5] dark:disabled:bg-[#0a0a0a] disabled:cursor-not-allowed ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-[#dc2626]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
