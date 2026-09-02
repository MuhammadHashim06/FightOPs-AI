"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useToast } from "@/providers/toast-provider";
import type { FighterFightDetailData } from "@/server/services/fighter-portal.service";

type FighterSingleFightPageProps = {
  fight: FighterFightDetailData;
};

type ContractStage = "awaiting_signature" | "under_review" | "confirmed";

export function FighterSingleFightPage({
  fight,
}: FighterSingleFightPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [contractStage, setContractStage] = useState<ContractStage>(fight.contractStage);
  const [signedContractName, setSignedContractName] = useState<string | null>(null);
  const [uploadingRequirementId, setUploadingRequirementId] = useState<string | null>(
    null,
  );

  const isConfirmed = contractStage === "confirmed";
  const canUpload = contractStage !== "confirmed";
  const stageBadge = getContractStageBadge(contractStage);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!fight.contractRequirementId) {
      showToast({
        title: "Signed contract requirement is not available yet.",
        variant: "error",
      });
      return;
    }

    await uploadRequirementDocument(fight.contractRequirementId, selectedFile, {
      successTitle: "Signed contract uploaded for review.",
      onSuccess: () => {
        setSignedContractName(selectedFile.name);
        setContractStage("under_review");
      },
    });
  }

  return (
    <main className="space-y-6">
      <Link
        href="/dashboard/fighter/events"
        className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>All Fights</span>
      </Link>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-fighter-dark px-6 py-7 text-text-inverse shadow-[var(--shadow-fighter-card)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-fighter-dark-muted">
            {fight.titleLabel}
          </p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-tight">
            {fight.eventName}
          </h1>
          <p className="mt-2 text-[20px] text-fighter-dark-body">
            {fight.date} - {fight.venue}
          </p>
        </div>
        <span
          className={`inline-flex rounded-[10px] border px-4 py-2 text-[16px] font-semibold ${fight.heroStatusClassName}`}
        >
          {isConfirmed ? "Confirmed" : fight.heroStatusLabel}
        </span>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
        <InfoCard
          title="Event Information"
          rows={[
            ["Event Name", fight.eventName],
            ["Date", fight.date],
            ["Time", fight.time],
            ["Location", fight.location],
            ["Venue", fight.venue],
          ]}
        />

        <div className="space-y-5">
          <InfoCard
            title="Fight Information"
            rows={[
              ["Opponent", fight.opponent],
              ["Weight Class", fight.weight],
              ["Fight Type", fight.fightType],
              ["Card Position", fight.position],
            ]}
          />
          <InfoCard
            title="Contact Information"
            rows={[
              ["Promotion Contact", fight.promotionContact],
              ["Operations Email", fight.operationsEmail],
            ]}
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <OverviewCard
          eyebrow="Fight overview"
          title="Readiness and progress"
          items={[
            {
              label: "Readiness",
              value: `${fight.fightOverview.readinessPercentage}%`,
              tone: "brand",
            },
            {
              label: "Current status",
              value: fight.fightOverview.readinessStatusLabel,
              tone: "neutral",
            },
            {
              label: "Submitted docs",
              value: String(fight.fightOverview.submittedDocuments),
              tone: "success",
            },
            {
              label: "Remaining docs",
              value: String(fight.fightOverview.remainingDocuments),
              tone: "warning",
            },
            {
              label: "Reminders sent",
              value: String(fight.fightOverview.remindersSent),
              tone: "neutral",
            },
          ]}
          footer={fight.fightOverview.nextAction}
        />

        <OverviewCard
          eyebrow="Fighter overview"
          title={fight.fighterOverview.fighterName}
          items={[
            {
              label: "Contact name",
              value: fight.fighterOverview.managerName,
              tone: "neutral",
            },
            {
              label: "Contact email",
              value: fight.fighterOverview.contactEmail,
              tone: "neutral",
            },
            {
              label: "Contact phone",
              value: fight.fighterOverview.contactPhone,
              tone: "neutral",
            },
            {
              label: "Nationality",
              value: fight.fighterOverview.nationality,
              tone: "neutral",
            },
            {
              label: "Stance",
              value: fight.fighterOverview.stance,
              tone: "neutral",
            },
            {
              label: "Invite status",
              value: fight.fighterOverview.inviteStatus,
              tone: fight.fighterOverview.inviteStatus === "Accepted" ? "success" : "warning",
            },
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[20px] border border-border-subtle bg-panel p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
                Contract
              </p>
              <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
                Contract workflow
              </h2>
              <p className="mt-1 text-[15px] text-text-body">
                Review the promoter contract, then upload your signed copy here.
              </p>
            </div>
            <span
              className={`inline-flex rounded-[8px] border px-3 py-1 text-sm font-medium ${stageBadge.className}`}
            >
              {stageBadge.label}
            </span>
          </div>

          <div className="mt-6 rounded-[16px] border border-border-subtle bg-panel-muted p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[16px] font-semibold text-text-strong">
                  {fight.contractName}
                </p>
                <p className="mt-1 text-sm text-text-body">{fight.contractVersion}</p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-4 text-sm font-medium text-text-strong transition hover:bg-panel"
              >
                View contract
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[16px] border border-dashed border-border-strong bg-panel px-4 py-5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="sr-only"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[16px] font-semibold text-text-strong">
                  Signed contract upload
                </p>
                <p className="mt-1 text-sm text-text-body">
                  {signedContractName
                    ? `Uploaded file: ${signedContractName}`
                    : "Upload your signed contract so the promoter can review it."}
                </p>
              </div>
              <button
                type="button"
                disabled={!canUpload || uploadingRequirementId === fight.contractRequirementId}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-4 text-sm font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingRequirementId === fight.contractRequirementId
                  ? "Uploading..."
                  : signedContractName
                    ? "Replace file"
                    : "Upload signed contract"}
              </button>
            </div>
          </div>

          {contractStage === "under_review" ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-brand-border bg-brand-surface-strong px-4 py-4">
              <div>
                <p className="text-[16px] font-semibold text-text-strong">
                  Waiting for promoter approval
                </p>
                <p className="mt-1 text-sm text-text-body">
                  Once the promoter confirms your signed contract, the remaining requirements unlock.
                </p>
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-[20px] border border-border-subtle bg-panel p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
                Next Steps
              </p>
              <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
                Requirement checklist
              </h2>
            </div>
            <span
              className={`inline-flex rounded-[8px] border px-3 py-1 text-sm font-medium ${
                isConfirmed
                  ? "border-success-border bg-success-surface text-success-strong"
                  : "border-neutral-border bg-neutral-surface text-neutral-text"
              }`}
            >
              {isConfirmed ? "Unlocked" : "Locked"}
            </span>
          </div>

          <p className="mt-3 text-[15px] text-text-body">
            {isConfirmed
              ? "Your contract is approved. You can now continue with the remaining requirements."
              : "Your remaining requirements will unlock after your signed contract is approved."}
          </p>

          <div className="mt-5 space-y-3">
            {fight.nextSteps.length === 0 ? (
              <div className="rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-4">
                <p className="text-[16px] font-semibold text-text-strong">
                  No additional steps yet
                </p>
                <p className="mt-1 text-sm text-text-body">
                  Your promoter has not added any more requirements for this fight.
                </p>
              </div>
            ) : null}

            {fight.nextSteps.map((step) => {
              const isLocked = !isConfirmed && step.locked;

              return (
                <div
                  key={step.id}
                  className={`rounded-[16px] border px-4 py-4 ${
                    isLocked
                      ? "border-border-subtle bg-panel-muted"
                      : "border-success-border bg-success-surface-pale"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[16px] font-semibold text-text-strong">
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm text-text-body">
                        {step.description}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-[8px] px-2.5 py-1 text-xs font-semibold uppercase ${
                        isLocked
                          ? "bg-panel text-text-muted"
                          : "bg-success-surface text-success-strong"
                      }`}
                    >
                      {isLocked ? "Locked" : "Available"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DocumentListCard
          eyebrow="Submitted documents"
          title={`${fight.submittedDocuments.length} uploaded or reviewed`}
          emptyTitle="No documents submitted yet"
          emptyDescription="Uploaded items will appear here once they are received or reviewed."
          items={fight.submittedDocuments.map((item) => ({
            id: item.id,
            title: item.fileName ? `${item.title} - ${item.fileName}` : item.title,
            meta: item.detail,
            badge: item.statusLabel,
            tone: getDocumentTone(item.statusLabel),
          }))}
        />

        <DocumentListCard
          eyebrow="Remaining documents"
          title={`${fight.remainingDocuments.length} still pending`}
          emptyTitle="No remaining documents"
          emptyDescription="All document requirements have been submitted for this fight."
          items={fight.remainingDocuments.map((item) => ({
            id: item.id,
            title: item.title,
            meta: `${item.dueLabel} - ${item.priorityLabel} priority`,
            badge: item.statusLabel,
            tone: "warning" as const,
            uploadLabel:
              uploadingRequirementId === item.id ? "Uploading..." : "Upload document",
            disabled: Boolean(uploadingRequirementId),
            onUpload: (file) =>
              uploadRequirementDocument(item.id, file, {
                successTitle: `${item.title} uploaded for review.`,
              }),
          }))}
        />
      </section>

      <ReminderHistoryCard reminders={fight.reminderHistory} />
    </main>
  );

  async function uploadRequirementDocument(
    requirementId: string,
    file: File,
    options: {
      successTitle: string;
      onSuccess?: () => void;
    },
  ) {
    setUploadingRequirementId(requirementId);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/v1/fighter/requirements/${requirementId}/submissions`,
        {
          method: "POST",
          body: formData,
        },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to upload document.");
      }

      options.onSuccess?.();
      showToast({
        title: options.successTitle,
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to upload document.",
        variant: "error",
      });
    } finally {
      setUploadingRequirementId(null);
    }
  }
}

function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <article className="overflow-hidden rounded-[20px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
      <div className="border-b border-border-subtle px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
          {title}
        </p>
      </div>
      <div>
        {rows.map(([label, value], index) => (
          <div
            key={`${label}-${value}`}
            className={`grid gap-3 px-5 py-4 sm:grid-cols-[0.92fr_1.08fr] ${
              index < rows.length - 1 ? "border-b border-border-subtle" : ""
            }`}
          >
            <p className="text-[15px] text-text-body">{label}</p>
            <p className="text-[15px] font-medium text-text-strong sm:text-right">
              {value}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function OverviewCard({
  eyebrow,
  title,
  items,
  footer,
}: {
  eyebrow: string;
  title: string;
  items: Array<{
    label: string;
    value: string;
    tone: "brand" | "neutral" | "success" | "warning";
  }>;
  footer?: string;
}) {
  return (
    <article className="rounded-[20px] border border-border-subtle bg-panel p-6 shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[24px] font-semibold text-text-strong">{title}</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-[16px] border px-4 py-4 ${getOverviewToneClassName(item.tone)}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              {item.label}
            </p>
            <p className="mt-2 text-[18px] font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      {footer ? (
        <div className="mt-5 rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Next action
          </p>
          <p className="mt-2 text-[15px] text-text-body">{footer}</p>
        </div>
      ) : null}
    </article>
  );
}

function DocumentListCard({
  eyebrow,
  title,
  emptyTitle,
  emptyDescription,
  items,
}: {
  eyebrow: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  items: Array<{
    id: string;
    title: string;
    meta: string;
    badge: string;
    tone: "success" | "warning" | "neutral" | "brand";
    uploadLabel?: string;
    disabled?: boolean;
    onUpload?: (file: File) => void;
  }>;
}) {
  return (
    <article className="rounded-[20px] border border-border-subtle bg-panel p-6 shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[24px] font-semibold text-text-strong">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-5">
            <p className="text-[16px] font-semibold text-text-strong">{emptyTitle}</p>
            <p className="mt-1 text-sm text-text-body">{emptyDescription}</p>
          </div>
        ) : null}

        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-4"
          >
            <div>
              <p className="text-[16px] font-semibold text-text-strong">{item.title}</p>
              <p className="mt-1 text-sm text-text-body">{item.meta}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label={item.badge} tone={item.tone} />
              {item.onUpload ? (
                <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-[10px] bg-brand px-3 text-sm font-medium text-text-inverse transition hover:bg-brand-strong has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                  <input
                    type="file"
                    className="sr-only"
                    disabled={item.disabled}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";

                      if (file) {
                        item.onUpload?.(file);
                      }
                    }}
                  />
                  {item.uploadLabel ?? "Upload"}
                </label>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ReminderHistoryCard({
  reminders,
}: {
  reminders: FighterFightDetailData["reminderHistory"];
}) {
  return (
    <article className="rounded-[20px] border border-border-subtle bg-panel p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
            Reminder history
          </p>
          <h2 className="mt-2 text-[24px] font-semibold text-text-strong">
            Sent and scheduled follow-ups
          </h2>
        </div>
        <span className="rounded-[10px] border border-border-subtle bg-panel-muted px-3 py-1 text-sm text-text-body">
          {reminders.length} total
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {reminders.length === 0 ? (
          <div className="rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-5">
            <p className="text-[16px] font-semibold text-text-strong">
              No reminder history yet
            </p>
            <p className="mt-1 text-sm text-text-body">
              Reminder emails scheduled for this fighter will appear here.
            </p>
          </div>
        ) : null}

        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="grid gap-3 rounded-[16px] border border-border-subtle bg-panel-muted px-4 py-4 md:grid-cols-[1.3fr_0.8fr_0.9fr_auto]"
          >
            <div>
              <p className="text-[16px] font-semibold text-text-strong">
                {reminder.requirementName}
              </p>
              <p className="mt-1 text-sm text-text-body">
                Scheduled: {reminder.scheduledForLabel}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Sent at
              </p>
              <p className="mt-1 text-sm text-text-body">{reminder.sentAtLabel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Delivery
              </p>
              <p className="mt-1 text-sm text-text-body">Email reminder</p>
            </div>
            <StatusPill
              label={reminder.statusLabel}
              tone={getReminderTone(reminder.statusLabel)}
            />
          </div>
        ))}
      </div>
    </article>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "neutral" | "danger" | "brand";
}) {
  return (
    <span
      className={`inline-flex h-fit rounded-[999px] border px-3 py-1 text-sm font-medium ${getPillToneClassName(tone)}`}
    >
      {label}
    </span>
  );
}

function getContractStageBadge(stage: ContractStage) {
  if (stage === "confirmed") {
    return {
      label: "Confirmed",
      className: "border-success-border bg-success-surface text-success-strong",
    };
  }

  if (stage === "under_review") {
    return {
      label: "Under review",
      className: "border-brand-border bg-brand-surface-strong text-brand",
    };
  }

  return {
    label: "Signature required",
    className: "border-warning-border bg-warning-surface text-warning",
  };
}

function getOverviewToneClassName(tone: "brand" | "neutral" | "success" | "warning") {
  if (tone === "brand") {
    return "border-brand-border bg-brand-surface-strong text-brand";
  }

  if (tone === "success") {
    return "border-success-border bg-success-surface text-success-strong";
  }

  if (tone === "warning") {
    return "border-warning-border bg-warning-surface text-warning";
  }

  return "border-border-subtle bg-panel-muted text-text-strong";
}

function getPillToneClassName(
  tone: "success" | "warning" | "neutral" | "danger" | "brand",
) {
  if (tone === "success") {
    return "border-success-border bg-success-surface text-success-strong";
  }

  if (tone === "warning") {
    return "border-warning-border bg-warning-surface text-warning";
  }

  if (tone === "danger") {
    return "border-danger-border bg-danger-surface text-danger-strong";
  }

  if (tone === "brand") {
    return "border-brand-border bg-brand-surface-strong text-brand";
  }

  return "border-border-subtle bg-panel text-text-body";
}

function getReminderTone(statusLabel: string) {
  if (statusLabel === "Sent") {
    return "success" as const;
  }

  if (statusLabel === "Failed") {
    return "danger" as const;
  }

  return "warning" as const;
}

function getDocumentTone(statusLabel: string) {
  if (statusLabel === "Verified") {
    return "success" as const;
  }

  if (statusLabel === "Needs resubmission") {
    return "warning" as const;
  }

  if (statusLabel === "Needs review") {
    return "brand" as const;
  }

  return "neutral" as const;
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
