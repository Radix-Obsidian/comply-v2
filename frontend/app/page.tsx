"use client";

import { useInsights } from "@/lib/hooks/use-insights";
import { CompliancePulse } from "@/components/ai/compliance-pulse";
import { InsightsFeed } from "@/components/ai/insights-feed";
import { ActiveWorkflows } from "@/components/dashboard/active-workflows";
import { UpcomingDeadlines } from "@/components/dashboard/upcoming-deadlines";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Separator } from "@/components/ui/separator";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-caption-2 uppercase tracking-wider text-label-quaternary mb-3">
      {children}
    </h2>
  );
}

export default function Dashboard() {
  const { data, isLoading, error } = useInsights("owner");

  return (
    <div className="space-y-8">
      {/* Section 1: Compliance Pulse (Hero) */}
      <CompliancePulse
        score={data?.compliance_score ?? 0}
        trend={data?.trend ?? "stable"}
        trendDelta={data?.trend_delta ?? 0}
        aiSummary={
          data?.ai_summary ??
          "Connecting to compliance engine..."
        }
        loading={isLoading}
      />

      {/* Section 2: AI Insights Feed */}
      <section>
        <SectionLabel>AI Insights</SectionLabel>
        <InsightsFeed
          insights={data?.insights ?? []}
          loading={isLoading}
        />
      </section>

      <Separator />

      {/* Section 3: Active Workflows */}
      <section>
        <SectionLabel>Active Workflows</SectionLabel>
        <ActiveWorkflows />
      </section>

      <Separator />

      {/* Section 4: Upcoming Deadlines */}
      <section>
        <SectionLabel>Upcoming Deadlines</SectionLabel>
        <UpcomingDeadlines />
      </section>

      <Separator />

      {/* Section 5: Quick Actions */}
      <section>
        <SectionLabel>Quick Actions</SectionLabel>
        <QuickActions />
      </section>
    </div>
  );
}
