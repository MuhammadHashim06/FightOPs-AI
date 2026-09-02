import Link from "next/link";
import type { JSX } from "react";

import type { FighterFightListItem } from "@/server/services/fighter-portal.service";

type FighterFightDetailsPageProps = {
  fights: FighterFightListItem[];
};

export function FighterFightDetailsPage({
  fights,
}: FighterFightDetailsPageProps) {
  const upcomingFights = fights.filter((fight) => fight.group === "upcoming");
  const completedFights = fights.filter((fight) => fight.group === "completed");

  return (
    <main className="space-y-7">
      <section className="space-y-1">
        <h1 className="text-[30px] font-semibold tracking-tight text-text-strong sm:text-[44px]">
          Fight Details
        </h1>
        <p className="text-lg text-text-body">{fights.length} assigned fights</p>
      </section>

      <FightGroup title="Upcoming" fights={upcomingFights} />
      <FightGroup title="Completed" fights={completedFights} />

      {fights.length === 0 ? (
        <section className="rounded-[20px] border border-border-subtle bg-panel p-8 text-center shadow-[var(--shadow-card)]">
          <h2 className="text-[22px] font-semibold text-text-strong">
            No fights assigned yet
          </h2>
          <p className="mt-2 text-[15px] text-text-body">
            Your promoter will add your next bout here once it is ready.
          </p>
        </section>
      ) : null}
    </main>
  );
}

function FightGroup({
  title,
  fights,
}: {
  title: string;
  fights: FighterFightListItem[];
}) {
  if (fights.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
        {title}
      </p>
      <div className="grid gap-5 xl:grid-cols-2">
        {fights.map((fight) => (
          <article
            key={fight.id}
            className="rounded-[20px] border border-border-subtle bg-panel p-6 shadow-[var(--shadow-card)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[19px] font-semibold text-text-strong">
                  {fight.eventName}
                </h2>
                <p className="mt-1 text-[15px] text-text-body">{fight.date}</p>
              </div>
              <span
                className={`inline-flex rounded-[8px] border px-3 py-1 text-sm font-medium ${fight.statusClassName}`}
              >
                {fight.status}
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FightMeta icon={UserIcon} label="Opponent" value={fight.opponent} />
              <FightMeta icon={PinIcon} label="Venue" value={fight.venue} />
              <FightMeta icon={ScaleIcon} label="Weight" value={fight.weight} />
              <FightMeta icon={BagIcon} label="Position" value={fight.position} />
            </div>

            <div className="mt-5 flex justify-end">
              <Link
                href={`/dashboard/fighter/events/${fight.id}`}
                className="inline-flex items-center gap-1 text-[15px] font-medium text-brand transition hover:text-brand-strong"
              >
                View details <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FightMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: ({ className }: { className?: string }) => JSX.Element;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="pt-0.5 text-fighter-link-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
          {label}
        </p>
        <p className="mt-1 text-[16px] font-medium text-text-strong">{value}</p>
      </div>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="8.5" r="3.25" />
      <path d="M5.5 18.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
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
      <path d="M12 20s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
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
      <path d="M4 7h16" />
      <path d="M6.5 7 4 18h6L7.5 7" />
      <path d="M17.5 7 20 18h-6l2.5-11" />
      <path d="M12 4v14" />
      <path d="m9.8 11.2 2.2-2.2 2.2 2.2" />
    </svg>
  );
}

function BagIcon({ className }: { className?: string }) {
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
      <path d="M6 9h12l-1 10H7L6 9Z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
