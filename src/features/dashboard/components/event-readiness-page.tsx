import Link from "next/link";

import type { DashboardEventDetail } from "@/server/services/events.service";

export function EventReadinessPage({ event }: { event: DashboardEventDetail }) {
  const totalFighters = Math.max(event.fighters, 1);
  const readyPercent = Math.round((event.readiness.fighters.ready / totalFighters) * 100);

  return (
    <main className="space-y-6">
      <Link
        href={`/dashboard/promoter/events/${event.slug}`}
        className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to event</span>
      </Link>

      <section className="grid gap-6 rounded-[24px] bg-[#172846] p-6 text-white shadow-[0_22px_48px_rgba(23,40,70,0.2)] xl:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8fa3c8]">
            Event Readiness
          </p>
          <h1 className="mt-2 text-[38px] font-semibold tracking-tight">
            {event.name}
          </h1>
          <p className="mt-2 text-[18px] text-[#c7d5ee]">
            {event.date} - {event.location}
          </p>
          <p className="mt-5 max-w-[620px] text-[16px] leading-7 text-[#d8e4f7]">
            FightOps AI is coordinating routine follow-ups, monitoring deadlines,
            and separating automated work from the few decisions that need human
            judgment.
          </p>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/8 p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8fa3c8]">
                Overall readiness
              </p>
              <p className="mt-2 text-[46px] font-semibold">
                {event.aiOperations.overallReadinessPercent}%
              </p>
            </div>
            <span className="rounded-[12px] border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold">
              {event.readiness.fighters.ready} of {event.fighters} fighters ready
            </span>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${event.aiOperations.overallReadinessPercent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ReadinessMetric label="Ready fighters" value={event.readiness.fighters.ready} tone="success" />
        <ReadinessMetric label="AI handling" value={event.aiOperations.activelyHandling} tone="brand" />
        <ReadinessMetric label="Deadlines" value={event.aiOperations.monitoredDeadlines} tone="warning" />
        <ReadinessMetric label="Human action" value={event.aiOperations.escalatedIssues} tone="danger" />
        <ReadinessMetric label="Ready ratio" value={`${readyPercent}%`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
                AI Operations Layer
              </p>
              <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
                Recent automated work
              </h2>
            </div>
            <p className="rounded-[10px] border border-border-subtle bg-panel-muted px-3 py-1 text-sm text-text-body">
              {event.aiOperations.completedAutomatically} completed automatically
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {event.aiOperations.recentActivity.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-4 md:grid-cols-[auto_1fr]"
              >
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${getToneDot(item.tone)}`} />
                <div>
                  <p className="text-[16px] font-semibold text-text-strong">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-text-body">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
            Exceptions
          </p>
          <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
            Human decisions and risks
          </h2>

          <div className="mt-5 space-y-3">
            {event.aiOperations.criticalRisks.map((risk) => (
              <div
                key={risk.id}
                className={`rounded-[16px] border px-4 py-4 ${
                  risk.tone === "critical"
                    ? "border-[#ffc2c2] bg-[#fff0f0]"
                    : "border-[#ffd38f] bg-[#fff6e5]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[16px] font-semibold text-text-strong">
                      {risk.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-body">
                      {risk.detail}
                    </p>
                  </div>
                  <span
                    className={`rounded-[999px] px-3 py-1 text-xs font-semibold uppercase ${
                      risk.tone === "critical"
                        ? "bg-white text-danger"
                        : "bg-white text-warning"
                    }`}
                  >
                    {risk.tone}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <ReadinessBreakdown
          title="Fighter readiness"
          ready={event.readiness.fighters.ready}
          waiting={event.readiness.fighters.waiting}
          humanAction={event.readiness.fighters.humanAction}
        />
        <ReadinessBreakdown
          title="Fight readiness"
          ready={event.readiness.fights.ready}
          waiting={event.readiness.fights.waiting}
          humanAction={event.readiness.fights.humanAction}
        />
      </section>
    </main>
  );
}

function ReadinessMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "success" | "brand" | "warning" | "danger";
}) {
  const colorClassName =
    tone === "success"
      ? "text-success"
      : tone === "brand"
        ? "text-brand"
        : tone === "warning"
          ? "text-warning"
          : tone === "danger"
            ? "text-danger"
            : "text-text-strong";

  return (
    <article className="rounded-[18px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p className={`mt-2 text-[30px] font-semibold ${colorClassName}`}>{value}</p>
    </article>
  );
}

function ReadinessBreakdown({
  title,
  ready,
  waiting,
  humanAction,
}: {
  title: string;
  ready: number;
  waiting: number;
  humanAction: number;
}) {
  return (
    <article className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
        {title}
      </p>
      <div className="mt-5 space-y-4">
        <BreakdownRow label="Ready" value={ready} tone="success" />
        <BreakdownRow label="Waiting / AI handling" value={waiting} tone="warning" />
        <BreakdownRow label="Human action" value={humanAction} tone="danger" />
      </div>
    </article>
  );
}

function BreakdownRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger";
}) {
  const dotClassName =
    tone === "success"
      ? "bg-success"
      : tone === "danger"
        ? "bg-danger"
        : "bg-warning";

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClassName}`} />
        <span className="text-[15px] text-text-body">{label}</span>
      </div>
      <span className="text-[18px] font-semibold text-text-strong">{value}</span>
    </div>
  );
}

function getToneDot(tone: "success" | "brand" | "warning" | "danger") {
  if (tone === "success") {
    return "bg-success";
  }

  if (tone === "brand") {
    return "bg-brand";
  }

  if (tone === "danger") {
    return "bg-danger";
  }

  return "bg-warning";
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
