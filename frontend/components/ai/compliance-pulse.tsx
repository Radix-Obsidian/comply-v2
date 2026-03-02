"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { ComplianceGauge } from "@/components/ui/compliance-gauge";
import { AISummaryLine } from "./ai-summary-line";
import { Skeleton } from "@/components/ui/skeleton";

interface CompliancePulseProps {
  score: number;
  trend: "up" | "down" | "stable";
  trendDelta: number;
  aiSummary: string;
  loading?: boolean;
}

export function CompliancePulse({
  score,
  trend,
  trendDelta,
  aiSummary,
  loading,
}: CompliancePulseProps) {
  if (loading) {
    return (
      <GlassCard padding="lg" className="flex flex-col items-center gap-6">
        <Skeleton variant="circular" className="w-60 h-60" />
        <Skeleton className="h-5 w-80" />
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="lg" className="flex flex-col items-center gap-6">
      <ComplianceGauge
        score={score}
        size="lg"
        trend={trend}
        trendDelta={trendDelta}
        animated
      />
      <AISummaryLine text={aiSummary} />
    </GlassCard>
  );
}
