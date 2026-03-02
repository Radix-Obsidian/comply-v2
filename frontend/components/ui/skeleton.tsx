"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className, variant = "text", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-surface-tertiary/40 rounded-lg",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 rounded",
        className
      )}
      {...props}
    />
  );
}
