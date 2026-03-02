"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8100";

type ScanType = "marketing" | "policy-gaps";

interface Violation {
  severity: string;
  text_excerpt: string;
  rule_citation: string;
  explanation: string;
  suggestion: string;
}

interface Gap {
  area: string;
  rule_reference: string;
  status: string;
  description: string;
  recommendation: string;
}

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  WARNING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  INFO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  MISSING: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  INCOMPLETE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  OUTDATED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function ScannerPage() {
  const [scanType, setScanType] = useState<ScanType>("marketing");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function runScan() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    const endpoint =
      scanType === "marketing" ? "/api/glassbox/scan-marketing" : "/api/glassbox/detect-policy-gaps";

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Scan failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const violations = (result?.violations as Violation[]) || [];
  const gaps = (result?.gaps as Gap[]) || [];
  const summary = result?.summary as Record<string, unknown> | undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Glass Box Scanner</h1>

      {/* Scan type toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setScanType("marketing")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            scanType === "marketing"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          Marketing Scan (206(4)-1)
        </button>
        <button
          onClick={() => setScanType("policy-gaps")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            scanType === "policy-gaps"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          Policy Gap Detection (206(4)-7)
        </button>
      </div>

      {/* Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          scanType === "marketing"
            ? "Paste marketing text here (emails, website copy, social posts, brochures)..."
            : "Paste your compliance policies here..."
        }
        className="w-full h-48 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <button
        onClick={runScan}
        disabled={loading || !text.trim()}
        className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Scanning..." : "Run Scan"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Summary */}
          {summary && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h2>
              <div className="flex gap-4 text-sm">
                {summary.overall_risk && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    summary.overall_risk === "HIGH" ? "bg-red-100 text-red-800" :
                    summary.overall_risk === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    Risk: {String(summary.overall_risk)}
                  </span>
                )}
                {summary.compliance_score !== undefined && (
                  <span className="text-gray-600 dark:text-gray-400">
                    Compliance Score: {String(summary.compliance_score)}%
                  </span>
                )}
                {summary.total_issues !== undefined && (
                  <span className="text-gray-600 dark:text-gray-400">
                    Issues: {String(summary.total_issues)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Violations (marketing scan) */}
          {violations.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">Violations</h2>
              {violations.map((v, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[v.severity] || "bg-gray-100 text-gray-800"}`}>
                      {v.severity}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">{v.rule_citation}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded mb-2 font-mono">
                    &ldquo;{v.text_excerpt}&rdquo;
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{v.explanation}</p>
                  <p className="text-sm text-green-700 dark:text-green-400">Suggestion: {v.suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* Gaps (policy scan) */}
          {gaps.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">Policy Gaps</h2>
              {gaps.map((g, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[g.status] || "bg-gray-100 text-gray-800"}`}>
                      {g.status}
                    </span>
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{g.area}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">{g.rule_reference}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{g.description}</p>
                  <p className="text-sm text-green-700 dark:text-green-400">Recommendation: {g.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Covered areas */}
          {(result.covered_areas as string[])?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Covered Areas</h2>
              <div className="flex flex-wrap gap-2">
                {(result.covered_areas as string[]).map((area, i) => (
                  <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded text-xs">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fallback note */}
          {result.note && (
            <p className="text-xs text-gray-400 italic">{String(result.note)}</p>
          )}
        </div>
      )}
    </div>
  );
}
