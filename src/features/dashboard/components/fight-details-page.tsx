import Link from "next/link";

import { FightHeroCard } from "@/features/dashboard/components/fight-hero-card";
import type { PromoterFightDetailData } from "@/server/services/events.service";

export function FightDetailsPage({
  fight,
}: {
  fight: PromoterFightDetailData;
}) {
  const attentionCount = fight.fighterOverviews.filter(
    (item) =>
      item.inviteStatusLabel !== "Accepted" ||
      item.isContractOverdue ||
      item.contractStatusLabel === "Needs resubmission",
  ).length;

  return (
    <main className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/dashboard/promoter/events/${fight.eventSlug}`}
          className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back</span>
        </Link>

        <Link
          href={`/dashboard/promoter/events/${fight.eventSlug}/fights/${fight.id}/edit`}
          className="inline-flex h-11 items-center justify-center rounded-[12px] border border-border-subtle bg-white px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
        >
          Edit fight
        </Link>
      </div>

      <FightHeroCard bout={fight.bout} />

      <div className="grid gap-6 xl:grid-cols-[1.75fr_0.75fr]">
        <section className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight text-text-strong">
                Fight requirements
              </h1>
              <p className="text-lg text-text-body">
                Side-by-side readiness table for both fighters
              </p>
            </div>
            <span className="inline-flex rounded-[10px] border border-[#ffd38f] bg-[#fff6e5] px-3 py-1.5 text-sm font-medium text-[#dc7d09]">
              {attentionCount} item{attentionCount === 1 ? "" : "s"} need attention
            </span>
          </div>

          <div className="mt-5 inline-flex rounded-[12px] bg-panel-muted p-1">
            {["Requirements", "Documents", "AI Activity", "Details"].map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`rounded-[10px] px-4 py-2 text-[15px] font-medium transition ${
                  index === 0
                    ? "bg-white text-text-strong shadow-[0_2px_8px_rgba(23,32,51,0.08)]"
                    : "text-text-body hover:text-text-strong"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-[18px] border border-border-subtle">
            <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-border-subtle bg-[rgba(248,250,255,0.8)] text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              <div className="border-r border-border-subtle px-4 py-4">Requirement</div>
              <div className="border-r border-border-subtle px-4 py-4">
                {fight.bout.leftFighter.name}
              </div>
              <div className="px-4 py-4">{fight.bout.rightFighter.name}</div>
            </div>

            <div className="divide-y divide-border-subtle">
              {fight.requirements.map((requirement) => (
                <div
                  key={requirement.name}
                  className="grid grid-cols-[1.3fr_1fr_1fr]"
                >
                  <div className="border-r border-border-subtle px-4 py-4">
                    <p className="text-[16px] font-semibold text-text-strong">
                      {requirement.name}
                    </p>
                    <p className="mt-2 text-[15px] text-text-muted">
                      Due {requirement.dueDate}
                    </p>
                    <PriorityPill tone={requirement.priority} />
                  </div>
                  <div className="border-r border-border-subtle px-4 py-4">
                    <RequirementCell
                      status={requirement.leftStatus}
                      confidence={requirement.leftConfidence}
                      note={requirement.leftNote}
                      fileName={requirement.leftFileName}
                      submittedAt={requirement.leftSubmittedAt}
                      eventSlug={fight.eventSlug}
                    />
                  </div>
                  <div className="px-4 py-4">
                    <RequirementCell
                      status={requirement.rightStatus}
                      confidence={requirement.rightConfidence}
                      note={requirement.rightNote}
                      fileName={requirement.rightFileName}
                      submittedAt={requirement.rightSubmittedAt}
                      eventSlug={fight.eventSlug}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
            <div className="inline-flex rounded-[10px] bg-sidebar-accent px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.08em] text-brand">
              AI Summary
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <SummaryMetric label="Completed" value={String(fight.insight.completed)} tone="success" />
              <SummaryMetric label="Missing" value={String(fight.insight.missing)} tone="warning" />
              <SummaryMetric label="Under review" value={String(fight.insight.underReview)} tone="highlight" />
            </div>

            <div className="mt-8 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Waiting For
                </p>
                <div className="mt-4 space-y-4">
                  {fight.insight.waitingFor.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span className="text-[15px] text-text-body">{item.label}</span>
                      <PriorityPill tone={item.tone} />
                    </div>
                  ))}
                  {fight.insight.waitingFor.length === 0 ? (
                    <p className="text-[15px] text-text-body">
                      No blocking items right now.
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Next Action
                </p>
                <p className="mt-4 text-[15px] leading-7 text-text-body">
                  {fight.insight.nextAction}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-white px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
            >
              <span>View AI Activity</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}

function RequirementCell({
  status,
  confidence,
  note,
  fileName,
  submittedAt,
  eventSlug,
}: {
  status: "accepted" | "missing" | "under_review";
  confidence: string;
  note: string;
  fileName: string | null;
  submittedAt: string | null;
  eventSlug: string;
}) {
  const badgeStyles =
    status === "accepted"
      ? "border-[#b7ead1] bg-[#ecfbf2] text-success"
      : status === "missing"
        ? "border-[#ffc2c2] bg-[#fff0f0] text-danger"
        : "border-[#ffd38f] bg-[#fff6e5] text-[#dc7d09]";

  const label =
    status === "accepted"
      ? "Accepted"
      : status === "missing"
        ? "Missing"
        : "Under review";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium ${badgeStyles}`}>
          {label}
        </span>
        <span
          className={`text-[15px] font-medium ${
            status === "accepted"
              ? "text-success"
              : status === "missing"
                ? "text-[#c65a00]"
                : "text-[#c65a00]"
          }`}
        >
          {confidence}
        </span>
      </div>
      <p className="text-[15px] text-text-muted">{note}</p>
      {fileName ? (
        <div className="rounded-[12px] border border-border-subtle bg-panel-muted px-3 py-2">
          <p className="truncate text-sm font-medium text-text-strong">{fileName}</p>
          <p className="mt-1 text-xs text-text-muted">
            Submitted {submittedAt ?? "recently"}
          </p>
          {status === "under_review" ? (
            <Link
              href={`/dashboard/promoter/documents?event=${eventSlug}`}
              className="mt-2 inline-flex text-sm font-semibold text-brand hover:text-brand-strong"
            >
              Review document
            </Link>
          ) : null}
        </div>
      ) : (
        <p className="rounded-[12px] border border-dashed border-border-subtle bg-white px-3 py-2 text-sm text-text-muted">
          No upload yet
        </p>
      )}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "highlight";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-[#7c3aed]";

  return (
    <div>
      <p className={`text-[34px] font-semibold ${color}`}>{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}

function PriorityPill({ tone }: { tone: "critical" | "high" | "medium" | "low" }) {
  const styles =
    tone === "critical"
      ? "border-[#ffc2c2] bg-[#fff0f0] text-danger"
      : tone === "high"
        ? "border-[#ffd38f] bg-[#fff6e5] text-[#dc7d09]"
        : tone === "medium"
          ? "border-[#c9d9ff] bg-[#edf3ff] text-brand"
          : "border-border-subtle bg-panel-muted text-text-body";

  return (
    <span className={`mt-2 inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium capitalize ${styles}`}>
      {tone}
    </span>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
