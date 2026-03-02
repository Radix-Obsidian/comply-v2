"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8100";

interface DashboardStats {
  compliance_score: number;
  policies: { total: number; active: number; draft: number };
  attestations: { total: number; expiring_30d: number };
  scans: { total: number; recent_7d: number };
  pending_tasks: number;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Dashboard</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          Failed to load dashboard: {error}. Is the backend running?
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Compliance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Compliance Score"
          value={`${stats.compliance_score}%`}
          sub="Based on policies, attestations, and scans"
        />
        <StatCard
          label="Active Policies"
          value={stats.policies.active}
          sub={`${stats.policies.draft} drafts / ${stats.policies.total} total`}
        />
        <StatCard
          label="Attestations"
          value={stats.attestations.total}
          sub={`${stats.attestations.expiring_30d} expiring in 30 days`}
        />
        <StatCard
          label="Scans (7d)"
          value={stats.scans.recent_7d}
          sub={`${stats.scans.total} total scans`}
        />
      </div>

      {stats.pending_tasks > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-yellow-700 dark:text-yellow-400">
          {stats.pending_tasks} pending workflow task{stats.pending_tasks > 1 ? "s" : ""} require attention.
        </div>
      )}
    </div>
  );
}
