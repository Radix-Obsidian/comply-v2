"use client";

import useSWR from "swr";

interface HealthStatus {
  status: string;
  version: string;
}

export function useOllamaStatus() {
  const { data, error } = useSWR<HealthStatus>("/health", {
    refreshInterval: 30000,
    errorRetryCount: 1,
  });

  return {
    isOnline: !!data && data.status === "ok",
    version: data?.version,
    error,
  };
}
