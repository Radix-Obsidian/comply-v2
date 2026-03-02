"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AISummaryLineProps {
  text: string;
  loading?: boolean;
  className?: string;
}

export function AISummaryLine({ text, loading, className }: AISummaryLineProps) {
  if (loading) {
    return <Skeleton className="h-5 w-80" />;
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <Sparkles className="h-4 w-4 text-accent-purple shrink-0 mt-0.5" />
      <p className="text-subheadline text-label-secondary leading-relaxed">
        {text}
      </p>
    </div>
  );
}
