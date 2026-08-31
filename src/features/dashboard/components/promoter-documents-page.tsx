"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";
import type { DocumentReviewQueueItem } from "@/server/services/document-submissions.service";
import type { ApiResponse } from "@/types/api";

type PromoterDocumentsPageProps = {
  reviewQueue: DocumentReviewQueueItem[];
  scopeLabel?: string;
};

export function PromoterDocumentsPage({
  reviewQueue,
  scopeLabel = "Events",
}: PromoterDocumentsPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [categorySearch, setCategorySearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Files");
  const [activeEvent, setActiveEvent] = useState("all-events");
  const [busySubmissionId, setBusySubmissionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizedCategorySearch = categorySearch.trim().toLowerCase();
  const normalizedDocumentSearch = documentSearch.trim().toLowerCase();
  const isBusy = isPending || Boolean(busySubmissionId);

  const eventFilters = useMemo(() => {
    const events = new Map<string, string>();

    for (const item of reviewQueue) {
      events.set(item.eventId, item.eventName);
    }

    return [
      { label: `All ${scopeLabel}`, value: "all-events" },
      ...Array.from(events.entries()).map(([value, label]) => ({ label, value })),
    ];
  }, [reviewQueue, scopeLabel]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of reviewQueue) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }

    return [
      { label: "All Files", count: reviewQueue.length },
      ...Array.from(counts.entries()).map(([label, count]) => ({ label, count })),
    ];
  }, [reviewQueue]);

  const visibleCategories = categories.filter((item) =>
    item.label.toLowerCase().includes(normalizedCategorySearch),
  );

  const filteredDocuments = reviewQueue.filter((file) => {
    const matchesCategory =
      activeCategory === "All Files" || file.category === activeCategory;
    const matchesEvent =
      activeEvent === "all-events" || file.eventId === activeEvent;
    const matchesSearch =
      !normalizedDocumentSearch ||
      file.fileName.toLowerCase().includes(normalizedDocumentSearch) ||
      file.fighterName.toLowerCase().includes(normalizedDocumentSearch) ||
      file.requirementName.toLowerCase().includes(normalizedDocumentSearch) ||
      file.eventName.toLowerCase().includes(normalizedDocumentSearch) ||
      file.category.toLowerCase().includes(normalizedDocumentSearch);

    return matchesCategory && matchesEvent && matchesSearch;
  });

  async function handleDecision(
    submissionId: string,
    decision: "accept" | "reject",
  ) {
    const note =
      decision === "reject"
        ? window.prompt("Add a short reason for resubmission.")
        : null;

    if (decision === "reject" && note === null) {
      return;
    }

    setBusySubmissionId(submissionId);

    try {
      const response = await fetch(
        `/api/v1/document-submissions/${submissionId}/decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ decision, note }),
        },
      );
      const payload = (await response.json()) as ApiResponse<unknown>;

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.success ? "Unable to review document." : payload.error.message,
        );
      }

      showToast({
        title:
          decision === "accept"
            ? "Document accepted."
            : "Document rejected and marked for resubmission.",
        variant: "success",
      });
      startTransition(() => router.refresh());
    } catch (error) {
      showToast({
        title:
          error instanceof Error ? error.message : "Unable to review document.",
        variant: "error",
      });
    } finally {
      setBusySubmissionId(null);
    }
  }

  return (
    <main className="space-y-5">
      <div className="flex flex-col gap-4 py-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Document Review
          </h1>
          <p className="text-lg text-text-body">
            Review fighter uploads, approve completed documents, and request fixes.
          </p>
        </div>

        <div className="rounded-[16px] border border-border-subtle bg-panel px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Pending review
          </p>
          <p className="mt-1 text-[28px] font-semibold text-text-strong">
            {
              reviewQueue.filter((item) => item.status === "PENDING_REVIEW")
                .length
            }
          </p>
        </div>
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

          <div className="mt-5 rounded-[14px] bg-panel-muted p-4">
            <div className="flex items-center gap-2 text-[15px] font-medium text-text-body">
              <StorageIcon className="h-4 w-4 text-text-muted" />
              <span>Storage Provider</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Uploads are saved through the configured local/R2 storage layer.
            </p>
          </div>
        </aside>

        <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
          <div className="border-b border-border-subtle px-4 pt-4">
            <div className="flex flex-wrap gap-6 px-2">
              {eventFilters.map((filter) => {
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
              <div className="flex h-10 max-w-[440px] items-center gap-3 rounded-[10px] border border-border-subtle bg-white px-3 text-text-muted">
                <SearchIcon className="h-4 w-4" />
                <input
                  type="text"
                  value={documentSearch}
                  onChange={(event) => setDocumentSearch(event.target.value)}
                  placeholder="Search documents, fighter, event..."
                  className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-border-subtle">
            {filteredDocuments.map((file) => (
              <article
                key={file.id}
                className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] xl:items-center"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="relative mt-1 flex h-7 w-7 shrink-0 items-center justify-center text-text-muted">
                    <DocumentIcon className="h-5 w-5" />
                    <span
                      className={`absolute right-0 top-0 h-2.5 w-2.5 rounded-full ${statusDotClassName(file.status)}`}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[18px] font-medium text-text-strong">
                      {file.fileName}
                    </p>
                    <p className="mt-1 text-[15px] text-text-muted">
                      {file.fileSizeLabel} - Uploaded {file.uploadedAtLabel}
                    </p>
                  </div>
                </div>

                <div className="grid gap-1 text-[15px] text-text-body">
                  <p>
                    <span className="text-text-muted">Event:</span> {file.eventName}
                  </p>
                  <p>
                    <span className="text-text-muted">Fighter:</span>{" "}
                    {file.fighterName}
                  </p>
                  <p>
                    <span className="text-text-muted">Requirement:</span>{" "}
                    {file.requirementName}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                  <StatusPill status={file.status} label={file.statusLabel} />
                  <PriorityPill tone={file.priority} />

                  {file.publicUrl ? (
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border-subtle bg-white px-3 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border-subtle bg-panel-muted px-3 text-sm font-medium text-text-muted">
                      Stored
                    </span>
                  )}

                  {file.status === "PENDING_REVIEW" ? (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDecision(file.id, "accept")}
                        className="inline-flex h-9 items-center justify-center rounded-[10px] bg-success px-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDecision(file.id, "reject")}
                        className="inline-flex h-9 items-center justify-center rounded-[10px] bg-danger px-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}

            {filteredDocuments.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="text-[18px] font-medium text-text-strong">
                  No documents found
                </p>
                <p className="mt-2 text-[15px] text-text-body">
                  Uploads from fighters will appear here for approval.
                </p>
              </div>
            ) : null}
          </div>

          <div className="border-t border-border-subtle px-4 py-4">
            <p className="text-[15px] text-text-muted">
              Showing {filteredDocuments.length} of {reviewQueue.length} document
              {reviewQueue.length === 1 ? "" : "s"}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: DocumentReviewQueueItem["status"];
  label: string;
}) {
  const styles =
    status === "ACCEPTED"
      ? "border-[#b7ead1] bg-[#ecfbf2] text-success"
      : status === "REJECTED"
        ? "border-[#ffc2c2] bg-[#fff0f0] text-danger"
        : "border-[#ffd38f] bg-[#fff6e5] text-[#dc7d09]";

  return (
    <span className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium ${styles}`}>
      {label}
    </span>
  );
}

function PriorityPill({
  tone,
}: {
  tone: DocumentReviewQueueItem["priority"];
}) {
  const styles =
    tone === "critical"
      ? "border-[#ffc2c2] bg-[#fff0f0] text-danger"
      : tone === "high"
        ? "border-[#ffd38f] bg-[#fff6e5] text-[#dc7d09]"
        : tone === "medium"
          ? "border-[#c9d9ff] bg-[#edf3ff] text-brand"
          : "border-border-subtle bg-panel-muted text-text-body";

  return (
    <span className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium capitalize ${styles}`}>
      {tone}
    </span>
  );
}

function statusDotClassName(status: DocumentReviewQueueItem["status"]) {
  if (status === "ACCEPTED") {
    return "bg-success";
  }

  if (status === "REJECTED") {
    return "bg-danger";
  }

  return "bg-warning";
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
