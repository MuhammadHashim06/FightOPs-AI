"use client";

import { useMemo, useState } from "react";

import { EventStatusBadge } from "@/features/dashboard/components/promoter-events-page";
import type { DashboardEventSummary } from "@/server/services/events.service";

export function AdminEventsPage({
  events,
}: {
  events: DashboardEventSummary[];
}) {
  const [searchValue, setSearchValue] = useState("");
  const normalizedSearch = searchValue.trim().toLowerCase();
  const visibleEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          !normalizedSearch ||
          event.name.toLowerCase().includes(normalizedSearch) ||
          event.location.toLowerCase().includes(normalizedSearch) ||
          event.organization.toLowerCase().includes(normalizedSearch),
      ),
    [events, normalizedSearch],
  );

  return (
    <main className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          Platform operations
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Events
        </h1>
        <p className="text-lg text-text-body">
          Monitor events across all promotions without changing promoter-owned data.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total events" value={events.length} />
        <SummaryCard
          label="Active or upcoming"
          value={events.filter((event) => event.status === "active" || event.status === "upcoming").length}
        />
        <SummaryCard
          label="Needs attention"
          value={events.reduce((total, event) => total + event.humanActionItems, 0)}
          tone="warning"
        />
      </section>

      <section className="rounded-[18px] border border-border-subtle bg-panel p-3 shadow-[var(--shadow-card)]">
        <div className="flex h-12 items-center gap-3 rounded-[12px] border border-border-subtle bg-panel px-4 text-text-muted">
          <SearchIcon className="h-5 w-5" />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search events or locations..."
            className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[2fr_1.2fr_2fr_0.8fr_0.9fr_1.2fr_1.2fr] gap-4 border-b border-border-subtle px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:grid">
          <span>Event</span>
          <span>Date</span>
          <span>Location</span>
          <span>Fights</span>
          <span>Fighters</span>
          <span>Status</span>
          <span>Attention</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {visibleEvents.map((event) => (
            <article
              key={event.id}
              className="grid gap-4 px-5 py-5 lg:grid-cols-[2fr_1.2fr_2fr_0.8fr_0.9fr_1.2fr_1.2fr] lg:items-center lg:px-6"
            >
              <div>
                <p className="text-[16px] font-semibold text-text-strong">{event.name}</p>
                <p className="mt-1 text-sm text-text-muted">{event.organization}</p>
              </div>
              <div className="text-[15px] text-text-body">{event.date}</div>
              <div className="text-[15px] text-text-body">{event.location}</div>
              <div className="text-[15px] font-medium text-text-strong">{event.fights}</div>
              <div className="text-[15px] font-medium text-text-strong">{event.fighters}</div>
              <div><EventStatusBadge status={event.status} /></div>
              <div className="text-[15px] text-text-body">
                {event.humanActionItems > 0
                  ? `${event.humanActionItems} human action`
                  : event.waitingItems > 0
                    ? `${event.waitingItems} waiting`
                    : "Ready"}
              </div>
            </article>
          ))}
          {visibleEvents.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-[18px] font-medium text-text-strong">No events found</p>
              <p className="mt-2 text-[15px] text-text-body">Events will appear here when promoters create them.</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warning";
}) {
  return (
    <section className="rounded-[18px] border border-border-subtle bg-panel px-5 py-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className={`mt-3 text-[32px] font-semibold ${tone === "warning" ? "text-warning" : "text-text-strong"}`}>{value}</p>
    </section>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
