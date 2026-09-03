"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { FighterHumanActionPageData } from "@/server/services/fighter-portal.service";

export function FighterHumanActionPage({
  data,
}: {
  data: FighterHumanActionPageData;
}) {
  const [searchValue, setSearchValue] = useState("");
  const normalizedSearch = searchValue.trim().toLowerCase();
  const cases = useMemo(
    () =>
      data.cases.filter(
        (item) =>
          !normalizedSearch ||
          item.eventName.toLowerCase().includes(normalizedSearch) ||
          item.requirementName.toLowerCase().includes(normalizedSearch) ||
          item.reason.toLowerCase().includes(normalizedSearch),
      ),
    [data.cases, normalizedSearch],
  );

  return (
    <main className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          Fighter support
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Human Action
        </h1>
        <p className="text-lg text-text-body">
          Items that need your attention before operations can complete review.
        </p>
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel p-3 shadow-[var(--shadow-card)]">
        <input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search event, requirement or reason..."
          className="h-12 w-full rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none placeholder:text-text-muted focus:border-brand"
        />
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[1.3fr_1.5fr_1fr_2fr_auto] gap-4 border-b border-border-subtle px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:grid">
          <span>Event</span>
          <span>Requirement</span>
          <span>Status</span>
          <span>Reason</span>
          <span>Action</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {cases.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 px-5 py-5 lg:grid-cols-[1.3fr_1.5fr_1fr_2fr_auto] lg:items-center lg:px-6"
            >
              <div className="text-[15px] font-medium text-text-strong">{item.eventName}</div>
              <div>
                <p className="text-[15px] font-medium text-text-strong">{item.requirementName}</p>
                <p className="mt-1 text-sm text-text-muted">{item.dueLabel}</p>
              </div>
              <StatusBadge status={item.status} label={item.statusLabel} />
              <p className="text-[15px] leading-6 text-text-body">{item.reason}</p>
              <Link
                href={`/dashboard/fighter/events/${item.fightId}`}
                className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-3 text-sm font-semibold text-text-inverse transition hover:bg-brand-strong"
              >
                View fight
              </Link>
            </article>
          ))}
          {cases.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-[18px] font-medium text-text-strong">No actions required</p>
              <p className="mt-2 text-[15px] text-text-body">
                Your submitted requirements are either waiting for review or complete.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: FighterHumanActionPageData["cases"][number]["status"];
  label: string;
}) {
  const className =
    status === "HUMAN_ACTION"
      ? "border-danger-border bg-danger-surface text-danger"
      : "border-warning-border bg-warning-surface text-warning";

  return <span className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium ${className}`}>{label}</span>;
}
