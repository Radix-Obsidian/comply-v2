"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8100";

interface Policy {
  id: string;
  title: string;
  category: string;
  content: string;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("marketing");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  async function loadPolicies() {
    try {
      const res = await fetch(`${API_BASE}/api/policies/`);
      const data = await res.json();
      setPolicies(data);
    } catch (e) {
      setError("Failed to load policies. Is the backend running?");
    }
  }

  useEffect(() => { loadPolicies(); }, []);

  async function createPolicy(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/policies/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, content }),
      });
      if (!res.ok) throw new Error("Failed to create policy");
      setTitle(""); setCategory("marketing"); setContent("");
      setShowForm(false);
      loadPolicies();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Policies</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancel" : "New Policy"}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={createPolicy} className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Policy title"
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="marketing">Marketing</option>
            <option value="trading">Trading</option>
            <option value="custody">Custody</option>
            <option value="privacy">Privacy</option>
            <option value="code_of_ethics">Code of Ethics</option>
            <option value="business_continuity">Business Continuity</option>
            <option value="valuation">Valuation</option>
            <option value="other">Other</option>
          </select>
          <textarea
            value={content} onChange={(e) => setContent(e.target.value)} placeholder="Policy content..."
            required rows={8}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            Create Policy
          </button>
        </form>
      )}

      {policies.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No policies yet. Create your first policy to get started.</p>
      ) : (
        <div className="space-y-3">
          {policies.map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{p.title}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status] || statusColors.draft}`}>
                  {p.status}
                </span>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">
                  {p.category}
                </span>
                <span className="text-xs text-gray-400">v{p.version}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{p.content}</p>
              <p className="text-xs text-gray-400 mt-1">Updated: {new Date(p.updated_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
