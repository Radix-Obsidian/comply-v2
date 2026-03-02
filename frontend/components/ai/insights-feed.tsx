"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { InsightCard } from "./insight-card";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import type { Insight } from "@/lib/types";

interface InsightsFeedProps {
  insights: Insight[];
  loading?: boolean;
  maxVisible?: number;
}

const STORAGE_KEY = "comply-dismissed-insights";

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function InsightsFeed({
  insights,
  loading,
  maxVisible = 5,
}: InsightsFeedProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  const handleDismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <GlassCard key={i} padding="md">
            <div className="flex items-start gap-3 pl-3">
              <Skeleton variant="rectangular" className="w-8 h-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  const visible = insights.filter((i) => !dismissed.has(i.id));
  const display = showAll ? visible : visible.slice(0, maxVisible);
  const hasMore = visible.length > maxVisible;

  if (visible.length === 0) {
    return (
      <GlassCard padding="lg" className="text-center">
        <p className="text-subheadline text-label-tertiary">
          All caught up — no actionable insights right now.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {display.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onDismiss={handleDismiss}
          />
        ))}
      </AnimatePresence>

      {hasMore && !showAll && (
        <div className="text-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
          >
            Show {visible.length - maxVisible} more
          </Button>
        </div>
      )}
    </div>
  );
}
