"use client";

import { useMemo, useState } from "react";

import type { FighterNotificationsPageData } from "@/server/services/fighter-portal.service";

export function FighterNotificationsPage({
  data,
}: {
  data: FighterNotificationsPageData;
}) {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const normalizedSearch = searchValue.trim().toLowerCase();
  const notifications = useMemo(
    () =>
      data.notifications.filter((item) => {
        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
        const matchesSearch =
          !normalizedSearch ||
          item.eventName.toLowerCase().includes(normalizedSearch) ||
          item.requirementName.toLowerCase().includes(normalizedSearch) ||
          item.message.toLowerCase().includes(normalizedSearch);

        return matchesStatus && matchesSearch;
      }),
    [data.notifications, normalizedSearch, statusFilter],
  );

  return (
    <main className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          Fighter updates
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Notifications
        </h1>
        <p className="text-lg text-text-body">
          Reminder and document updates for {data.fighterName}.
        </p>
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search event, requirement or message..."
            className="h-12 flex-1 rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none placeholder:text-text-muted focus:border-brand"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-12 rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none focus:border-brand"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="SKIPPED">Skipped</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[1.3fr_1.3fr_1fr_1fr_2fr] gap-4 border-b border-border-subtle px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:grid">
          <span>Event</span>
          <span>Requirement</span>
          <span>Scheduled</span>
          <span>Status</span>
          <span>Message</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {notifications.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 px-5 py-5 lg:grid-cols-[1.3fr_1.3fr_1fr_1fr_2fr] lg:items-center lg:px-6"
            >
              <div className="text-[15px] font-medium text-text-strong">{item.eventName}</div>
              <div>
                <p className="text-[15px] font-medium text-text-strong">{item.requirementName}</p>
                <p className="mt-1 text-sm text-text-muted">Due {item.dueDateLabel}</p>
              </div>
              <div className="text-[15px] text-text-body">{item.scheduledForLabel}</div>
              <StatusBadge status={item.status} label={item.statusLabel} />
              <p className="text-[15px] leading-6 text-text-body">{item.message}</p>
            </article>
          ))}
          {notifications.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-[18px] font-medium text-text-strong">No notifications found</p>
              <p className="mt-2 text-[15px] text-text-body">
                Reminder updates will appear here when requirements are assigned.
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
  status: FighterNotificationsPageData["notifications"][number]["status"];
  label: string;
}) {
  const styles =
    status === "SENT"
      ? "border-success-border bg-success-surface text-success"
      : status === "FAILED"
        ? "border-danger-border bg-danger-surface text-danger"
        : status === "SKIPPED"
          ? "border-border-subtle bg-panel-muted text-text-body"
          : "border-warning-border bg-warning-surface text-warning";

  return <span className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium ${styles}`}>{label}</span>;
}
