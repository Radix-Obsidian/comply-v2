"use client";

import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createPolicy } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, FileText } from "lucide-react";
import type { Policy } from "@/lib/types";

const STATUS_VARIANT: Record<string, "muted" | "success" | "warning"> = {
  draft: "muted",
  active: "success",
  archived: "warning",
};

const CATEGORIES = [
  "marketing", "trading", "custody", "privacy",
  "code_of_ethics", "business_continuity", "valuation", "other",
];

export default function PoliciesPage() {
  const { data: policies, isLoading, mutate } = useSWR<Policy[]>("/api/policies/");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("marketing");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createPolicy({ title, category, content });
      setTitle("");
      setCategory("marketing");
      setContent("");
      setShowForm(false);
      mutate();
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policies"
        subtitle="Manage your compliance policies and procedures"
        actions={
          <Button
            variant={showForm ? "ghost" : "primary"}
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "New Policy"}
          </Button>
        }
      />

      {/* Create form */}
      {showForm && (
        <GlassCard padding="lg">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Policy title"
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl bg-surface-secondary/60 border border-white/[0.06] px-4 py-2.5 text-callout text-label-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Policy content..."
              required
              rows={8}
            />
            <Button type="submit" loading={saving}>
              Create Policy
            </Button>
          </form>
        </GlassCard>
      )}

      {/* Policy list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} padding="md">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-72 mt-1" />
            </GlassCard>
          ))}
        </div>
      ) : !policies || policies.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <FileText className="h-8 w-8 text-label-quaternary mx-auto mb-2 opacity-60" />
          <p className="text-subheadline text-label-tertiary">
            No policies yet. Create your first policy to get started.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {policies.map((p) => (
            <GlassCard key={p.id} padding="md" hover>
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-headline text-label-primary">{p.title}</h3>
                <Badge variant={STATUS_VARIANT[p.status] || "muted"} size="sm">
                  {p.status}
                </Badge>
                <Badge variant="info" size="sm">
                  {p.category.replace(/_/g, " ")}
                </Badge>
                <span className="text-caption-2 text-label-quaternary">v{p.version}</span>
              </div>
              <p className="text-footnote text-label-secondary line-clamp-2">
                {p.content}
              </p>
              <p className="text-caption-1 text-label-quaternary mt-2">
                Updated {formatDate(p.updated_at)}
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
