"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Download, CalendarCheck } from "lucide-react";
import type { ICSParsedEvent } from "@/lib/types";

interface ICSImportPreviewProps {
  events: ICSParsedEvent[];
  totalNew: number;
  totalDuplicates: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ICSImportPreview({
  events,
  totalNew,
  totalDuplicates,
  onConfirm,
  onCancel,
  loading,
}: ICSImportPreviewProps) {
  return (
    <div className="space-y-4">
      <GlassCard padding="md">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5 text-accent-blue" />
          <div>
            <p className="text-headline text-label-primary">
              Import Preview
            </p>
            <p className="text-footnote text-label-secondary">
              {totalNew} new event{totalNew !== 1 ? "s" : ""} will be imported
              {totalDuplicates > 0 && (
                <span className="text-label-quaternary">
                  , {totalDuplicates} duplicate{totalDuplicates !== 1 ? "s" : ""} will be skipped
                </span>
              )}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Event list */}
      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
        {events.map((evt, i) => (
          <GlassCard
            key={i}
            padding="sm"
            className={evt.already_exists ? "opacity-50" : ""}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-callout text-label-primary truncate">
                    {evt.title}
                  </p>
                  {evt.already_exists && (
                    <Badge variant="muted" size="sm">Already exists</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-caption-1 text-label-tertiary font-mono">
                    {formatDate(evt.start)}
                  </span>
                  {evt.end && (
                    <span className="text-caption-1 text-label-quaternary">
                      &rarr; {formatDate(evt.end)}
                    </span>
                  )}
                  {evt.categories && (
                    <Badge variant="info" size="sm">{evt.categories}</Badge>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onConfirm}
          loading={loading}
          disabled={totalNew === 0}
          icon={<CalendarCheck className="h-4 w-4" />}
        >
          Import {totalNew} Event{totalNew !== 1 ? "s" : ""}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
