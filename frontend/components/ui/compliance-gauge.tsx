"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComplianceGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  showLabel?: boolean;
  trend?: "up" | "down" | "stable";
  trendDelta?: number;
}

const SIZES = { sm: 80, md: 160, lg: 240 };
const STROKE_WIDTHS = { sm: 6, md: 10, lg: 14 };

function scoreColor(score: number): string {
  if (score < 40) return "rgb(var(--accent-red))";
  if (score < 70) return "rgb(var(--accent-orange))";
  return "rgb(var(--accent-green))";
}

export function ComplianceGauge({
  score,
  size = "lg",
  animated = true,
  showLabel = true,
  trend,
  trendDelta,
}: ComplianceGaugeProps) {
  const dim = SIZES[size];
  const strokeWidth = STROKE_WIDTHS[size];
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = dim / 2;

  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const motionScore = useMotionValue(0);
  const dashOffset = useTransform(
    motionScore,
    [0, 100],
    [circumference, 0]
  );

  useEffect(() => {
    if (animated) {
      const controls = animate(motionScore, score, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate: (v) => setDisplayScore(Math.round(v)),
      });
      return controls.stop;
    } else {
      motionScore.set(score);
      setDisplayScore(score);
    }
  }, [score, animated, motionScore]);

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgb(var(--surface-tertiary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Animated arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={scoreColor(score)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-bold tabular-nums",
              size === "lg" && "text-display",
              size === "md" && "text-title-1",
              size === "sm" && "text-title-3"
            )}
            style={{ color: scoreColor(score) }}
          >
            {displayScore}
          </span>
          {showLabel && size !== "sm" && (
            <span className="text-caption-1 text-label-tertiary -mt-1">
              compliance
            </span>
          )}
        </div>
      </div>

      {/* Trend indicator */}
      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 text-footnote",
            trend === "up" && "text-accent-green",
            trend === "down" && "text-accent-red",
            trend === "stable" && "text-label-tertiary"
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          <span>
            {trendDelta !== undefined && trendDelta !== 0
              ? `${trendDelta > 0 ? "+" : ""}${trendDelta}%`
              : "Stable"}
          </span>
        </div>
      )}
    </div>
  );
}
