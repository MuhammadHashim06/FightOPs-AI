import Link from "next/link";

import { DeleteEventButton } from "@/features/dashboard/components/delete-event-button";
import { FightHeroCard } from "@/features/dashboard/components/fight-hero-card";
import type { DashboardEventDetail } from "@/server/services/events.service";

export function PromoterEventDetails({
  event,
}: {
  event: DashboardEventDetail;
}) {
  return (
    <main className="space-y-5 pb-2">
      <Link
        href="/dashboard/promoter/events"
        className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back</span>
      </Link>

      <div className="space-y-3">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          {event.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-text-body">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <LocationIcon className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-8 border-b border-border-subtle">
        {event.tabs.map((tab, index) => (
          <EventTab
            key={tab}
            href={getEventTabHref(event.slug, tab)}
            active={index === 0}
          >
            {tab}
          </EventTab>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-[18px] font-semibold text-text-strong">Fight Card</h2>
          <p className="text-[15px] text-text-body">
            {event.fights} bouts - {event.fighters} fighters
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <DeleteEventButton eventId={event.id} eventName={event.name} />
          <Link
            href={`/dashboard/promoter/events/${event.slug}/requirements`}
            className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border-subtle bg-panel px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
          >
            Checklist
          </Link>
          <Link
            href={`/dashboard/promoter/events/${event.slug}/edit-fight-card`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-panel px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
          >
            <SortIcon className="h-4 w-4" />
            <span>Reorder Card</span>
          </Link>
          <Link
            href={`/dashboard/promoter/events/${event.slug}/add-fight`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Fight</span>
          </Link>
        </div>
      </div>

      <section className="grid gap-4 rounded-[18px] border border-border-subtle bg-panel px-4 py-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)] lg:grid-cols-2 lg:px-6">
        <ReadinessSummary title="Fight Readiness" data={event.readiness.fights} />
        <ReadinessSummary
          title="Fighter Readiness"
          data={event.readiness.fighters}
          align="right"
        />
      </section>

      <section className="grid gap-5 rounded-[22px] bg-[#172846] p-5 text-white shadow-[0_18px_40px_rgba(23,40,70,0.18)] xl:grid-cols-[1fr_1.3fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8fa3c8]">
            AI Operations
          </p>
          <h2 className="mt-2 text-[28px] font-semibold">
            {event.aiOperations.overallReadinessPercent}% event ready
          </h2>
          <p className="mt-3 text-[15px] leading-6 text-[#c7d5ee]">
            FightOps AI is monitoring this event, following up on routine work,
            and surfacing only exceptional decisions.
          </p>
          <Link
            href={`/dashboard/promoter/events/${event.slug}/readiness`}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Open readiness view
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AiMetric
            label="Completed by AI"
            value={event.aiOperations.completedAutomatically}
            tone="success"
          />
          <AiMetric
            label="Currently handling"
            value={event.aiOperations.activelyHandling}
            tone="brand"
          />
          <AiMetric
            label="Deadlines monitored"
            value={event.aiOperations.monitoredDeadlines}
            tone="warning"
          />
          <AiMetric
            label="Human escalations"
            value={event.aiOperations.escalatedIssues}
            tone="danger"
          />
        </div>

        <div className="rounded-[18px] border border-white/10 bg-white/8 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8fa3c8]">
            Next follow-up
          </p>
          <p className="mt-3 text-[15px] leading-6 text-[#d8e4f7]">
            {event.aiOperations.nextFollowUp}
          </p>
          <div className="mt-5 space-y-3">
            {event.aiOperations.recentActivity.slice(0, 2).map((item) => (
              <div key={item.id} className="flex gap-3">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${getAiDotClassName(item.tone)}`} />
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-[#b9c8e3]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {event.bouts.map((bout) => (
          <article
            key={bout.id}
            className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]"
          >
            <FightHeroCard bout={bout} />
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border-subtle px-5 py-4">
              <Link
                href={`/dashboard/promoter/events/${event.slug}/fights/${bout.id}`}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-white px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
              >
                Open details
              </Link>
              <Link
                href={`/dashboard/promoter/events/${event.slug}/fights/${bout.id}/edit`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
              >
                <EditIcon className="h-4 w-4" />
                <span>Edit Fight</span>
              </Link>
            </div>
          </article>
        ))}

        {event.bouts.length === 0 ? (
          <section className="rounded-[18px] border border-border-subtle bg-panel px-5 py-10 text-center shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
            <p className="text-[20px] font-semibold text-text-strong">
              No fights added yet
            </p>
            <p className="mt-2 text-[15px] text-text-body">
              Add fights to this event and readiness tracking will appear here.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function ReadinessSummary({
  title,
  data,
  align = "left",
}: {
  title: string;
  data: {
    ready: number;
    waiting: number;
    humanAction: number;
  };
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "lg:pl-10 lg:text-right" : "lg:pr-10"}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        {title}
      </p>
      <div
        className={`mt-3 space-y-3 ${
          align === "right" ? "lg:ml-auto lg:max-w-[220px]" : "max-w-[220px]"
        }`}
      >
        <ReadinessRow label="Ready" value={data.ready} tone="success" />
        <ReadinessRow label="Waiting" value={data.waiting} tone="warning" />
        <ReadinessRow label="Human Action" value={data.humanAction} tone="highlight" />
      </div>
    </div>
  );
}

function AiMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "brand" | "warning" | "danger";
}) {
  const colorClassName =
    tone === "success"
      ? "text-[#5be49b]"
      : tone === "brand"
        ? "text-[#8fb1ff]"
        : tone === "warning"
          ? "text-[#f7ba45]"
          : "text-[#ff8a8a]";

  return (
    <div className="rounded-[16px] border border-white/10 bg-white/8 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8fa3c8]">
        {label}
      </p>
      <p className={`mt-2 text-[30px] font-semibold ${colorClassName}`}>
        {value}
      </p>
    </div>
  );
}

function getAiDotClassName(tone: "success" | "brand" | "warning" | "danger") {
  if (tone === "success") {
    return "bg-[#5be49b]";
  }

  if (tone === "brand") {
    return "bg-[#8fb1ff]";
  }

  if (tone === "danger") {
    return "bg-[#ff8a8a]";
  }

  return "bg-[#f7ba45]";
}

function EventTab({
  children,
  href,
  active = false,
}: {
  children: string;
  href?: string;
  active?: boolean;
}) {
  const className = `border-b-2 px-3 pb-3 text-[15px] font-medium transition ${
    active
      ? "border-brand text-brand"
      : "border-transparent text-text-body hover:text-text-strong"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {children}
    </button>
  );
}

function getEventTabHref(eventSlug: string, tab: string) {
  if (tab === "Fight Card") {
    return `/dashboard/promoter/events/${eventSlug}`;
  }

  if (tab === "Fighters") {
    return `/dashboard/promoter/events/${eventSlug}/fighters`;
  }

  if (tab === "Event Readiness") {
    return `/dashboard/promoter/events/${eventSlug}/readiness`;
  }

  if (tab === "Required Documents") {
    return `/dashboard/promoter/events/${eventSlug}/requirements`;
  }

  if (tab === "Post Reminders") {
    return `/dashboard/promoter/events/${eventSlug}/post-reminders`;
  }

  return undefined;
}

function ReadinessRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "highlight";
}) {
  const dotColor =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : "bg-[#7c3aed]";

  return (
    <div className="flex items-center justify-between gap-4 text-[15px] text-text-body">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <span>{label}</span>
      </div>
      <span className="font-semibold text-text-strong">{value}</span>
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
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

function EditIcon({ className }: { className?: string }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}

function SortIcon({ className }: { className?: string }) {
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
      <path d="M10 6h10" />
      <path d="M6 12h14" />
      <path d="M3 18h17" />
    </svg>
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
