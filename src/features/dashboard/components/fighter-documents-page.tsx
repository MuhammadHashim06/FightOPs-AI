"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";
import type { ApiResponse } from "@/types/api";
import type { FighterDocumentsPageData } from "@/server/services/fighter-portal.service";

export function FighterDocumentsPage({
  data,
}: {
  data: FighterDocumentsPageData;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const normalizedSearch = searchValue.trim().toLowerCase();
  const requirements = data.requirements.filter((item) =>
    !normalizedSearch ||
    item.title.toLowerCase().includes(normalizedSearch) ||
    item.eventName.toLowerCase().includes(normalizedSearch) ||
    item.category.toLowerCase().includes(normalizedSearch),
  );

  async function handleUpload(requirementId: string, file: File) {
    setUploadingId(requirementId);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `/api/v1/fighter/requirements/${requirementId}/submissions`,
        { method: "POST", body: formData },
      );
      const result = (await response.json()) as ApiResponse<unknown>;

      if (!response.ok || !result.success) {
        throw new Error(result.success ? "Unable to upload document." : result.error.message);
      }

      showToast({ title: `${file.name} uploaded for review.`, variant: "success" });
      startTransition(() => router.refresh());
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to upload document.",
        variant: "error",
      });
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <main className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          Document centre
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Documents
        </h1>
        <p className="text-lg text-text-body">
          Upload and track the documents required for your assigned fights.
        </p>
        <p className="text-sm text-text-muted">Fighter: {data.fighterName}</p>
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel p-3 shadow-[var(--shadow-card)]">
        <div className="flex h-12 items-center gap-3 rounded-[12px] border border-border-subtle bg-panel px-4 text-text-muted">
          <SearchIcon className="h-5 w-5" />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search documents or events..."
            className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] gap-4 border-b border-border-subtle px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:grid">
          <span>Document</span>
          <span>Event</span>
          <span>Deadline</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {requirements.map((requirement) => (
            <article
              key={requirement.id}
              className="grid gap-4 px-5 py-5 lg:grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] lg:items-center lg:px-6"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-surface-strong text-brand">
                  <DocumentIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-medium text-text-strong">
                    {requirement.title}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{requirement.category}</p>
                  {requirement.fileName ? (
                    <p className="mt-1 truncate text-sm text-text-body">{requirement.fileName}</p>
                  ) : null}
                  {requirement.reviewNote ? (
                    <p className="mt-1 text-sm text-danger">{requirement.reviewNote}</p>
                  ) : null}
                </div>
              </div>
              <div className="text-[15px] text-text-body">{requirement.eventName}</div>
              <div className="text-[15px] text-text-body">{requirement.dueLabel}</div>
              <StatusBadge status={requirement.status} label={requirement.statusLabel} />
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {requirement.submissionId ? (
                  <a
                    href={`/api/v1/document-submissions/${requirement.submissionId}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-3 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
                  >
                    Open
                  </a>
                ) : null}
                <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[10px] bg-brand px-3 text-sm font-semibold text-text-inverse transition hover:bg-brand-strong">
                  {uploadingId === requirement.id ? "Uploading..." : requirement.fileName ? "Replace" : "Upload"}
                  <input
                    type="file"
                    className="sr-only"
                    accept={requirement.acceptedFileTypes.map((type) => `.${type}`).join(",")}
                    disabled={Boolean(uploadingId)}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (file) {
                        void handleUpload(requirement.id, file);
                      }
                    }}
                  />
                </label>
              </div>
            </article>
          ))}

          {requirements.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-[18px] font-medium text-text-strong">No documents found</p>
              <p className="mt-2 text-[15px] text-text-body">
                Assigned document requirements will appear here.
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
  status: FighterDocumentsPageData["requirements"][number]["status"];
  label: string;
}) {
  const styles =
    status === "ACCEPTED" || status === "NOT_APPLICABLE"
      ? "border-success-border bg-success-surface text-success"
      : status === "NEEDS_RESUBMISSION" || status === "HUMAN_ACTION"
        ? "border-danger-border bg-danger-surface text-danger"
        : status === "PROCESSING" || status === "RECEIVED"
          ? "border-brand-border bg-brand-surface-strong text-brand"
          : "border-warning-border bg-warning-surface text-warning";

  return <span className={`inline-flex rounded-[10px] border px-3 py-1 text-sm font-medium ${styles}`}>{label}</span>;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h6l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v6h6" />
      <path d="M10 13h6" />
      <path d="M10 17h6" />
    </svg>
  );
}
