"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ScanLine,
  FileText,
  ShieldCheck,
  CalendarDays,
  LayoutDashboard,
  Search,
  FileCheck,
  Sparkles,
} from "lucide-react";

interface CommandBarProps {
  className?: string;
}

const COMMANDS = [
  { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "scan-marketing", label: "Scan Marketing Materials", icon: ScanLine, href: "/scanner?type=marketing" },
  { id: "scan-gaps", label: "Run Policy Gap Analysis", icon: Search, href: "/scanner?type=gaps" },
  { id: "policies", label: "View Policies", icon: FileText, href: "/policies" },
  { id: "new-policy", label: "Create New Policy", icon: FileText, href: "/policies?action=new" },
  { id: "audit", label: "View Audit Log", icon: ShieldCheck, href: "/audit" },
  { id: "calendar", label: "View Calendar", icon: CalendarDays, href: "/calendar" },
  { id: "generate-cert", label: "Generate Compliance Certificate", icon: FileCheck, href: "/scanner?action=cert" },
];

export function CommandBar({ className }: CommandBarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Cmd+K handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <>
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "glass glass-hover rounded-xl flex items-center gap-2 px-4 py-2.5 w-full",
          "text-label-tertiary text-footnote",
          className
        )}
      >
        <Sparkles className="h-4 w-4 text-accent-purple" />
        <span className="flex-1 text-left">Ask Comply anything...</span>
        <kbd className="text-caption-2 text-label-quaternary bg-surface-tertiary/60 px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Command palette overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Dialog */}
          <div
            className="relative w-full max-w-lg glass-elevated rounded-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <Command
              className="flex flex-col"
              filter={(value, search) => {
                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                return 0;
              }}
            >
              <Command.Input
                placeholder="Type a command or search..."
                className="w-full bg-transparent px-4 py-3.5 text-body text-label-primary placeholder:text-label-quaternary focus:outline-none border-b border-white/[0.06]"
                autoFocus
              />
              <Command.List className="max-h-72 overflow-y-auto scrollbar-thin p-2">
                <Command.Empty className="px-4 py-8 text-center text-footnote text-label-tertiary">
                  No matching commands.
                </Command.Empty>

                <Command.Group heading="Navigation & Actions" className="px-2 py-1 text-caption-2 text-label-quaternary uppercase tracking-wider">
                  {COMMANDS.map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.label}
                      onSelect={() => runCommand(cmd.href)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-label-secondary hover:text-label-primary hover:bg-surface-secondary/60 cursor-pointer transition-colors data-[selected=true]:bg-surface-secondary/60 data-[selected=true]:text-label-primary"
                    >
                      <cmd.icon className="h-4 w-4 shrink-0 text-label-tertiary" />
                      <span className="text-callout">{cmd.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
