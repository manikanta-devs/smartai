import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
        outline: "border border-gray-300 bg-white hover:bg-gray-50",
        ghost: "hover:bg-gray-100 text-gray-900"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export const Button = ({ variant, size, disabled, onClick, type = "button", className, children }: ButtonProps) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={cn(buttonVariants({ variant, size }), className)}
  >
    {children}
  </button>
);
