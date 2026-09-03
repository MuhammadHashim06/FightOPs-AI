"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useToast } from "@/providers/toast-provider";
import type { PromoterEventFighterDetailData } from "@/server/services/events.service";
import type { ApiResponse } from "@/types/api";

type Requirement = PromoterEventFighterDetailData["requirements"][number];

export function PromoterFighterRequirements({
  requirements,
}: {
  requirements: PromoterEventFighterDetailData["requirements"];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busySubmissionId, setBusySubmissionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function reviewSubmission(
    requirement: Requirement,
    decision: "accept" | "reject",
  ) {
    if (!requirement.submissionId) {
      return;
    }

    const note =
      decision === "reject"
        ? window.prompt("Add a short reason for resubmission.")
        : null;

    if (decision === "reject" && note === null) {
      return;
    }

    setBusySubmissionId(requirement.submissionId);

    try {
      const response = await fetch(
        `/api/v1/document-submissions/${requirement.submissionId}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        title: error instanceof Error ? error.message : "Unable to review document.",
        variant: "error",
      });
    } finally {
      setBusySubmissionId(null);
    }
  }

  return (
    <div className="mt-5 divide-y divide-border-subtle overflow-hidden rounded-[16px] border border-border-subtle">
      {requirements.map((requirement) => {
        const canReview = requirement.submissionStatus === "PENDING_REVIEW";
        const isBusy = isPending || busySubmissionId === requirement.submissionId;

        return (
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
              <p className="mt-2 break-all text-sm text-text-body">
                {requirement.fileName ?? "No upload yet"}
              </p>
              {requirement.submittedAt ? (
                <p className="mt-1 text-xs text-text-muted">{requirement.submittedAt}</p>
              ) : null}
              {requirement.fileUrl ? (
                <a
                  href={requirement.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-sm font-semibold text-brand hover:text-brand-strong"
                >
                  Open file
                </a>
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
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <div className="flex flex-wrap justify-end gap-2">
                <StatusPill
                  label={requirement.statusLabel}
                  tone={getStatusTone(requirement.statusLabel)}
                />
                <StatusPill label={requirement.priority} tone="neutral" />
              </div>
              {canReview ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => reviewSubmission(requirement, "accept")}
                    className="inline-flex h-9 items-center justify-center rounded-[10px] bg-success px-3 text-sm font-semibold text-text-inverse transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => reviewSubmission(requirement, "reject")}
                    className="inline-flex h-9 items-center justify-center rounded-[10px] bg-danger px-3 text-sm font-semibold text-text-inverse transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "brand" | "neutral";
}) {
  const styles =
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
    <span className={`inline-flex h-fit rounded-[10px] border px-3 py-1 text-sm font-semibold ${styles}`}>
      {label}
    </span>
  );
}

function getStatusTone(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("complete") || normalized.includes("verified")) {
    return "success" as const;
  }

  if (normalized.includes("human") || normalized.includes("resubmission")) {
    return "danger" as const;
  }

  if (normalized.includes("review") || normalized.includes("processing")) {
    return "brand" as const;
  }

  if (normalized.includes("pending") || normalized.includes("waiting")) {
    return "warning" as const;
  }

  return "neutral" as const;
}
