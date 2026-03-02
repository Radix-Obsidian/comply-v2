"use client";

import useSWR from "swr";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, truncate } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import type { AuditResponse } from "@/lib/types";

export default function AuditPage() {
  const { data, isLoading } = useSWR<AuditResponse>("/api/audit/?limit=100");

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle={`${total} entries — SHA-256 hash-chained for tamper resistance`}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <GlassCard key={i} padding="sm">
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            </GlassCard>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <ShieldCheck className="h-8 w-8 text-label-quaternary mx-auto mb-2 opacity-60" />
          <p className="text-subheadline text-label-tertiary">
            No audit entries yet. Actions will be logged automatically.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <GlassCard key={entry.id} padding="sm">
              <div className="flex items-center gap-3 text-footnote">
                <span className="text-label-quaternary font-mono text-caption-1 shrink-0 w-32">
                  {formatDateTime(entry.timestamp)}
                </span>
                <Badge variant="muted" size="sm">
                  {entry.actor}
                </Badge>
                <span className="text-label-primary font-medium">
                  {entry.action}
                </span>
                {entry.resource_type && (
                  <span className="text-label-tertiary font-mono text-caption-1">
                    {entry.resource_type}/{truncate(entry.resource_id || "", 8)}
                  </span>
                )}
                <span className="ml-auto text-label-quaternary font-mono text-caption-2">
                  {entry.data_hash.slice(0, 12)}…
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
