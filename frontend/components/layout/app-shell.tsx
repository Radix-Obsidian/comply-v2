"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import { ThemeProvider } from "./theme-provider";
import { Sidebar } from "./sidebar";
import { CommandBar } from "@/components/ai/command-bar";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark">
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: true,
          revalidateOnReconnect: true,
          dedupingInterval: 10000,
          errorRetryCount: 3,
        }}
      >
        <div className="min-h-screen bg-surface-primary">
          <Sidebar />
          <main className="pl-16 min-h-screen">
            <div className="max-w-3xl mx-auto px-6 py-8">
              {/* Command Bar */}
              <div className="mb-8">
                <CommandBar />
              </div>
              {children}
            </div>
          </main>
        </div>
      </SWRConfig>
    </ThemeProvider>
  );
}
