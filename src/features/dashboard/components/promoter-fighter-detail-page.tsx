import Link from "next/link";

import type { PromoterEventFighterDetailData } from "@/server/services/events.service";

export function PromoterFighterDetailPage({
  data,
}: {
  data: PromoterEventFighterDetailData;
}) {
  return (
    <main className="space-y-6">
      <Link
        href={`/dashboard/promoter/events/${data.event.slug}/fighters`}
        className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to fighters</span>
      </Link>

      <section className="overflow-hidden rounded-[24px] bg-surface-dark-alt text-text-inverse shadow-[var(--shadow-dark-hero)]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-surface-dark-muted-alt">
              Fighter profile
            </p>
            <h1 className="mt-2 text-[34px] font-semibold tracking-tight">
              {data.fighter.name}
            </h1>
            <p className="mt-2 text-[18px] text-surface-dark-body">
              {data.event.name} - {data.fight.position} - {data.fight.weightClass}
            </p>
          </div>

          <div className="rounded-[18px] border border-text-inverse/10 bg-panel/8 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-surface-dark-muted-alt">
                  Readiness
                </p>
                <p className="mt-1 text-[36px] font-semibold">
                  {data.readiness.percentage}%
                </p>
              </div>
              <StatusPill label={data.readiness.statusLabel} tone={getStatusTone(data.readiness.statusLabel)} />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel/15">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${data.readiness.percentage}%` }}
              />
            </div>
            <p className="mt-4 text-[15px] leading-6 text-surface-dark-body">
              {data.readiness.nextAction}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Completed" value={data.readiness.completed} tone="success" />
        <MetricCard label="In review" value={data.readiness.needsReview} tone="brand" />
        <MetricCard label="Missing" value={data.readiness.missing} tone="warning" />
        <MetricCard label="Pending total" value={data.readiness.pending + data.readiness.missing} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <InfoCard
          title="Fighter and Contact"
          rows={[
            ["Manager", data.fighter.managerName],
            ["Contact email", data.fighter.contactEmail],
            ["Contact phone", data.fighter.contactPhone],
            ["Nationality", data.fighter.nationality],
            ["Stance", data.fighter.stance],
            ["Invite status", data.fighter.inviteStatus],
            ["Invite accepted", data.fighter.inviteAcceptedAt],
          ]}
        />

        <InfoCard
          title="Fight Context"
          rows={[
            ["Event", data.event.name],
            ["Event date", data.event.date],
            ["Venue", data.event.location],
            ["Opponent", data.fight.opponent],
            ["Weight class", data.fight.weightClass],
            ["Card position", data.fight.position],
            ["Contract", data.fighter.contractReference],
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
            Operational areas
          </p>
          <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
            Requirement groups
          </h2>

          <div className="mt-5 space-y-3">
            {data.requirementGroups.map((group) => (
              <div
                key={group.category}
                className="rounded-[16px] border border-border-subtle bg-panel-muted p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[16px] font-semibold text-text-strong">
                    {group.category}
                  </p>
                  <StatusPill
                    label={group.statusLabel}
                    tone={group.completed === group.total ? "success" : "warning"}
                  />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.round((group.completed / group.total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
            Requirements
          </p>
          <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
            Documents and operational checklist
          </h2>

          <div className="mt-5 divide-y divide-border-subtle overflow-hidden rounded-[16px] border border-border-subtle">
            {data.requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="grid gap-4 bg-panel px-4 py-4 lg:grid-cols-[1fr_0.7fr_0.8fr_auto]"
              >
                <div>
                  <p className="text-[16px] font-semibold text-text-strong">
                    {requirement.name}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {requirement.category} - {requirement.dueLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-body">
                    {requirement.description}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Latest file
                  </p>
                  <p className="mt-2 text-sm text-text-body">
                    {requirement.fileName ?? "No upload yet"}
                  </p>
                  {requirement.submittedAt ? (
                    <p className="mt-1 text-xs text-text-muted">
                      {requirement.submittedAt}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Review note
                  </p>
                  <p className="mt-2 text-sm text-text-body">
                    {requirement.reviewNote ?? "No reviewer note"}
                  </p>
                </div>
                <div className="flex items-start justify-end gap-2">
                  <StatusPill
                    label={requirement.statusLabel}
                    tone={getStatusTone(requirement.statusLabel)}
                  />
                  <StatusPill label={requirement.priority} tone="neutral" />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
              Activity timeline
            </p>
            <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
              What FightOps AI has handled
            </h2>
          </div>
          <Link
            href={`/dashboard/promoter/activity-logs`}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-4 text-sm font-semibold text-text-strong transition hover:bg-panel-muted"
          >
            View audit log
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {data.timeline.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-4 md:grid-cols-[auto_1fr_auto]"
            >
              <span className={`mt-2 h-2.5 w-2.5 rounded-full ${getTimelineDot(item.tone)}`} />
              <div>
                <p className="text-[16px] font-semibold text-text-strong">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-text-body">{item.detail}</p>
              </div>
              <p className="text-sm text-text-muted">{item.timestamp}</p>
            </div>
          ))}

          {data.timeline.length === 0 ? (
            <div className="rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-5">
              <p className="text-[16px] font-semibold text-text-strong">
                No activity yet
              </p>
              <p className="mt-1 text-sm text-text-body">
                Automated requests, submissions, and escalations will appear here.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "brand" | "warning";
}) {
  const colorClassName =
    tone === "success"
      ? "text-success"
      : tone === "brand"
        ? "text-brand"
        : tone === "warning"
          ? "text-warning"
          : "text-text-strong";

  return (
    <div className="rounded-[18px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p className={`mt-2 text-[34px] font-semibold ${colorClassName}`}>{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <article className="overflow-hidden rounded-[20px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
      <div className="border-b border-border-subtle px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          {title}
        </p>
      </div>
      {rows.map(([label, value], index) => (
        <div
          key={`${label}-${value}`}
          className={`grid gap-3 px-5 py-4 sm:grid-cols-[0.8fr_1.2fr] ${
            index < rows.length - 1 ? "border-b border-border-subtle" : ""
          }`}
        >
          <p className="text-[15px] text-text-body">{label}</p>
          <p className="text-[15px] font-medium text-text-strong sm:text-right">
            {value}
          </p>
        </div>
      ))}
    </article>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "brand" | "neutral";
}) {
  const className =
    tone === "success"
      ? "border-success-border bg-success-surface text-success"
      : tone === "danger"
        ? "border-danger-border bg-danger-surface text-danger"
        : tone === "brand"
          ? "border-brand-border bg-brand-surface-strong text-brand"
          : tone === "warning"
            ? "border-warning-border bg-warning-surface text-warning"
            : "border-border-subtle bg-panel-muted text-text-body";

  return (
    <span className={`inline-flex h-fit rounded-[10px] border px-3 py-1 text-sm font-semibold ${className}`}>
      {label}
    </span>
  );
}

function getStatusTone(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("complete") || normalized.includes("verified") || normalized.includes("ready")) {
    return "success" as const;
  }

  if (normalized.includes("human") || normalized.includes("resubmission") || normalized.includes("review")) {
    return "danger" as const;
  }

  if (normalized.includes("processing") || normalized.includes("received") || normalized.includes("ai")) {
    return "brand" as const;
  }

  if (normalized.includes("pending") || normalized.includes("waiting")) {
    return "warning" as const;
  }

  return "neutral" as const;
}

function getTimelineDot(tone: PromoterEventFighterDetailData["timeline"][number]["tone"]) {
  if (tone === "success") {
    return "bg-success";
  }

  if (tone === "danger") {
    return "bg-danger";
  }

  if (tone === "brand") {
    return "bg-brand";
  }

  if (tone === "warning") {
    return "bg-warning";
  }

  return "bg-text-muted";
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
