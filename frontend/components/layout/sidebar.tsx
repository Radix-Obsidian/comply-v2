"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ScanLine,
  FileText,
  ShieldCheck,
  CalendarDays,
  Sun,
  Moon,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/scanner", icon: ScanLine, label: "Scanner" },
  { href: "/policies", icon: FileText, label: "Policies" },
  { href: "/audit", icon: ShieldCheck, label: "Audit Log" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40",
        "w-16 hover:w-56 transition-all duration-300 ease-out",
        "glass-elevated overflow-hidden group",
        "flex flex-col"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <span className="text-headline text-label-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Comply
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2 mt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 h-10 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-accent-blue/15 text-accent-blue"
                  : "text-label-secondary hover:text-label-primary hover:bg-surface-secondary/60"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-footnote font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="flex flex-col gap-1 px-2 pb-4">
        {/* LLM status */}
        <div className="flex items-center gap-3 px-3 h-10 text-label-tertiary">
          <Activity className="h-4 w-4 shrink-0" />
          <span className="text-caption-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Ollama Local
          </span>
        </div>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 h-10 rounded-xl text-label-secondary hover:text-label-primary hover:bg-surface-secondary/60 transition-all duration-200"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 shrink-0" />
          ) : (
            <Moon className="h-5 w-5 shrink-0" />
          )}
          <span className="text-footnote font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </div>
    </aside>
  );
}
