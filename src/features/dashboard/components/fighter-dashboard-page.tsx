import Link from "next/link";

import type { FighterDashboardData } from "@/server/services/fighter-portal.service";

type FighterDashboardPageProps = {
  dashboard: FighterDashboardData;
};

export function FighterDashboardPage({
  dashboard,
}: FighterDashboardPageProps) {
  const quickStats = [
    {
      title: "Documents",
      value: dashboard.documentSummary,
      icon: DocumentIcon,
      iconClassName: "bg-brand-surface-strong text-brand",
    },
    {
      title: "Notifications",
      value: dashboard.notificationSummary,
      icon: BellIcon,
      iconClassName: "bg-warning-surface-soft text-warning-bright",
    },
    {
      title: "Contact Support",
      value: dashboard.supportSummary,
      icon: ChatIcon,
      iconClassName: "bg-teal-surface-soft text-teal-solid",
    },
  ];

  const readinessStats = [
    {
      label: "Required",
      value: String(dashboard.readiness.required),
      toneClassName: "bg-neutral-surface text-text-strong",
      detailClassName: "text-text-body",
    },
    {
      label: "Verified",
      value: String(dashboard.readiness.verified),
      toneClassName: "bg-success-surface-muted text-success-strong",
      detailClassName: "text-success-muted",
    },
    {
      label: "Pending",
      value: String(dashboard.readiness.pending),
      toneClassName: "bg-warning-surface-strong text-warning-muted",
      detailClassName: "text-warning-soft",
    },
    {
      label: "Rejected",
      value: String(dashboard.readiness.rejected),
      toneClassName: "bg-danger-surface text-danger-strong",
      detailClassName: "text-danger-muted",
    },
  ];

  return (
    <main className="space-y-7">
      <section className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          Welcome back
        </p>
        <h1 className="text-[30px] font-semibold tracking-tight text-text-strong sm:text-[44px]">
          {dashboard.fighterName}
        </h1>
        <p className="text-lg text-text-body">
          Here&apos;s your fight preparation status
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {quickStats.map((item) => (
          <article
            key={item.title}
            className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${item.iconClassName}`}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-[17px] font-semibold text-text-strong">
              {item.title}
            </h2>
            <p className="mt-1 text-[15px] text-text-body">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.04fr_1fr]">
        <article className="rounded-[20px] bg-fighter-dark p-6 text-text-inverse shadow-[var(--shadow-fighter-card)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-fighter-dark-muted">
                Upcoming Fight
              </p>
              <h2 className="mt-6 text-[22px] font-semibold">
                {dashboard.upcomingFight?.eventName ?? "No fight assigned yet"}
              </h2>
            </div>
            <span className="inline-flex rounded-[8px] border border-fighter-confirmed-border bg-fighter-confirmed-bg px-3 py-1 text-sm font-medium text-fighter-confirmed-text">
              {dashboard.upcomingFight?.statusLabel ?? "Waiting"}
            </span>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <DetailBlock
              label="Date"
              value={dashboard.upcomingFight?.date ?? "To be announced"}
            />
            <DetailBlock
              label="Venue"
              value={dashboard.upcomingFight?.venue ?? "To be announced"}
            />
            <DetailBlock
              label="Opponent"
              value={dashboard.upcomingFight?.opponent ?? "To be announced"}
            />
            <DetailBlock
              label="Weight Class"
              value={dashboard.upcomingFight?.weightClass ?? "To be announced"}
            />
          </div>

          <Link
            href="/dashboard/fighter/events"
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-[14px] border border-fighter-secondary-border bg-transparent px-4 text-[16px] font-medium text-text-inverse transition hover:bg-panel/5"
          >
            View all fights
          </Link>
        </article>

        <article className="rounded-[20px] border border-border-subtle bg-panel p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
                Readiness
              </p>
              <h2 className="mt-3 text-[24px] font-semibold text-text-strong sm:text-[28px]">
                {dashboard.readiness.percentage}% Ready
              </h2>
            </div>
            <span className="inline-flex rounded-[8px] border border-brand-border bg-brand-surface-strong px-3 py-1 text-sm font-semibold uppercase text-brand">
              {dashboard.readiness.statusLabel}
            </span>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-progress-track">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${dashboard.readiness.percentage}%` }}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {readinessStats.map((item) => (
              <div
                key={item.label}
                className={`rounded-[16px] px-4 py-4 text-center ${item.toneClassName}`}
              >
                <div className="text-[18px] font-semibold">{item.value}</div>
                <div className={`mt-1 text-sm ${item.detailClassName}`}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/dashboard/fighter/documents"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-brand px-4 text-[16px] font-medium text-text-inverse transition hover:bg-brand-strong"
          >
            View Required Documents
          </Link>
        </article>
      </section>
    </main>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-fighter-meta">
        {label}
      </p>
      <p className="text-[16px] font-semibold text-text-inverse">{value}</p>
    </div>
  );
}

type IconProps = {
  className?: string;
};

function DocumentIcon({ className }: IconProps) {
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
      <path d="M8 3.8h6l4.2 4.2V20a1.8 1.8 0 0 1-1.8 1.8H8A1.8 1.8 0 0 1 6.2 20V5.6A1.8 1.8 0 0 1 8 3.8Z" />
      <path d="M14 3.8V8h4.2" />
      <path d="M9.5 12.5h5" />
      <path d="M9.5 16h5" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
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
      <path d="M6.5 9.5a5.5 5.5 0 1 1 11 0c0 6 2.5 7 2.5 7h-16s2.5-1 2.5-7" />
      <path d="M10 19a2.3 2.3 0 0 0 4 0" />
    </svg>
  );
}

function ChatIcon({ className }: IconProps) {
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
      <path d="M7 17.5 3 21v-4.8A7.5 7.5 0 0 1 5.3 4.8 10.6 10.6 0 0 1 12 3c5 0 9 3.4 9 7.7s-4 7.8-9 7.8c-1.8 0-3.5-.4-5-1Z" />
      <path d="M8.5 10.8h.01" />
      <path d="M12 10.8h.01" />
      <path d="M15.5 10.8h.01" />
    </svg>
  );
}
