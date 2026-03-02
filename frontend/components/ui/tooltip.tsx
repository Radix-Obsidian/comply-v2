"use client";

import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50",
          "px-2.5 py-1.5 rounded-lg text-caption-1 font-medium",
          "bg-surface-tertiary text-label-primary shadow-elevated",
          "opacity-0 group-hover:opacity-100 pointer-events-none",
          "transition-opacity duration-150 whitespace-nowrap",
          side === "top" && "bottom-full mb-2",
          side === "bottom" && "top-full mt-2"
        )}
      >
        {content}
      </div>
    </div>
  );
}
