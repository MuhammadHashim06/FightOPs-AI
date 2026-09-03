import Link from "next/link";

import type { getAdminOverviewData } from "@/server/services/admin.service";

type AdminOverviewData = Awaited<ReturnType<typeof getAdminOverviewData>>;

export function AdminDashboardPage({
  data,
}: {
  data: AdminOverviewData;
}) {
  const stats: Array<{
    label: string;
    value: number;
    href: string;
    tone?: "warning" | "danger";
  }> = [
    { label: "Total events", value: data.stats.totalEvents, href: "/dashboard/admin/events" },
    { label: "Active events", value: data.stats.activeEvents, href: "/dashboard/admin/events" },
    { label: "Fights", value: data.stats.totalFights, href: "/dashboard/admin/events" },
    { label: "Fighters", value: data.stats.totalFighters, href: "/dashboard/admin/events" },
    { label: "Documents to review", value: data.stats.pendingDocuments, href: "/dashboard/admin/documents", tone: "warning" },
    { label: "Human action", value: data.stats.humanActionCases, href: "/dashboard/admin/human-action", tone: "danger" },
  ];

  return (
    <main className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          Platform operations
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Admin overview
        </h1>
        <p className="text-lg text-text-body">
          Monitor the operational health of every promotion from one place.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-[18px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)] transition hover:border-brand-border hover:shadow-[var(--shadow-button)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{stat.label}</p>
            <p className={`mt-3 text-[32px] font-semibold ${stat.tone === "warning" ? "text-warning" : stat.tone === "danger" ? "text-danger" : "text-text-strong"}`}>{stat.value}</p>
            <p className="mt-1 text-sm text-text-muted">Open workspace</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <h2 className="text-[18px] font-semibold text-text-strong">Events needing attention</h2>
              <p className="mt-1 text-sm text-text-muted">Waiting requirements and human decisions across the platform.</p>
            </div>
            <Link href="/dashboard/admin/events" className="text-sm font-medium text-brand hover:text-brand-strong">View all</Link>
          </div>
          <div className="divide-y divide-border-subtle">
            {data.urgentEvents.map((event) => (
              <div key={event.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-text-strong">{event.name}</p>
                  <p className="mt-1 text-sm text-text-muted">{event.date} - {event.location}</p>
                </div>
                <div className="flex gap-3 text-sm">
                  {event.humanActionItems > 0 ? <span className="text-danger">{event.humanActionItems} human action</span> : null}
                  {event.waitingItems > 0 ? <span className="text-warning">{event.waitingItems} waiting</span> : null}
                </div>
              </div>
            ))}
            {data.urgentEvents.length === 0 ? <EmptyState text="All events are currently on track." /> : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <h2 className="text-[18px] font-semibold text-text-strong">Recent activity</h2>
              <p className="mt-1 text-sm text-text-muted">Latest persisted operational decisions.</p>
            </div>
            <Link href="/dashboard/admin/activity-logs" className="text-sm font-medium text-brand hover:text-brand-strong">View all</Link>
          </div>
          <div className="divide-y divide-border-subtle">
            {data.recentActivity.map((entry) => (
              <div key={entry.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-text-strong">{entry.actionTitle}</p>
                  <p className="text-xs text-text-muted">{entry.timestamp}</p>
                </div>
                <p className="mt-1 text-sm text-text-body">{entry.fighterName} - {entry.stateChange}</p>
              </div>
            ))}
            {data.recentActivity.length === 0 ? <EmptyState text="No persisted activity yet." /> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-5 py-10 text-center text-sm text-text-muted">{text}</p>;
}
