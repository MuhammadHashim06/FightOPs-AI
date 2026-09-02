import Link from "next/link";

import type { DashboardEventSummary } from "@/server/services/events.service";

export function PromoterEventsPage({
  events,
}: {
  events: DashboardEventSummary[];
}) {
  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-4 py-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Events
          </h1>
          <p className="text-lg text-text-body">
            All events and their operational readiness.
          </p>
        </div>

        <Link
          href="/dashboard/promoter/events/create"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-brand px-5 text-sm font-semibold text-text-inverse shadow-[var(--shadow-button)] transition hover:bg-brand-strong"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Create Event</span>
        </Link>
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel p-3 shadow-[var(--shadow-card)]">
        <div className="flex h-12 items-center gap-3 rounded-[12px] border border-border-subtle bg-panel px-4 text-text-muted">
          <SearchIcon className="h-5 w-5" />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[2fr_1.2fr_2.2fr_1fr_1fr_1.3fr_1fr] gap-4 border-b border-border-subtle px-10 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:grid">
          <span>Event</span>
          <span>Date</span>
          <span>Location</span>
          <span>Fights</span>
          <span>Fighters</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {events.map((event) => (
            <Link
              key={event.slug}
              href={`/dashboard/promoter/events/${event.slug}`}
              className="group grid gap-4 px-5 py-5 transition hover:bg-panel-muted lg:grid-cols-[2fr_1.2fr_2.2fr_1fr_1fr_1.3fr_1fr] lg:px-10"
            >
              <div>
                <p className="text-lg font-semibold text-text-strong">{event.name}</p>
              </div>
              <div className="text-[15px] text-text-body">{event.date}</div>
              <div className="text-[15px] text-text-body">{event.location}</div>
              <div className="text-[15px] text-text-strong">{event.fights}</div>
              <div className="text-[15px] text-text-strong">{event.fighters}</div>
              <div>
                <EventStatusBadge status={event.status} />
              </div>
              <div>
                <span className="text-[15px] font-medium text-brand transition group-hover:text-brand-strong">
                  Open
                </span>
              </div>
            </Link>
          ))}

          {events.length === 0 ? (
            <div className="px-5 py-12 text-center lg:px-10">
              <p className="text-[18px] font-medium text-text-strong">
                No events found
              </p>
              <p className="mt-2 text-[15px] text-text-body">
                Create your first event to begin operational tracking.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export function EventStatusBadge({ status }: { status: DashboardEventSummary["status"] }) {
  const styles =
    status === "active"
      ? "border-success-border bg-success-surface text-success"
      : status === "upcoming"
        ? "border-brand-border bg-brand-surface-strong text-brand"
        : "border-border-subtle bg-panel-muted text-text-body";

  return (
    <span
      className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
