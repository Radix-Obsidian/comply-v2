"use client";

import useSWR from "swr";
import type { CalendarEvent } from "@/lib/types";

export function useDeadlines(days: number = 90) {
  return useSWR<CalendarEvent[]>(`/api/calendar/upcoming?days=${days}`);
}
