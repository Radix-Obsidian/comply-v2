"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent-blue text-white hover:bg-accent-blue/90 active:scale-[0.98]",
        secondary:
          "glass glass-hover text-label-primary",
        ghost:
          "text-label-secondary hover:text-label-primary hover:bg-surface-secondary/60",
        destructive:
          "bg-accent-red/15 text-accent-red hover:bg-accent-red/25",
      },
      size: {
        sm: "h-8 px-3 text-footnote",
        md: "h-10 px-4 text-callout",
        lg: "h-12 px-6 text-body",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="h-4 w-4">{icon}</span>
      ) : null}
      {children}
    </button>
  )
);

Button.displayName = "Button";
