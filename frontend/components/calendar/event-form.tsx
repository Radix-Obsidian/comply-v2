"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import type { CalendarEventCreate } from "@/lib/types";

const EVENT_TYPES = [
  "filing",
  "review",
  "attestation",
  "deadline",
  "audit",
  "training",
  "custom",
];

interface EventFormProps {
  onSubmit: (event: CalendarEventCreate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function EventForm({ onSubmit, onCancel, loading }: EventFormProps) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("deadline");
  const [dueDate, setDueDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title,
      event_type: eventType,
      due_date: new Date(dueDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      description: description || undefined,
      categories: categories || undefined,
    });
  }

  return (
    <GlassCard padding="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-headline text-label-primary">New Event</h3>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-caption-1 text-label-tertiary mb-1 block">
              Start Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full rounded-xl bg-surface-secondary/60 border border-white/[0.06] px-4 py-2.5 text-callout text-label-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
            />
          </div>
          <div>
            <label className="text-caption-1 text-label-tertiary mb-1 block">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl bg-surface-secondary/60 border border-white/[0.06] px-4 py-2.5 text-callout text-label-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
            />
          </div>
        </div>

        <div>
          <label className="text-caption-1 text-label-tertiary mb-1 block">
            Event Type
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full rounded-xl bg-surface-secondary/60 border border-white/[0.06] px-4 py-2.5 text-callout text-label-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <Input
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          placeholder="Categories (comma-separated, optional)"
        />

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={3}
        />

        <div className="flex gap-3">
          <Button
            type="submit"
            loading={loading}
            disabled={!title.trim() || !dueDate}
            icon={<CalendarPlus className="h-4 w-4" />}
          >
            Create Event
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
