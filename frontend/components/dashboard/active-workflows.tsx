"use client";

import { useWorkflows } from "@/lib/hooks/use-workflows";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, priorityColor, timeAgo } from "@/lib/utils";
import { updateWorkflowTask } from "@/lib/api";
import { useSWRConfig } from "swr";
import { CheckCircle2, ArrowUpRight, Clock } from "lucide-react";

const PRIORITY_VARIANT = {
  critical: "critical" as const,
  high: "warning" as const,
  medium: "info" as const,
  low: "muted" as const,
};

export function ActiveWorkflows() {
  const { data: tasks, isLoading, error } = useWorkflows("pending");
  const { mutate } = useSWRConfig();

  const handleAction = async (taskId: string, status: string) => {
    try {
      await updateWorkflowTask(taskId, { status });
      mutate("/api/workflow/?status=pending");
      mutate((key: string) => typeof key === "string" && key.includes("ai-insights"), undefined, { revalidate: true });
    } catch {
      // Silently fail — SWR will retry
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <GlassCard key={i} padding="md">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  if (error || !tasks || tasks.length === 0) {
    return (
      <GlassCard padding="lg" className="text-center">
        <CheckCircle2 className="h-8 w-8 text-accent-green mx-auto mb-2 opacity-60" />
        <p className="text-subheadline text-label-tertiary">
          No pending tasks — all workflows are clear.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.slice(0, 5).map((task) => (
        <GlassCard key={task.id} padding="md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-headline text-label-primary truncate">
                  {task.title}
                </p>
                <Badge variant={PRIORITY_VARIANT[task.priority]} size="sm">
                  {task.priority}
                </Badge>
              </div>
              {task.description && (
                <p className="text-footnote text-label-secondary line-clamp-1">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-caption-1 text-label-quaternary">
                {task.assigned_to && (
                  <span>{task.assigned_to}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(task.created_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction(task.id, "approved")}
                className="h-7 text-caption-1"
              >
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction(task.id, "in_review")}
                className="h-7 text-caption-1"
              >
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
