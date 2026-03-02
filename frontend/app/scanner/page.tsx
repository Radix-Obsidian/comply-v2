"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { scanMarketing, detectPolicyGaps } from "@/lib/api";
import { ScanLine } from "lucide-react";
import type { Violation, PolicyGap } from "@/lib/types";

type ScanType = "marketing" | "policy-gaps";

const SEVERITY_VARIANT: Record<string, "critical" | "warning" | "info" | "success" | "muted"> = {
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "info",
  MISSING: "critical",
  INCOMPLETE: "warning",
  OUTDATED: "warning",
};

export default function ScannerPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "gaps" ? "policy-gaps" : "marketing";

  const [scanType, setScanType] = useState<ScanType>(initialType);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function runScan() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data =
        scanType === "marketing"
          ? await scanMarketing(text)
          : await detectPolicyGaps(text);
      setResult(data as unknown as Record<string, unknown>);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  const violations = (result?.violations as Violation[]) || [];
  const gaps = (result?.gaps as PolicyGap[]) || [];
  const summary = result?.summary as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Glass Box Scanner"
        subtitle="SEC Rule 206(4)-1 marketing compliance & Rule 206(4)-7 policy gap detection"
      />

      {/* Scan type toggle */}
      <ToggleGroup
        options={[
          { value: "marketing", label: "Marketing Scan" },
          { value: "policy-gaps", label: "Policy Gaps" },
        ]}
        value={scanType}
        onChange={(v) => setScanType(v as ScanType)}
      />

      {/* Input */}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          scanType === "marketing"
            ? "Paste marketing text here (emails, website copy, social posts, brochures)..."
            : "Paste your compliance policies here..."
        }
        rows={8}
      />

      <Button
        onClick={runScan}
        loading={loading}
        disabled={!text.trim()}
        icon={<ScanLine className="h-4 w-4" />}
      >
        {loading ? "Analyzing..." : "Run Scan"}
      </Button>

      {/* Error */}
      {error && (
        <GlassCard padding="md" className="border-accent-red/30">
          <p className="text-callout text-accent-red">{error}</p>
        </GlassCard>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          {summary && (
            <GlassCard padding="lg">
              <h2 className="text-headline text-label-primary mb-3">Summary</h2>
              <div className="flex flex-wrap gap-2">
                {summary.overall_risk && (
                  <Badge
                    variant={
                      summary.overall_risk === "HIGH" ? "critical" :
                      summary.overall_risk === "MEDIUM" ? "warning" : "success"
                    }
                    size="md"
                  >
                    Risk: {String(summary.overall_risk)}
                  </Badge>
                )}
                {summary.compliance_score !== undefined && (
                  <Badge variant="info" size="md">
                    Score: {String(summary.compliance_score)}%
                  </Badge>
                )}
                {summary.total_issues !== undefined && (
                  <Badge variant="muted" size="md">
                    {String(summary.total_issues)} issues
                  </Badge>
                )}
              </div>
            </GlassCard>
          )}

          {/* Violations */}
          {violations.length > 0 && (
            <section>
              <h2 className="text-headline text-label-primary mb-3">Violations</h2>
              <div className="space-y-3">
                {violations.map((v, i) => (
                  <GlassCard key={i} padding="md">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={SEVERITY_VARIANT[v.severity] || "muted"} size="sm">
                        {v.severity}
                      </Badge>
                      <span className="text-caption-1 text-accent-blue font-mono">
                        {v.rule_citation}
                      </span>
                    </div>
                    <p className="text-footnote text-label-secondary bg-surface-tertiary/40 p-2.5 rounded-lg mb-2 font-mono">
                      &ldquo;{v.text_excerpt}&rdquo;
                    </p>
                    <p className="text-footnote text-label-secondary mb-1">{v.explanation}</p>
                    <p className="text-footnote text-accent-green">✦ {v.suggestion}</p>
                  </GlassCard>
                ))}
              </div>
            </section>
          )}

          {/* Gaps */}
          {gaps.length > 0 && (
            <section>
              <h2 className="text-headline text-label-primary mb-3">Policy Gaps</h2>
              <div className="space-y-3">
                {gaps.map((g, i) => (
                  <GlassCard key={i} padding="md">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={SEVERITY_VARIANT[g.status] || "muted"} size="sm">
                        {g.status}
                      </Badge>
                      <span className="text-headline text-label-primary">{g.area}</span>
                      <span className="text-caption-1 text-accent-blue font-mono">
                        {g.rule_reference}
                      </span>
                    </div>
                    <p className="text-footnote text-label-secondary mb-1">{g.description}</p>
                    <p className="text-footnote text-accent-green">✦ {g.recommendation}</p>
                  </GlassCard>
                ))}
              </div>
            </section>
          )}

          {/* Covered areas */}
          {(result.covered_areas as string[])?.length > 0 && (
            <GlassCard padding="md">
              <h2 className="text-headline text-label-primary mb-2">Covered Areas</h2>
              <div className="flex flex-wrap gap-1.5">
                {(result.covered_areas as string[]).map((area, i) => (
                  <Badge key={i} variant="success" size="sm">
                    {area}
                  </Badge>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Fallback note */}
          {result.note && (
            <p className="text-caption-1 text-label-quaternary italic">
              {String(result.note)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
