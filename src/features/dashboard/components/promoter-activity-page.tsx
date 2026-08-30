"use client";

import { useState } from "react";

import {
  activityLogEntries,
  type ActivityActorType,
} from "@/features/dashboard/data/promoter-events";

const actorFilters = [
  { label: "All actors", value: "all" },
  { label: "AI", value: "ai" },
  { label: "Managers", value: "manager" },
  { label: "Fighters", value: "fighter" },
] as const;

export function PromoterActivityPage() {
  const [searchValue, setSearchValue] = useState("");
  const [actorFilter, setActorFilter] =
    useState<(typeof actorFilters)[number]["value"]>("all");

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredEntries = activityLogEntries.filter((entry) => {
    const matchesSearch =
      !normalizedSearch ||
      entry.actorLabel.toLowerCase().includes(normalizedSearch) ||
      entry.fighterName.toLowerCase().includes(normalizedSearch) ||
      entry.actionTitle.toLowerCase().includes(normalizedSearch) ||
      entry.actionDescription.toLowerCase().includes(normalizedSearch);

    const matchesActor =
      actorFilter === "all" ? true : entry.actorType === actorFilter;

    return matchesSearch && matchesActor;
  });

  return (
    <main className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Activity / Audit
        </h1>
        <p className="text-lg text-text-body">
          Operational trail - every state change and who made it.
        </p>
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel p-3 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-[12px] border border-border-subtle bg-white px-4 text-text-muted">
            <SearchIcon className="h-5 w-5" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search actor, fighter or action..."
              className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
            />
          </div>

          <div className="relative w-full xl:w-[182px]">
            <select
              value={actorFilter}
              onChange={(event) =>
                setActorFilter(
                  event.target.value as (typeof actorFilters)[number]["value"],
                )
              }
              className="h-12 w-full appearance-none rounded-[12px] border border-border-subtle bg-white px-4 pr-11 text-[15px] text-text-strong outline-none transition focus:border-brand"
            >
              {actorFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
        <div className="hidden grid-cols-[1.5fr_1fr_1.1fr_1.7fr_1.5fr_1fr] gap-4 border-b border-border-subtle px-10 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:grid">
          <span>Timestamp</span>
          <span>Actor</span>
          <span>Fighter</span>
          <span>Action</span>
          <span>State Change</span>
          <span>Confidence</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="grid gap-4 px-5 py-5 lg:grid-cols-[1.5fr_1fr_1.1fr_1.7fr_1.5fr_1fr] lg:px-10"
            >
              <div className="text-[15px] text-text-muted">{entry.timestamp}</div>

              <div>
                <ActorBadge actorLabel={entry.actorLabel} actorType={entry.actorType} />
              </div>

              <div className="text-[15px] text-text-body">{entry.fighterName}</div>

              <div>
                <p className="text-[16px] font-medium text-text-strong">
                  {entry.actionTitle}
                </p>
                <p className="mt-1 text-[15px] leading-6 text-text-muted">
                  {entry.actionDescription}
                </p>
              </div>

              <div className="text-[15px] text-text-body">{entry.stateChange}</div>

              <div
                className={`text-[15px] font-medium ${
                  entry.confidence === "-"
                    ? "text-text-muted"
                    : entry.confidence.startsWith("49%") ||
                        entry.confidence.startsWith("58%") ||
                        entry.confidence.startsWith("64%")
                      ? "text-[#7c3aed]"
                      : "text-success"
                }`}
              >
                {entry.confidence}
              </div>
            </article>
          ))}

          {filteredEntries.length === 0 ? (
            <div className="px-5 py-12 text-center lg:px-10">
              <p className="text-[18px] font-medium text-text-strong">
                No activity found
              </p>
              <p className="mt-2 text-[15px] text-text-body">
                Try another search or actor filter.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 border-t border-border-subtle px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p className="text-[15px] text-text-muted">Showing 1-10 of 42 rows</p>

          <div className="flex items-center gap-2 self-end">
            <PaginationButton label="Prev" muted />
            <PaginationButton label="1" active />
            <PaginationButton label="2" />
            <PaginationButton label="3" />
            <span className="px-1 text-text-muted">...</span>
            <PaginationButton label="Next" />
          </div>
        </div>
      </section>
    </main>
  );
}

function ActorBadge({
  actorLabel,
  actorType,
}: {
  actorLabel: string;
  actorType: ActivityActorType;
}) {
  const styles =
    actorType === "ai"
      ? "bg-[#edf3ff] text-brand"
      : "bg-[#e8fbf7] text-[#14b8a6]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-sm font-medium ${styles}`}
    >
      {actorType === "ai" ? <SparkIcon className="h-3.5 w-3.5" /> : null}
      <span>{actorLabel}</span>
    </span>
  );
}

function PaginationButton({
  label,
  active,
  muted,
}: {
  label: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-[8px] border px-3 text-sm font-medium transition ${
        active
          ? "border-brand bg-brand text-white"
          : muted
            ? "border-border-subtle bg-white text-text-muted"
            : "border-border-subtle bg-white text-text-strong hover:bg-panel-muted"
      }`}
    >
      {muted ? `‹ ${label}` : label}
    </button>
  );
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

function SparkIcon({ className }: { className?: string }) {
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
      <path d="m12 3 1.9 4.8L19 9.5l-4.3 2.4L13 17l-1.9-5.1L7 9.5l5.1-1.7L12 3Z" />
      <path d="M5 14.5 6 17l2.5 1-2.5 1L5 21l-1-2.5-2.5-1L4 17l1-2.5Z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
