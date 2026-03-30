import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400 shadow-lg shadow-indigo-950/25",
        secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
        outline: "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/20",
        ghost: "text-slate-200 hover:bg-white/10"
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
