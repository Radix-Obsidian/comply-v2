import type {
  AIInsightsResponse,
  AuditResponse,
  CalendarEvent,
  CalendarEventCreate,
  DashboardStats,
  GeneratedDocument,
  ICSImportPreview,
  MarketingScanResult,
  Policy,
  PolicyCreate,
  PolicyGapResult,
  QueueStats,
  WorkflowTask,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ---- Generic fetcher ----

export async function api<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

/** SWR-compatible fetcher */
export const fetcher = <T>(url: string) => api<T>(url);

// ---- Dashboard ----

export function getDashboardStats() {
  return api<DashboardStats>("/api/dashboard/stats");
}

export function getAIInsights(role: string = "owner") {
  return api<AIInsightsResponse>(`/api/dashboard/ai-insights?role=${role}`);
}

// ---- Policies ----

export function listPolicies(category?: string, status?: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  const qs = params.toString();
  return api<Policy[]>(`/api/policies/${qs ? `?${qs}` : ""}`);
}

export function createPolicy(data: PolicyCreate) {
  return api<Policy>("/api/policies/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePolicy(
  id: string,
  data: Partial<{ title: string; content: string; status: string }>
) {
  return api<Policy>(`/api/policies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deletePolicy(id: string) {
  return api(`/api/policies/${id}`, { method: "DELETE" });
}

// ---- Attestations ----

export function getExpiringAttestations(days: number = 30) {
  return api(`/api/attestations/expiring?days=${days}`);
}

// ---- Audit ----

export function listAuditEntries(limit = 100, offset = 0) {
  return api<AuditResponse>(`/api/audit/?limit=${limit}&offset=${offset}`);
}

// ---- Calendar ----

export function getUpcomingDeadlines(days: number = 90) {
  return api<CalendarEvent[]>(`/api/calendar/upcoming?days=${days}`);
}

export function createCalendarEvent(data: CalendarEventCreate) {
  return api<CalendarEvent>("/api/calendar/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteCalendarEvent(id: string) {
  return api(`/api/calendar/${id}`, { method: "DELETE" });
}

export async function importICSPreview(file: File): Promise<ICSImportPreview> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/calendar/ics/import?dry_run=true`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Import preview failed: ${res.status}`);
  }
  return res.json();
}

export async function importICSCommit(file: File): Promise<{ imported: number; skipped_duplicates: number; event_ids: string[] }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/calendar/ics/import?dry_run=false`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Import failed: ${res.status}`);
  }
  return res.json();
}

export async function exportICS(filters?: { status?: string; event_type?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.event_type) params.set("event_type", filters.event_type);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/calendar/ics/export${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "comply-calendar.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export function getICSFeedUrl() {
  const base = typeof window !== "undefined" ? window.location.origin : API_BASE;
  return `${base}/api/calendar/ics/feed`;
}

// ---- Workflow ----

export function getWorkflowTasks(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return api<WorkflowTask[]>(`/api/workflow/${qs}`);
}

export function updateWorkflowTask(
  taskId: string,
  updates: Record<string, string>
) {
  const params = new URLSearchParams(updates);
  return api(`/api/workflow/${taskId}?${params.toString()}`, {
    method: "PATCH",
  });
}

// ---- Queue ----

export function getQueueStats() {
  return api<QueueStats>("/api/queue/stats");
}

// ---- Glass Box Scanner ----

export function scanMarketing(text: string) {
  return api<MarketingScanResult>("/api/glassbox/scan-marketing", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function detectPolicyGaps(text: string) {
  return api<PolicyGapResult>("/api/glassbox/detect-policy-gaps", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function scanMarketingFile(file: File): Promise<MarketingScanResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/glassbox/scan-marketing-file`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Scan failed: ${res.status}`);
  }
  return res.json();
}

export async function detectPolicyGapsFile(file: File): Promise<PolicyGapResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/glassbox/detect-policy-gaps-file`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Scan failed: ${res.status}`);
  }
  return res.json();
}

// ---- Documents ----

export function generateDocument(docType: string, context?: string) {
  return api<GeneratedDocument>(`/api/documents/generate?doc_type=${docType}${context ? `&context=${encodeURIComponent(context)}` : ""}`, {
    method: "POST",
  });
}

// ---- Health ----

export function getHealthStatus() {
  return api<{ status: string; version: string }>("/health");
}
