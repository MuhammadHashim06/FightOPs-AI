"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { HumanActionPriorityBadge } from "@/features/dashboard/components/human-action-priority-badge";
import type { HumanActionCaseDetail } from "@/features/dashboard/data/promoter-events";
import { useToast } from "@/providers/toast-provider";

export function HumanActionCasePage({
  item,
}: {
  item: HumanActionCaseDetail;
}) {
  const { showToast } = useToast();
  const [isResolved, setIsResolved] = useState(false);
  const [correctValue, setCorrectValue] = useState("");

  function handleResolve(message: string) {
    setIsResolved(true);
    showToast({
      title: message,
      variant: "success",
    });
  }

  function handleAction(message: string) {
    showToast({
      title: message,
      variant: "success",
    });
  }

  return (
    <main className="space-y-5">
      <Link
        href="/dashboard/promoter/human-action"
        className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back</span>
      </Link>

      <div className="grid gap-6 xl:grid-cols-[1.75fr_0.85fr]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-4 border-b border-border-subtle px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <h1 className="text-[24px] font-semibold tracking-tight text-text-strong">
                    {item.fighterName}
                  </h1>
                  <p className="text-lg text-text-body">
                    {item.eventName} - {item.requirement}
                  </p>
                </div>
                <p className="max-w-3xl text-[16px] leading-8 text-text-body">
                  {item.summary}
                </p>
              </div>

              <HumanActionPriorityBadge priority={item.priority} />
            </div>

            <div className="flex flex-wrap items-center gap-6 px-5 py-4 text-[15px]">
              <span className="font-medium text-info">{item.confidenceScore}</span>
              <span className="text-text-muted">Created {item.createdAt}</span>
            </div>
          </section>

          <DetailCard title="Document Preview">
            <div className="flex flex-col gap-4 rounded-[14px] border border-border-subtle bg-panel px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-panel-muted text-text-muted">
                  <DocumentIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[18px] font-medium text-text-strong">
                    {item.documentName}
                  </p>
                  <p className="text-sm text-text-muted">{item.documentMeta}</p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-4 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
              >
                Open
              </button>
            </div>
          </DetailCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ComparisonCard title="AI Extracted" tone="blue" items={item.aiExtracted} />
            <ComparisonCard
              title="Existing Record"
              tone="neutral"
              items={item.existingRecord}
            />
          </div>

          <CalloutCard tone="warning" title="Detected Mismatch">
            {item.mismatch}
          </CalloutCard>

          <CalloutCard tone="info" title="AI Recommendation">
            {item.recommendation}
          </CalloutCard>
        </div>

        <aside className="rounded-[18px] border border-info-soft-border bg-panel p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <ShieldIcon className="h-5 w-5 text-info" />
            <h2 className="text-[22px] font-semibold text-text-strong">
              Human Decision
            </h2>
          </div>

          <p className="mt-4 text-[15px] leading-7 text-text-body">
            This is a critical priority, identity-sensitive case. Human authority is required.
          </p>

          {isResolved ? (
            <div className="mt-5 rounded-[16px] border border-success-border-strong bg-success-surface-soft p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-panel text-success shadow-[var(--shadow-success)]">
                <CheckIcon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-[24px] font-semibold text-success">Case resolved</p>
              <p className="mt-2 text-[15px] text-text-body">
                Fighter status updated. Audit logged.
              </p>
              <Link
                href="/dashboard/promoter/human-action"
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
              >
                Back to queue
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => handleResolve("Extracted value approved and case resolved.")}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-success px-4 text-[15px] font-medium text-text-inverse transition hover:opacity-90"
              >
                <CheckIcon className="h-4 w-4" />
                <span>Approve extracted value</span>
              </button>

              <div className="rounded-[14px] border border-border-subtle bg-panel p-3">
                <label className="flex flex-col gap-2">
                  <span className="text-[15px] font-medium text-text-strong">
                    Correct value
                  </span>
                  <input
                    value={correctValue}
                    onChange={(event) => setCorrectValue(event.target.value)}
                    placeholder="Enter correct value"
                    className="h-11 rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleResolve(
                      correctValue
                        ? `Correct value "${correctValue}" accepted and case resolved.`
                        : "Correct value accepted and case resolved.",
                    )
                  }
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
                >
                  <ShieldIcon className="h-4 w-4 text-text-body" />
                  <span>Correct & accept</span>
                </button>
              </div>

              <ActionButton
                label="Request resubmission"
                icon={<RefreshIcon className="h-4 w-4" />}
                onClick={() => handleAction("Resubmission request sent.")}
              />
              <ActionButton
                label="Request new file"
                icon={<DocumentIcon className="h-4 w-4" />}
                onClick={() => handleAction("New file request sent.")}
              />
              <ActionButton
                label="Mark N/A"
                icon={<SlashIcon className="h-4 w-4" />}
                onClick={() => handleAction("Case marked as not applicable.")}
              />
              <ActionButton
                label="Contact participant"
                icon={<MessageIcon className="h-4 w-4" />}
                onClick={() => handleAction("Participant contact action prepared.")}
              />

              <button
                type="button"
                onClick={() => handleAction("Case rejected and routed for follow-up.")}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-danger-action px-4 text-[15px] font-medium text-text-inverse transition hover:opacity-90"
              >
                <CloseIcon className="h-4 w-4" />
                <span>Reject</span>
              </button>
              <button
                type="button"
                onClick={() => handleResolve("Case resolved and audit log updated.")}
                className="inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-brand px-4 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong"
              >
                Resolve case
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-border-subtle bg-panel p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ComparisonCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
  tone: "blue" | "neutral";
}) {
  return (
    <section
      className={`rounded-[18px] border p-5 shadow-[var(--shadow-card)] ${
        tone === "blue"
          ? "border-info-border bg-info-surface"
          : "border-border-subtle bg-panel"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.18em] ${
          tone === "blue" ? "text-brand" : "text-text-muted"
        }`}
      >
        {title}
      </p>
      <div className="mt-5 space-y-4">
        {items.map((entry) => (
          <div key={entry.label} className="flex items-start justify-between gap-4">
            <span className="text-[15px] text-text-muted">{entry.label}</span>
            <span className="text-right text-[15px] font-medium text-text-strong">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CalloutCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "warning" | "info";
  children: ReactNode;
}) {
  const styles =
    tone === "warning"
      ? "border-warning-border-soft bg-warning-surface-pale"
      : "border-teal-border bg-teal-surface-strong";

  const labelStyles = tone === "warning" ? "text-warning" : "text-teal-strong";

  return (
    <section
      className={`rounded-[18px] border p-4 shadow-[var(--shadow-card)] ${styles}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${labelStyles}`}>
        {title}
      </p>
      <p className="mt-3 text-[16px] leading-8 text-text-body">{children}</p>
    </section>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-full items-center gap-3 rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
    >
      <span className="text-text-body">{icon}</span>
      <span>{label}</span>
    </button>
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

function CheckIcon({ className }: { className?: string }) {
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
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
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

function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M12 3 6 5v6c0 4.4 2.6 7.8 6 10 3.4-2.2 6-5.6 6-10V5l-6-2Z" />
      <path d="m9.5 12 2 2 3-4" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
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
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function SlashIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.5 18.5 18.5" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
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
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
    </svg>
  );
}
