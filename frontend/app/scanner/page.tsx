"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileDropZone } from "@/components/scanner/file-drop-zone";
import { scanMarketing, detectPolicyGaps, scanMarketingFile, detectPolicyGapsFile } from "@/lib/api";
import { ScanLine, FileText, ShieldAlert, ClipboardPaste, Upload } from "lucide-react";
import type { Violation, PolicyGap, FileSourceMeta } from "@/lib/types";

type ScanType = "marketing" | "policy-gaps";
type InputMode = "text" | "file";

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
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function runScan() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let data;
      if (inputMode === "file" && file) {
        data =
          scanType === "marketing"
            ? await scanMarketingFile(file)
            : await detectPolicyGapsFile(file);
      } else if (inputMode === "text" && text.trim()) {
        data =
          scanType === "marketing"
            ? await scanMarketing(text)
            : await detectPolicyGaps(text);
      } else {
        setError("Please provide text or upload a file to scan.");
        setLoading(false);
        return;
      }
      setResult(data as unknown as Record<string, unknown>);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  const canScan = inputMode === "file" ? !!file : !!text.trim();
  const violations = (result?.violations as Violation[]) || [];
  const gaps = (result?.gaps as PolicyGap[]) || [];
  const summary = result?.summary as Record<string, unknown> | undefined;
  const source = result?.source as FileSourceMeta | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Glass Box Scanner"
        subtitle="SEC Rule 206(4)-1 marketing compliance & Rule 206(4)-7 policy gap detection"
        actions={
          <div className="flex gap-2">
            <Button
              variant={scanType === "marketing" ? "primary" : "ghost"}
              size="sm"
              icon={<ScanLine className="h-4 w-4" />}
              onClick={() => setScanType("marketing")}
            >
              Marketing Scan
            </Button>
            <Button
              variant={scanType === "policy-gaps" ? "primary" : "ghost"}
              size="sm"
              icon={<ShieldAlert className="h-4 w-4" />}
              onClick={() => setScanType("policy-gaps")}
            >
              Policy Gaps
            </Button>
          </div>
        }
      />

      {/* Input mode buttons */}
      <div className="flex gap-2">
        <Button
          variant={inputMode === "text" ? "secondary" : "ghost"}
          size="sm"
          icon={<ClipboardPaste className="h-4 w-4" />}
          onClick={() => setInputMode("text")}
        >
          Paste Text
        </Button>
        <Button
          variant={inputMode === "file" ? "secondary" : "ghost"}
          size="sm"
          icon={<Upload className="h-4 w-4" />}
          onClick={() => setInputMode("file")}
        >
          Upload File
        </Button>
      </div>

      {/* Input area */}
      {inputMode === "text" ? (
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
      ) : (
        <FileDropZone
          onFileSelected={setFile}
          disabled={loading}
          uploading={loading}
        />
      )}

      <Button
        onClick={runScan}
        loading={loading}
        disabled={!canScan}
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
          {/* File source info */}
          {source && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent-blue" />
              <Badge variant="info" size="sm">{source.filename}</Badge>
              <Badge variant="muted" size="sm">{source.filetype}</Badge>
              <span className="text-caption-1 text-label-tertiary">
                {source.chars_extracted.toLocaleString()} characters extracted
              </span>
            </div>
          )}

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
                    <p className="text-footnote text-accent-green">{v.suggestion}</p>
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
                    <p className="text-footnote text-accent-green">{g.recommendation}</p>
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
