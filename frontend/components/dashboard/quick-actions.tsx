"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { ScanLine, FileCheck, FileText, Search } from "lucide-react";
import Link from "next/link";

const ACTIONS = [
  {
    icon: ScanLine,
    title: "Scan Marketing",
    description: "Check materials for SEC 206(4)-1 violations",
    href: "/scanner?type=marketing",
  },
  {
    icon: FileCheck,
    title: "Generate Certificate",
    description: "Create compliance certification document",
    href: "/scanner?action=cert",
  },
  {
    icon: FileText,
    title: "Create Policy",
    description: "Draft a new compliance policy",
    href: "/policies?action=new",
  },
  {
    icon: Search,
    title: "Gap Analysis",
    description: "Detect missing SEC 206(4)-7 policies",
    href: "/scanner?type=gaps",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ACTIONS.map((action) => (
        <Link key={action.title} href={action.href}>
          <GlassCard
            hover
            padding="md"
            className="h-full group/action"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-accent-blue/10 text-accent-blue group-hover/action:bg-accent-blue/15 transition-colors">
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-headline text-label-primary">{action.title}</p>
                <p className="text-caption-1 text-label-tertiary mt-0.5">
                  {action.description}
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>
      ))}
    </div>
  );
}
