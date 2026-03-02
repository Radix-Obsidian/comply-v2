"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8100";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  due_date: string;
  status: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/calendar/upcoming?days=90`)
      .then((r) => r.json())
      .then(setEvents)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Compliance Calendar</h1>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No upcoming compliance events.</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{e.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{e.event_type} &middot; {e.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {new Date(e.due_date).toLocaleDateString()}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  e.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                }`}>
                  {e.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
