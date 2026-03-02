const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

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

export async function scanMarketing(text: string) {
  return api("/api/glassbox/scan-marketing", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function detectPolicyGaps(text: string) {
  return api("/api/glassbox/detect-policy-gaps", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function getDashboardStats() {
  return api("/api/dashboard/stats");
}

export async function listPolicies() {
  return api("/api/policies/");
}

export async function listAuditEntries(limit = 50) {
  return api(`/api/audit/?limit=${limit}`);
}
