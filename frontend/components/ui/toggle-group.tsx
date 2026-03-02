"use client";

import { cn } from "@/lib/utils";

interface ToggleGroupProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
}

export function ToggleGroup({ options, value, onChange, size = "md" }: ToggleGroupProps) {
  return (
    <div className="inline-flex rounded-xl bg-surface-tertiary/40 p-1 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-lg transition-all duration-200 font-medium",
            size === "sm" ? "px-3 py-1.5 text-caption-1" : "px-4 py-2 text-footnote",
            value === opt.value
              ? "bg-surface-secondary text-label-primary shadow-glass"
              : "text-label-tertiary hover:text-label-secondary"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
