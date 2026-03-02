"use client";

import { useDeadlines } from "@/lib/hooks/use-deadlines";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export function UpcomingDeadlines() {
  const { data: events, isLoading } = useDeadlines(90);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton variant="circular" className="w-3 h-3" />
            <Skeleton className="h-4 w-64" />
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <GlassCard padding="lg" className="text-center">
        <CalendarDays className="h-8 w-8 text-label-quaternary mx-auto mb-2 opacity-60" />
        <p className="text-subheadline text-label-tertiary">
          No upcoming deadlines in the next 90 days.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-1">
      {events.slice(0, 6).map((event, idx) => {
        const days = daysUntil(event.due_date);
        const urgency =
          days <= 3 ? "critical" : days <= 7 ? "warning" : days <= 30 ? "info" : "muted";

        return (
          <div key={event.id} className="flex items-start gap-4 py-2.5">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center shrink-0 pt-1.5">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  urgency === "critical" && "bg-accent-red",
                  urgency === "warning" && "bg-accent-orange",
                  urgency === "info" && "bg-accent-blue",
                  urgency === "muted" && "bg-label-quaternary"
                )}
              />
              {idx < Math.min(events.length, 6) - 1 && (
                <div className="w-px flex-1 bg-separator/30 mt-1.5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-headline text-label-primary">{event.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-footnote text-label-secondary">
                  {formatDate(event.due_date)}
                </span>
                <Badge variant={urgency} size="sm">
                  {days <= 0 ? "Overdue" : days === 1 ? "Tomorrow" : `${days}d`}
                </Badge>
                <Badge variant="muted" size="sm">
                  {event.event_type}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
