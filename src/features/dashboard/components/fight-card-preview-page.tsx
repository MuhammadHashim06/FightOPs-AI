import Link from "next/link";

import type { DashboardEventDetail } from "@/server/services/events.service";
import type { FightCardOptionRecord } from "@/types/event";

export function FightCardPreviewPage({
  event,
  cardGroupOptions,
}: {
  event: DashboardEventDetail;
  cardGroupOptions: FightCardOptionRecord[];
}) {
  const groups = cardGroupOptions
    .map((group) => ({
      key: group.key,
      label: group.label,
      bouts: event.bouts.filter((bout) => bout.cardGroup === group.key),
    }))
    .filter((group) => group.bouts.length > 0);

  return (
    <main className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/dashboard/promoter/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm text-text-body transition hover:text-text-strong"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to builder
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
            Fight card preview
          </p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            {event.name}
          </h1>
          <p className="mt-1 text-[15px] text-text-body">
            {event.fights} bout{event.fights === 1 ? "" : "s"} grouped by card section.
          </p>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.key}
              className="overflow-hidden rounded-[20px] border border-border-subtle bg-panel px-5 shadow-[var(--shadow-card)] sm:px-8"
            >
              <div className="flex items-center gap-4 border-b border-border-subtle py-6">
                <h2 className="text-[22px] font-semibold uppercase tracking-[0.08em] text-text-strong">
                  {group.label}
                </h2>
                <div className="h-px flex-1 bg-border-subtle" />
                <span className="text-sm text-text-muted">
                  {group.bouts.length} bout{group.bouts.length === 1 ? "" : "s"}
                </span>
              </div>

              <div>
                {group.bouts.map((bout) => (
                  <PreviewBout key={bout.id} bout={bout} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="rounded-[20px] border border-border-subtle bg-panel px-6 py-16 text-center shadow-[var(--shadow-card)]">
          <p className="text-lg font-semibold text-text-strong">No fights added yet</p>
          <p className="mt-2 text-sm text-text-body">
            Add a fight to see the grouped public card preview.
          </p>
        </section>
      )}
    </main>
  );
}

function PreviewBout({
  bout,
}: {
  bout: DashboardEventDetail["bouts"][number];
}) {
  return (
    <article className="grid items-center gap-4 border-b border-border-subtle py-7 last:border-b-0 sm:grid-cols-[108px_minmax(0,1fr)_150px_minmax(0,1fr)_108px] sm:gap-5">
      <PreviewAvatar name={bout.leftFighter.name} photoUrl={bout.leftFighter.photoUrl} />
      <FighterName fighter={bout.leftFighter} align="left" />
      <div className="order-first flex flex-col items-center justify-center sm:order-none">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          {bout.order} vs
        </span>
        <span className="mt-1 text-center text-sm font-semibold uppercase tracking-[0.08em] text-text-strong">
          {bout.division}
        </span>
        <StatusPill label={getPublicStatus(bout)} />
      </div>
      <FighterName fighter={bout.rightFighter} align="right" />
      <PreviewAvatar name={bout.rightFighter.name} photoUrl={bout.rightFighter.photoUrl} />
    </article>
  );
}

function FighterName({
  fighter,
  align,
}: {
  fighter: DashboardEventDetail["bouts"][number]["leftFighter"];
  align: "left" | "right";
}) {
  const isTbd = fighter.name === "TBD Fighter";

  return (
    <div className={align === "right" ? "text-left sm:text-right" : "text-left"}>
      <p className={`text-[17px] font-semibold ${isTbd ? "text-text-muted" : "text-text-strong"}`}>
        {isTbd ? "TBD" : fighter.name}
      </p>
      {!isTbd ? (
        <>
          <p className="mt-1 text-sm text-text-muted">{fighter.country}</p>
          <p className="mt-1 text-sm text-text-body">{fighter.stance}</p>
        </>
      ) : null}
    </div>
  );
}

function PreviewAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const isTbd = name === "TBD Fighter";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div
      className={`h-[78px] w-[78px] shrink-0 overflow-hidden rounded-[12px] border border-border-subtle ${
        isTbd ? "bg-panel-muted" : "bg-fighter-dark"
      }`}
      style={photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
    >
      {!photoUrl ? (
        <div className="flex h-full items-center justify-center text-lg font-semibold text-text-muted">
          {isTbd ? "" : initials || "F"}
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${label === "Confirmed" ? "bg-success-surface-strong text-success" : "bg-danger-surface text-danger"}`}>
      <span className="mr-1">●</span>
      {label}
    </span>
  );
}

function getPublicStatus(bout: DashboardEventDetail["bouts"][number]) {
  return bout.readinessPercent === 100 && bout.leftFighter.name !== "TBD Fighter" && bout.rightFighter.name !== "TBD Fighter"
    ? "Confirmed"
    : "Open";
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </svg>
  );
}
