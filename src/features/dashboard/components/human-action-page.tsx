"use client";

import Link from "next/link";
import { useState } from "react";

import { HumanActionPriorityBadge } from "@/features/dashboard/components/human-action-priority-badge";
import {
  humanActionCases,
} from "@/features/dashboard/data/promoter-events";

const filters = ["All", "Critical", "High", "Medium", "Low", "Resolved"];

export function HumanActionPage() {
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const cases = humanActionCases ?? [];

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredCases = cases.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      item.fighterName.toLowerCase().includes(normalizedSearch) ||
      item.reason.toLowerCase().includes(normalizedSearch) ||
      item.requirement.toLowerCase().includes(normalizedSearch) ||
      item.eventName.toLowerCase().includes(normalizedSearch);

    const matchesFilter =
      activeFilter === "All"
        ? true
        : activeFilter === "Resolved"
          ? item.status === "resolved"
          : item.priority === activeFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <main className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Human Action
        </h1>
        <p className="text-lg text-text-body">
          Cases where AI cannot safely continue without your judgement.
        </p>
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel p-3 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-[12px] border border-border-subtle bg-white px-4 text-text-muted">
            <SearchIcon className="h-5 w-5" />
            <input
              type="text"
              placeholder="Search fighter or reason..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
            />
          </div>

          <div className="flex flex-wrap gap-2 rounded-[12px] border border-border-subtle bg-white p-1">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-[10px] px-4 py-2 text-[15px] font-medium transition ${
                  activeFilter === filter
                    ? "bg-brand text-white"
                    : "text-text-body hover:bg-panel-muted hover:text-text-strong"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
        <div className="hidden grid-cols-[1.2fr_1.5fr_1.3fr_1.5fr_1.4fr_1.2fr] gap-4 border-b border-border-subtle px-10 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:grid">
          <span>Priority</span>
          <span>Event</span>
          <span>Fighter</span>
          <span>Reason</span>
          <span>Requirement</span>
          <span>Confidence</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {filteredCases.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/promoter/human-action/${item.id}`}
              className="grid gap-4 px-5 py-5 transition hover:bg-panel-muted lg:grid-cols-[1.2fr_1.5fr_1.3fr_1.5fr_1.4fr_1.2fr] lg:px-10"
            >
              <div>
                <HumanActionPriorityBadge priority={item.priority} />
              </div>
              <div className="text-[15px] text-text-body">{item.eventName}</div>
              <div className="text-[15px] font-medium text-text-strong">
                {item.fighterName}
              </div>
              <div className="text-[15px] text-text-body">{item.reason}</div>
              <div className="text-[15px] text-text-body">{item.requirement}</div>
              <div className="text-[15px] font-medium text-[#7c3aed]">
                {item.confidence}
              </div>
            </Link>
          ))}

          {filteredCases.length === 0 ? (
            <div className="px-5 py-12 text-center lg:px-10">
              <p className="text-[18px] font-medium text-text-strong">
                No human action cases found
              </p>
              <p className="mt-2 text-[15px] text-text-body">
                Try another search or change the priority filter.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
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
