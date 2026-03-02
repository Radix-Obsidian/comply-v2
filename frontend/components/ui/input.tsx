"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl bg-surface-secondary/60 border border-white/[0.06]",
          "px-4 py-2.5 text-callout text-label-primary placeholder:text-label-quaternary",
          "focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-transparent",
          "transition-all duration-200",
          icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  )
);

Input.displayName = "Input";
