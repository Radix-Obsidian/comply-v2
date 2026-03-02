"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl bg-surface-secondary/60 border border-white/[0.06]",
      "px-4 py-3 text-callout text-label-primary placeholder:text-label-quaternary",
      "focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-transparent",
      "transition-all duration-200 resize-none scrollbar-thin",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
