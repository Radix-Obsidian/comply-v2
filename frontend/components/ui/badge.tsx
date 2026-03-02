"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-medium",
  {
    variants: {
      variant: {
        default: "bg-surface-tertiary/60 text-label-secondary",
        critical: "bg-accent-red/15 text-accent-red",
        warning: "bg-accent-orange/15 text-accent-orange",
        success: "bg-accent-green/15 text-accent-green",
        info: "bg-accent-blue/15 text-accent-blue",
        purple: "bg-accent-purple/15 text-accent-purple",
        muted: "bg-surface-tertiary/40 text-label-tertiary",
      },
      size: {
        sm: "px-2 py-0.5 text-caption-2",
        md: "px-2.5 py-1 text-caption-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}
