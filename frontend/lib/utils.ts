import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format ISO timestamp to relative time (e.g., "2 hours ago") */
export function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(isoString);
}

/** Format ISO timestamp to short date (e.g., "Mar 15, 2026") */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format ISO timestamp to date + time (e.g., "Mar 15, 2:30 PM") */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Days until a future date */
export function daysUntil(isoString: string): number {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  return Math.ceil((then - now) / 86400000);
}

/** Severity to color mapping */
export function severityColor(
  severity: string
): { bg: string; text: string; dot: string } {
  switch (severity.toLowerCase()) {
    case "critical":
    case "missing":
      return {
        bg: "bg-accent-red/15",
        text: "text-accent-red",
        dot: "bg-accent-red",
      };
    case "warning":
    case "incomplete":
      return {
        bg: "bg-accent-orange/15",
        text: "text-accent-orange",
        dot: "bg-accent-orange",
      };
    case "success":
      return {
        bg: "bg-accent-green/15",
        text: "text-accent-green",
        dot: "bg-accent-green",
      };
    case "recommendation":
      return {
        bg: "bg-accent-purple/15",
        text: "text-accent-purple",
        dot: "bg-accent-purple",
      };
    case "info":
    default:
      return {
        bg: "bg-accent-blue/15",
        text: "text-accent-blue",
        dot: "bg-accent-blue",
      };
  }
}

/** Priority to color mapping */
export function priorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "critical":
      return "text-accent-red";
    case "high":
      return "text-accent-orange";
    case "medium":
      return "text-accent-blue";
    case "low":
    default:
      return "text-label-tertiary";
  }
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}
