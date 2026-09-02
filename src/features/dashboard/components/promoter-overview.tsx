import Link from "next/link";

import type {
  DashboardEventSummary,
  DashboardOverviewStats,
} from "@/server/services/events.service";

export function PromoterOverview({
  events,
  stats = [],
}: {
  events: DashboardEventSummary[];
  stats?: DashboardOverviewStats;
}) {
  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[24px] bg-transparent py-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Overview
          </h1>
          <p className="text-lg text-text-body">
            Operational readiness across your events.
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[16px] border border-border-subtle bg-panel px-4 py-4 shadow-[var(--shadow-card)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              {stat.label}
            </p>
            <p
              className={`mt-3 text-[22px] font-semibold ${
                stat.tone === "warning"
                  ? "text-warning"
                  : stat.tone === "highlight"
                    ? "text-info"
                    : "text-text-strong"
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-text-muted">{stat.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {events.map((event) => (
          <article
            key={event.slug}
            className="rounded-[16px] border border-border-subtle bg-panel p-4 shadow-[var(--shadow-card-strong)]"
          >
            <div className="space-y-1">
              <h2 className="text-[18px] font-semibold text-text-strong">
                {event.name}
              </h2>
              <p className="text-sm text-text-muted">{event.organization}</p>
            </div>

            <div className="mt-5 space-y-3 text-[15px] text-text-body">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-4 w-4 text-text-muted" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-3">
                <LocationIcon className="h-4 w-4 text-text-muted" />
                <span>{event.location}</span>
              </div>
              <p>{event.fights} fights - {event.fighters} fighters assigned</p>
            </div>

            <Link
              href={`/dashboard/promoter/events/${event.slug}`}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-brand text-sm font-semibold text-text-inverse transition hover:bg-brand-strong"
            >
              Open Event
            </Link>
          </article>
        ))}
      </section>

      {events.length === 0 ? (
        <section className="rounded-[16px] border border-border-subtle bg-panel px-5 py-10 text-center shadow-[var(--shadow-card)]">
          <p className="text-[20px] font-semibold text-text-strong">
            No events created yet
          </p>
          <p className="mt-2 text-[15px] text-text-body">
            Create your first event to start building the fight card.
          </p>
        </section>
      ) : null}
    </main>
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

function CalendarIcon({ className }: { className?: string }) {
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
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
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
      <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.3" />
    </svg>
  );
}
