"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";

const glassCardVariants = cva(
  "rounded-2xl transition-all duration-200",
  {
    variants: {
      variant: {
        default: "glass",
        elevated: "glass-elevated",
        inset: "bg-surface-tertiary/40 border border-white/[0.04]",
      },
      hover: {
        true: "glass-hover cursor-pointer",
        false: "",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: false,
      padding: "md",
    },
  }
);

export interface GlassCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, hover, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(glassCardVariants({ variant, hover, padding }), className)}
      {...props}
    />
  )
);

GlassCard.displayName = "GlassCard";
