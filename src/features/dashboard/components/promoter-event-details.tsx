import Link from "next/link";

import { DeleteEventButton } from "@/features/dashboard/components/delete-event-button";
import { FightHeroCard } from "@/features/dashboard/components/fight-hero-card";
import type { PromoterEventDetail } from "@/features/dashboard/data/promoter-events";

export function PromoterEventDetails({
  event,
}: {
  event: PromoterEventDetail;
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
          {event.id ? (
            <DeleteEventButton eventId={event.id} eventName={event.name} />
          ) : null}
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
            <EditIcon className="h-4 w-4" />
            <span>Edit Card</span>
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

      <div className="space-y-6">
        {event.bouts.map((bout) => (
          <Link
            key={bout.id}
            href={`/dashboard/promoter/events/${event.slug}/fights/${bout.id}`}
            className="block transition hover:-translate-y-0.5"
          >
            <FightHeroCard bout={bout} />
          </Link>
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
