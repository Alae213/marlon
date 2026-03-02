import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full h-11 px-4 border ${
            error 
              ? "border-[#dc2626]" 
              : "border-[#e5e5e5] dark:border-[#404040]"
          } bg-white dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] transition-colors disabled:bg-[#f5f5f5] dark:disabled:bg-[#0a0a0a] disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-[#dc2626]">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
