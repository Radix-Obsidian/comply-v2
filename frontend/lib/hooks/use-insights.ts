"use client";

import useSWR from "swr";
import type { AIInsightsResponse } from "@/lib/types";

export function useInsights(role: string = "owner") {
  return useSWR<AIInsightsResponse>(
    `/api/dashboard/ai-insights?role=${role}`,
    { refreshInterval: 60000 } // refresh every 60s
  );
}
