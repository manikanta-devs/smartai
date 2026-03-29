import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  variant?: "default" | "subtle";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, variant = "default", className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-lg px-3 py-2 text-sm font-normal transition-all duration-200",
          // Text color - always dark for readability
          "text-gray-900 dark:text-gray-100",
          // Placeholder
          "placeholder:text-gray-500 dark:placeholder:text-gray-400",
          // Default variant
          variant === "default" && [
            "border-2 border-gray-300 dark:border-gray-600",
            "bg-white dark:bg-gray-900",
            "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900",
            "hover:border-gray-400 dark:hover:border-gray-500"
          ],
          // Subtle variant
          variant === "subtle" && [
            "border border-transparent",
            "bg-gray-100 dark:bg-gray-800",
            "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900",
            "hover:bg-gray-200 dark:hover:bg-gray-700"
          ],
          // Disabled state
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-950",
          // Error state
          error && "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900",
          className
        )}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${props.id}-error`} className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
          ✕ {error}
        </p>
      )}
      {helper && !error && (
        <p id={`${props.id}-helper`} className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {helper}
        </p>
      )}
    </div>
  )
);

Input.displayName = "Input";
