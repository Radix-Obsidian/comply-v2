import type {
  AIInsightsResponse,
  AuditResponse,
  CalendarEvent,
  DashboardStats,
  GeneratedDocument,
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
