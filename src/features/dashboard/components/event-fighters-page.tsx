"use client";

import { useState } from "react";
import Link from "next/link";

import type { PromoterEventFighterListData } from "@/server/services/events.service";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Ready", value: "ready" },
  { label: "AI handling", value: "ai_handling" },
  { label: "Human action", value: "human_action" },
  { label: "Waiting", value: "waiting" },
] as const;

export function EventFightersPage({
  data,
}: {
  data: PromoterEventFighterListData;
}) {
  const [searchValue, setSearchValue] = useState("");
  const [activeStatus, setActiveStatus] =
    useState<(typeof statusFilters)[number]["value"]>("all");
  const normalizedSearch = searchValue.trim().toLowerCase();
  const visibleFighters = data.fighters.filter((fighter) => {
    const matchesStatus =
      activeStatus === "all" || fighter.status === activeStatus;
    const matchesSearch =
      !normalizedSearch ||
      fighter.name.toLowerCase().includes(normalizedSearch) ||
      fighter.opponent.toLowerCase().includes(normalizedSearch) ||
      fighter.weightClass.toLowerCase().includes(normalizedSearch) ||
      fighter.managerName.toLowerCase().includes(normalizedSearch) ||
      fighter.contactEmail.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  return (
    <main className="space-y-5">
      <Link
        href={`/dashboard/promoter/events/${data.event.slug}`}
        className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to fight card</span>
      </Link>

      <div className="flex flex-col gap-4 py-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Fighters
          </h1>
          <p className="text-lg text-text-body">
            {data.event.name} - {data.event.date} - {data.event.location}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <SummaryTile label="Total" value={data.summary.total} />
          <SummaryTile label="Ready" value={data.summary.ready} tone="success" />
          <SummaryTile label="AI handling" value={data.summary.aiHandling} tone="processing" />
          <SummaryTile label="Human action" value={data.summary.humanAction} tone="danger" />
          <SummaryTile label="Waiting" value={data.summary.waiting} tone="warning" />
        </div>
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex h-11 w-full items-center gap-3 rounded-[12px] border border-border-subtle bg-panel px-3 text-text-muted xl:max-w-[520px]">
            <SearchIcon className="h-4 w-4" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search fighter, opponent, manager..."
              className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => {
              const isActive = activeStatus === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveStatus(filter.value)}
                  className={`inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand text-text-inverse shadow-[var(--shadow-button-soft)]"
                      : "border border-border-subtle bg-panel text-text-body hover:bg-panel-muted hover:text-text-strong"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[1.2fr_1fr_0.7fr_0.85fr_repeat(6,0.75fr)_0.7fr] border-b border-border-subtle bg-[var(--table-head-bg)] px-4 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted xl:grid">
          <div>Fighter</div>
          <div>Opponent</div>
          <div>Weight</div>
          <div>Readiness</div>
          <div>Contract</div>
          <div>Docs</div>
          <div>Medical</div>
          <div>Visa</div>
          <div>Travel</div>
          <div>Stay</div>
          <div>Action</div>
        </div>

        <div className="divide-y divide-border-subtle">
          {visibleFighters.map((fighter) => (
            <article
              key={fighter.id}
              className="grid gap-4 px-4 py-4 xl:grid-cols-[1.2fr_1fr_0.7fr_0.85fr_repeat(6,0.75fr)_0.7fr] xl:items-center"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-brand">
                    {getInitials(fighter.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-text-strong">
                      {fighter.name}
                    </p>
                    <p className="truncate text-sm text-text-muted">
                      {fighter.managerName} - {fighter.contactEmail}
                    </p>
                  </div>
                </div>
              </div>

              <InfoCell label="Opponent" value={fighter.opponent} />
              <InfoCell label="Weight" value={fighter.weightClass} />
              <ReadinessCell
                percent={fighter.readinessPercent}
                status={fighter.status}
                statusLabel={fighter.statusLabel}
              />
              <StatusCell label="Contract" value={fighter.contract} />
              <StatusCell label="Docs" value={fighter.documents} />
              <StatusCell label="Medical" value={fighter.medical} />
              <StatusCell label="Visa" value={fighter.visa} />
              <StatusCell label="Travel" value={fighter.travel} />
              <StatusCell label="Stay" value={fighter.accommodation} />

              <div className="flex justify-end xl:justify-start">
                {fighter.fightId ? (
                  <Link
                    href={`/dashboard/promoter/events/${data.event.slug}/fighters/${fighter.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-4 text-sm font-semibold text-brand transition hover:bg-sidebar-accent"
                  >
                    Profile
                  </Link>
                ) : (
                  <span className="text-sm text-text-muted">No fight</span>
                )}
              </div>
            </article>
          ))}

          {visibleFighters.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-[18px] font-medium text-text-strong">
                No fighters found
              </p>
              <p className="mt-2 text-[15px] text-text-body">
                Try changing the status filter or search term.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function SummaryTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "processing" | "danger" | "warning";
}) {
  const toneClassName =
    tone === "success"
      ? "text-success"
      : tone === "processing"
        ? "text-brand"
        : tone === "danger"
          ? "text-danger"
          : tone === "warning"
            ? "text-warning"
            : "text-text-strong";

  return (
    <div className="min-w-[116px] rounded-[16px] border border-border-subtle bg-panel px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
        {label}
      </p>
      <p className={`mt-1 text-[26px] font-semibold ${toneClassName}`}>{value}</p>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted xl:hidden">
        {label}
      </p>
      <p className="mt-1 text-[15px] text-text-body xl:mt-0">{value}</p>
    </div>
  );
}

function ReadinessCell({
  percent,
  status,
  statusLabel,
}: {
  percent: number;
  status: PromoterEventFighterListData["fighters"][number]["status"];
  statusLabel: string;
}) {
  const progressClassName = status === "ready" ? "bg-success" : "bg-brand";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted xl:hidden">
        Readiness
      </p>
      <div className="mt-2 flex items-center gap-3 xl:mt-0">
        <div className="h-2 w-20 overflow-hidden rounded-full bg-panel-muted">
          <div
            className={`h-full rounded-full ${progressClassName}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-text-strong">{percent}%</span>
      </div>
      <StatusBadge value={statusLabel} />
    </div>
  );
}

function StatusCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted xl:hidden">
        {label}
      </p>
      <StatusBadge value={value} />
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const styles = getStatusBadgeStyles(value);

  return (
    <span className={`mt-2 inline-flex rounded-[10px] border px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {value}
    </span>
  );
}

function getStatusBadgeStyles(value: string) {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes("ready") || normalizedValue.includes("complete")) {
    return "border-success-border bg-success-surface text-success";
  }

  if (
    normalizedValue.includes("human") ||
    normalizedValue.includes("resubmission")
  ) {
    return "border-danger-border bg-danger-surface text-danger";
  }

  if (
    normalizedValue.includes("review") ||
    normalizedValue.includes("handling")
  ) {
    return "border-brand-border bg-brand-surface-strong text-brand";
  }

  if (normalizedValue.includes("0/") || normalizedValue.includes("waiting")) {
    return "border-warning-border bg-warning-surface text-warning";
  }

  return "border-border-subtle bg-panel-muted text-text-body";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
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
