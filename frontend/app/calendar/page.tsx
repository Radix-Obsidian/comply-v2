"use client";

import { useRef, useState } from "react";
import { useDeadlines } from "@/lib/hooks/use-deadlines";
import { createCalendarEvent, importICSPreview, importICSCommit, exportICS, getICSFeedUrl } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EventForm } from "@/components/calendar/event-form";
import { ICSImportPreview } from "@/components/calendar/ics-import-preview";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import { CalendarDays, Plus, Upload, Download, Link } from "lucide-react";
import type { CalendarEventCreate, ICSParsedEvent } from "@/lib/types";

export default function CalendarPage() {
  const { data: events, isLoading, mutate } = useDeadlines(365);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    events: ICSParsedEvent[];
    totalNew: number;
    totalDuplicates: number;
  } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCreateEvent(data: CalendarEventCreate) {
    setFormLoading(true);
    try {
      await createCalendarEvent(data);
      setShowForm(false);
      mutate();
      showToast("Event created");
    } catch {
      showToast("Failed to create event");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImportFile(file);
    setImportLoading(true);
    try {
      const preview = await importICSPreview(file);
      setImportPreview({
        events: preview.events,
        totalNew: preview.new,
        totalDuplicates: preview.duplicates,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import preview failed");
      setImportFile(null);
    } finally {
      setImportLoading(false);
    }
  }

  async function handleConfirmImport() {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const result = await importICSCommit(importFile);
      showToast(`Imported ${result.imported} event${result.imported !== 1 ? "s" : ""}`);
      setImportPreview(null);
      setImportFile(null);
      mutate();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportLoading(false);
    }
  }

  function handleCancelImport() {
    setImportPreview(null);
    setImportFile(null);
  }

  async function handleExport() {
    try {
      await exportICS();
      showToast("Calendar exported");
    } catch {
      showToast("Export failed");
    }
  }

  function handleSubscribe() {
    const url = getICSFeedUrl();
    navigator.clipboard.writeText(url).then(() => {
      showToast("Feed URL copied to clipboard");
    }).catch(() => {
      showToast(url);
    });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Calendar"
        subtitle="Upcoming deadlines, reviews, and filing dates"
        actions={
          <div className="flex gap-2">
            <Button
              variant={showForm ? "ghost" : "primary"}
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => { setShowForm(!showForm); setImportPreview(null); }}
            >
              {showForm ? "Cancel" : "Add Event"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Link className="h-4 w-4" />}
              onClick={handleSubscribe}
            >
              Subscribe
            </Button>
          </div>
        }
      />

      {/* Hidden file input for ICS import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ics"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <GlassCard padding="md" variant="elevated">
            <p className="text-callout text-label-primary">{toast}</p>
          </GlassCard>
        </div>
      )}

      {/* Event creation form */}
      {showForm && (
        <EventForm
          onSubmit={handleCreateEvent}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      )}

      {/* ICS import preview */}
      {importPreview && (
        <ICSImportPreview
          events={importPreview.events}
          totalNew={importPreview.totalNew}
          totalDuplicates={importPreview.totalDuplicates}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelImport}
          loading={importLoading}
        />
      )}

      {/* Loading state for import */}
      {importLoading && !importPreview && (
        <GlassCard padding="md" className="text-center">
          <p className="text-callout text-label-secondary">Parsing ICS file...</p>
        </GlassCard>
      )}

      {/* Event list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} padding="md">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-3 w-32" />
            </GlassCard>
          ))}
        </div>
      ) : !events || events.length === 0 ? (
        <GlassCard padding="lg" className="text-center">
          <CalendarDays className="h-8 w-8 text-label-quaternary mx-auto mb-2 opacity-60" />
          <p className="text-subheadline text-label-tertiary">
            No upcoming compliance events.
          </p>
          <p className="text-caption-1 text-label-quaternary mt-1">
            Add events manually or import from an .ics file.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-1">
          {events.map((event, idx) => {
            const days = daysUntil(event.due_date);
            const urgency =
              days <= 3 ? "critical" : days <= 7 ? "warning" : days <= 30 ? "info" : "muted";

            return (
              <div key={event.id} className="flex items-start gap-4 py-3">
                {/* Timeline */}
                <div className="flex flex-col items-center shrink-0 pt-1.5">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      urgency === "critical" && "bg-accent-red",
                      urgency === "warning" && "bg-accent-orange",
                      urgency === "info" && "bg-accent-blue",
                      urgency === "muted" && "bg-label-quaternary"
                    )}
                  />
                  {idx < events.length - 1 && (
                    <div className="w-px flex-1 bg-separator/30 mt-1.5" />
                  )}
                </div>

                {/* Event card */}
                <GlassCard padding="md" className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-headline text-label-primary">{event.title}</h3>
                      {event.description && (
                        <p className="text-footnote text-label-secondary mt-0.5">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={urgency} size="sm">
                          {days <= 0
                            ? "Overdue"
                            : days === 1
                            ? "Tomorrow"
                            : `In ${days} days`}
                        </Badge>
                        <Badge variant="muted" size="sm">
                          {event.event_type}
                        </Badge>
                        {event.categories && (
                          <Badge variant="info" size="sm">
                            {event.categories}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-footnote font-mono text-label-secondary">
                        {formatDate(event.due_date)}
                      </p>
                      <Badge
                        variant={event.status === "pending" ? "warning" : "success"}
                        size="sm"
                        className="mt-1"
                      >
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
