/* ============================================================
 *  Comply-v2 — Shared TypeScript interfaces
 * ============================================================ */

// ---- Dashboard ----

export interface DashboardStats {
  compliance_score: number;
  policies: { total: number; active: number; draft: number };
  attestations: { total: number; expiring_30d: number };
  scans: { total: number; recent_7d: number };
  pending_tasks: number;
}

// ---- AI Insights ----

export interface InsightAction {
  label: string;
  href?: string;
}

export interface Insight {
  id: string;
  severity: "critical" | "warning" | "info" | "success" | "recommendation";
  title: string;
  description: string;
  action: InsightAction | null;
  timestamp: string;
}

export interface AIInsightsResponse {
  insights: Insight[];
  ai_summary: string;
  compliance_score: number;
  trend: "up" | "down" | "stable";
  trend_delta: number;
  generated_at: string;
}

// ---- Policies ----

export interface Policy {
  id: string;
  title: string;
  category: string;
  content: string;
  version: number;
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface PolicyCreate {
  title: string;
  category: string;
  content: string;
}

// ---- Attestations ----

export interface Attestation {
  id: string;
  policy_id: string;
  attested_by: string;
  attested_at: string;
  expires_at: string;
  notes: string | null;
}

// ---- Audit ----

export interface AuditEntry {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  resource_type: string;
  resource_id: string;
  data_hash: string;
  metadata: Record<string, unknown> | null;
}

export interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

// ---- Calendar ----

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  due_date: string;
  status: string;
  policy_id: string | null;
}

// ---- Workflow ----

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_review" | "approved" | "rejected" | "completed";
  priority: "critical" | "high" | "medium" | "low";
  assigned_to: string | null;
  policy_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Queue ----

export interface QueueStats {
  pending: number;
  processed: number;
}

// ---- Scanner ----

export interface Violation {
  severity: string;
  text_excerpt: string;
  rule_citation: string;
  explanation: string;
  suggestion: string;
}

export interface ScanSummary {
  total_issues: number;
  critical: number;
  warnings: number;
  info: number;
  overall_risk: "LOW" | "MEDIUM" | "HIGH";
}

export interface MarketingScanResult {
  scan_id: string;
  scan_type: string;
  scanned_at: string;
  violations: Violation[];
  summary: ScanSummary;
  note?: string;
}

export interface PolicyGap {
  area: string;
  rule_reference: string;
  status: string;
  description: string;
  recommendation: string;
}

export interface PolicyGapResult {
  scan_id: string;
  scan_type: string;
  scanned_at: string;
  gaps: PolicyGap[];
  covered_areas: string[];
  summary: {
    total_required: number;
    covered: number;
    missing: number;
    incomplete: number;
    compliance_score: number;
  };
  note?: string;
}

// ---- Documents ----

export interface GeneratedDocument {
  id: string;
  doc_type: string;
  content: string;
  generated_at: string;
}
