"use client";

import { useState } from "react";

import {
  documentCategories,
  documentEventFilters,
  documentStorageFiles,
} from "@/features/dashboard/data/promoter-events";

export function PromoterDocumentsPage() {
  const [categorySearch, setCategorySearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Files");
  const [activeEvent, setActiveEvent] = useState("all-events");

  const normalizedCategorySearch = categorySearch.trim().toLowerCase();
  const normalizedDocumentSearch = documentSearch.trim().toLowerCase();

  const visibleCategories = documentCategories.filter((item) =>
    item.label.toLowerCase().includes(normalizedCategorySearch),
  );

  const filteredFiles = documentStorageFiles.filter((file) => {
    const matchesCategory =
      activeCategory === "All Files" || file.category === activeCategory;
    const matchesEvent =
      activeEvent === "all-events" || file.event === activeEvent;
    const matchesSearch =
      !normalizedDocumentSearch ||
      file.name.toLowerCase().includes(normalizedDocumentSearch) ||
      file.owner.toLowerCase().includes(normalizedDocumentSearch) ||
      file.category.toLowerCase().includes(normalizedDocumentSearch);

    return matchesCategory && matchesEvent && matchesSearch;
  });

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-4 py-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Document Storage
          </h1>
          <p className="text-lg text-text-body">
            Search, organize, and review uploaded files across your events.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-brand px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,107,255,0.24)] transition hover:bg-brand-strong"
        >
          <UploadIcon className="h-4 w-4" />
          <span>Upload Files</span>
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="rounded-[18px] border border-border-subtle bg-panel p-4 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Categories
          </p>

          <div className="mt-4 flex h-10 items-center gap-3 rounded-[10px] border border-border-subtle bg-white px-3 text-text-muted">
            <SearchIcon className="h-4 w-4" />
            <input
              type="text"
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Search categories..."
              className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
            />
          </div>

          <div className="mt-4 space-y-1.5">
            {visibleCategories.map((item) => {
              const isActive = activeCategory === item.label;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveCategory(item.label)}
                  className={`flex w-full items-center justify-between rounded-[12px] px-3 py-3 text-left text-[15px] transition ${
                    isActive
                      ? "bg-sidebar-accent text-brand"
                      : "text-text-body hover:bg-panel-muted hover:text-text-strong"
                  }`}
                >
                  <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                  <span className={isActive ? "font-medium text-brand" : "text-text-muted"}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border-subtle bg-white text-[15px] font-medium text-brand transition hover:bg-panel-muted"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Category</span>
          </button>

          <div className="mt-5 border-t border-border-subtle pt-5">
            <div className="flex items-center gap-2 text-[15px] font-medium text-text-body">
              <StorageIcon className="h-4 w-4 text-text-muted" />
              <span>Storage Usage</span>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <p className="text-[28px] font-semibold text-text-strong">24.5 GB</p>
              <p className="text-sm text-text-muted">of 100 GB</p>
            </div>

            <div className="mt-3 h-2 rounded-full bg-panel-muted">
              <div className="h-2 w-[24.5%] rounded-full bg-brand" />
            </div>

            <button
              type="button"
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-border-subtle bg-white text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Upgrade Storage
            </button>
          </div>
        </aside>

        <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
          <div className="border-b border-border-subtle px-4 pt-4">
            <div className="flex flex-wrap gap-6 px-2">
              {documentEventFilters.map((filter) => {
                const isActive = activeEvent === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveEvent(filter.value)}
                    className={`border-b-2 px-2 pb-3 text-[15px] font-medium transition ${
                      isActive
                        ? "border-brand text-brand"
                        : "border-transparent text-text-body hover:text-text-strong"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="py-4">
              <div className="flex h-10 max-w-[386px] items-center gap-3 rounded-[10px] border border-border-subtle bg-white px-3 text-text-muted">
                <SearchIcon className="h-4 w-4" />
                <input
                  type="text"
                  value={documentSearch}
                  onChange={(event) => setDocumentSearch(event.target.value)}
                  placeholder="Search documents..."
                  className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-border-subtle">
            {filteredFiles.map((file) => (
              <article
                key={file.id}
                className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="relative mt-1 flex h-7 w-7 shrink-0 items-center justify-center text-text-muted">
                    <DocumentIcon className="h-5 w-5" />
                    <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-success" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[18px] font-medium text-text-strong">
                      {file.name}
                    </p>
                    <p className="mt-1 text-[15px] text-text-muted">
                      {file.size} - Uploaded {file.uploadedAt} - {file.owner}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <span className="inline-flex rounded-[10px] bg-panel-muted px-3 py-1 text-sm font-medium text-text-body">
                    {file.category}
                  </span>

                  <button
                    type="button"
                    className="text-text-body transition hover:text-brand"
                    aria-label={`Download ${file.name}`}
                  >
                    <DownloadIcon className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    className="text-danger transition hover:opacity-80"
                    aria-label={`Delete ${file.name}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </article>
            ))}

            {filteredFiles.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-[18px] font-medium text-text-strong">
                  No documents found
                </p>
                <p className="mt-2 text-[15px] text-text-body">
                  Try another event, category, or search term.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 border-t border-border-subtle px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[15px] text-text-muted">
              Showing 1-10 of 42 documents
            </p>

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
      </div>
    </main>
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
      {label}
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

function UploadIcon({ className }: { className?: string }) {
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
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M5 19h14" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function StorageIcon({ className }: { className?: string }) {
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
      <path d="M4 7.5C4 6.1 7.6 5 12 5s8 1.1 8 2.5S16.4 10 12 10 4 8.9 4 7.5Z" />
      <path d="M4 7.5v9C4 17.9 7.6 19 12 19s8-1.1 8-2.5v-9" />
      <path d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
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
      <path d="M8 3h6l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v6h6" />
      <path d="M10 13h6" />
      <path d="M10 17h6" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
