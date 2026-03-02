"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8100";

interface AuditEntry {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  data_hash: string;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/audit/?limit=100`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Audit Log</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} total entries (SHA-256 hash-chained)</p>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No audit entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Time</th>
                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Actor</th>
                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Action</th>
                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Resource</th>
                <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Hash</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-gray-100 dark:border-gray-800/50">
                  <td className="py-2 px-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{e.actor}</td>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{e.action}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {e.resource_type && `${e.resource_type}/${e.resource_id?.slice(0, 8)}...`}
                  </td>
                  <td className="py-2 px-3 text-gray-400 font-mono text-xs">{e.data_hash.slice(0, 12)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
