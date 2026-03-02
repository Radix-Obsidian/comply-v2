"use client";

import useSWR from "swr";
import type { WorkflowTask } from "@/lib/types";

export function useWorkflows(status: string = "pending") {
  return useSWR<WorkflowTask[]>(
    `/api/workflow/?status=${status}`,
    { refreshInterval: 30000 } // refresh every 30s
  );
}
