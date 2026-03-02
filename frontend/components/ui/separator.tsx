"use client";

import { cn } from "@/lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <div
      className={cn(
        "bg-separator/30",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className
      )}
      {...props}
    />
  );
}
