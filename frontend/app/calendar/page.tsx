"use client";

import { useDeadlines } from "@/lib/hooks/use-deadlines";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  const { data: events, isLoading } = useDeadlines(365);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Calendar"
        subtitle="Upcoming deadlines, reviews, and filing dates"
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} padding="md">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
            </GlassCard>
          ))}
        </div>
      ) : !events || events.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <CalendarDays className="h-8 w-8 text-label-quaternary mx-auto mb-2 opacity-60" />
          <p className="text-subheadline text-label-tertiary">
            No upcoming compliance events.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-1">
          {events.map((event, idx) => {
            const days = daysUntil(event.due_date);
            const urgency =
              days <= 3 ? "critical" : days <= 7 ? "warning" : days <= 30 ? "info" : "muted";

            return (
              <div key={event.id} className="flex items-start gap-4 py-3">
                {/* Timeline */}
                <div className="flex flex-col items-center shrink-0 pt-1.5">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      urgency === "critical" && "bg-accent-red",
                      urgency === "warning" && "bg-accent-orange",
                      urgency === "info" && "bg-accent-blue",
                      urgency === "muted" && "bg-label-quaternary"
                    )}
                  />
                  {idx < events.length - 1 && (
                    <div className="w-px flex-1 bg-separator/30 mt-1.5" />
                  )}
                </div>

                {/* Event card */}
                <GlassCard padding="md" className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-headline text-label-primary">{event.title}</h3>
                      {event.description && (
                        <p className="text-footnote text-label-secondary mt-0.5">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={urgency} size="sm">
                          {days <= 0
                            ? "Overdue"
                            : days === 1
                            ? "Tomorrow"
                            : `In ${days} days`}
                        </Badge>
                        <Badge variant="muted" size="sm">
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-footnote font-mono text-label-secondary">
                        {formatDate(event.due_date)}
                      </p>
                      <Badge
                        variant={event.status === "pending" ? "warning" : "success"}
                        size="sm"
                        className="mt-1"
                      >
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
