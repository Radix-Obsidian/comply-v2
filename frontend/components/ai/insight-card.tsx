"use client";

import { cn, severityColor, timeAgo } from "@/lib/utils";
import type { Insight } from "@/lib/types";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, AlertTriangle, AlertCircle, CheckCircle2, Info, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (id: string) => void;
}

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  success: CheckCircle2,
  recommendation: Lightbulb,
};

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const colors = severityColor(insight.severity);
  const Icon = SEVERITY_ICONS[insight.severity] || Info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <GlassCard
        padding="md"
        className={cn("relative overflow-hidden")}
      >
        {/* Severity accent line */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-0.5", colors.dot)} />

        <div className="flex items-start gap-3 pl-3">
          {/* Icon */}
          <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", colors.bg)}>
            <Icon className={cn("h-4 w-4", colors.text)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-headline text-label-primary">{insight.title}</p>
            <p className="text-footnote text-label-secondary mt-0.5">
              {insight.description}
            </p>

            {/* Action + timestamp */}
            <div className="flex items-center gap-3 mt-2.5">
              {insight.action && (
                insight.action.href ? (
                  <Link href={insight.action.href}>
                    <Button variant="ghost" size="sm" className="h-7 px-2.5 text-caption-1">
                      {insight.action.label}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="ghost" size="sm" className="h-7 px-2.5 text-caption-1">
                    {insight.action.label}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )
              )}
              <span className="text-caption-2 text-label-quaternary">
                {timeAgo(insight.timestamp)}
              </span>
            </div>
          </div>

          {/* Dismiss */}
          {onDismiss && (
            <button
              onClick={() => onDismiss(insight.id)}
              className="p-1 text-label-quaternary hover:text-label-secondary transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
