"use client";

import { useState } from "react";
import Link from "next/link";
import { startTransition } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";
import type { ReminderLogRecord } from "@/types/readiness";

type ReminderSummary = {
  total: number;
  pending: number;
  sent: number;
  overdue: number;
};

export function EventRemindersPage({
  eventSlug,
  eventId,
  eventName,
  initialSummary,
  initialReminders,
}: {
  eventSlug: string;
  eventId?: string;
  eventName: string;
  initialSummary: ReminderSummary;
  initialReminders: ReminderLogRecord[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [summary, setSummary] = useState(initialSummary);
  const [reminders, setReminders] = useState(initialReminders);

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredReminders = reminders.filter((item) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      item.recipientName.toLowerCase().includes(normalizedSearch) ||
      item.recipientEmail.toLowerCase().includes(normalizedSearch) ||
      item.requirementName.toLowerCase().includes(normalizedSearch) ||
      item.subject.toLowerCase().includes(normalizedSearch)
    );
  });

  async function handleSendDueReminders() {
    if (!eventId) {
      showToast({
        title: "Demo events do not send reminders yet.",
        variant: "warning",
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`/api/v1/events/${eventId}/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send-due",
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to send reminders.");
      }

      const refreshed = await fetch(`/api/v1/events/${eventId}/reminders`);
      const refreshedResult = await refreshed.json();

      if (refreshed.ok && refreshedResult.success) {
        setSummary(refreshedResult.data.summary as ReminderSummary);
        setReminders(refreshedResult.data.reminders as ReminderLogRecord[]);
      }

      showToast({
        title:
          result.data.failedCount > 0
            ? `${result.data.sentCount} sent, ${result.data.failedCount} failed.`
            : result.data.sentCount > 0
              ? `${result.data.sentCount} reminder(s) sent successfully.`
              : "No due reminders were ready to send.",
        variant: result.data.failedCount > 0 ? "warning" : "success",
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to send reminders.",
        variant: "error",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="space-y-5 pb-4">
      <Link
        href={`/dashboard/promoter/events/${eventSlug}`}
        className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back</span>
      </Link>

      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Post Reminders
        </h1>
        <p className="text-lg text-text-body">
          Review and send document reminder emails for {eventName}.
        </p>
      </div>

      <div className="flex flex-wrap gap-8 border-b border-border-subtle">
        <EventTab href={`/dashboard/promoter/events/${eventSlug}`}>Fight Card</EventTab>
        <EventTab href={`/dashboard/promoter/events/${eventSlug}/requirements`}>
          Required Documents
        </EventTab>
        <EventTab href={`/dashboard/promoter/events/${eventSlug}/post-reminders`} active>
          Post Reminders
        </EventTab>
        <EventTab>Human Action</EventTab>
        <EventTab>Event Knowledge</EventTab>
        <EventTab>Communications</EventTab>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total" value={summary.total} hint="queued reminders" />
        <SummaryCard label="Pending" value={summary.pending} hint="not sent yet" />
        <SummaryCard label="Sent" value={summary.sent} hint="email actions completed" />
        <SummaryCard label="Due now" value={summary.overdue} hint="ready to send" tone="warning" />
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel p-3 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-[12px] border border-border-subtle bg-white px-4 text-text-muted">
            <SearchIcon className="h-5 w-5" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search recipient, requirement or subject..."
              className="w-full bg-transparent text-[15px] text-text-strong outline-none placeholder:text-text-muted"
            />
          </div>

          <button
            type="button"
            onClick={handleSendDueReminders}
            disabled={isSending}
            className="inline-flex h-12 items-center justify-center rounded-[12px] bg-brand px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(47,107,255,0.24)] transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send Due Reminders"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
        <div className="hidden grid-cols-[1.2fr_1.4fr_1fr_1fr_1.6fr_0.9fr] gap-4 border-b border-border-subtle px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:grid">
          <span>Recipient</span>
          <span>Requirement</span>
          <span>Scheduled</span>
          <span>Due Date</span>
          <span>Subject</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {filteredReminders.map((reminder) => (
            <article
              key={reminder.id}
              className="grid gap-4 px-5 py-5 lg:grid-cols-[1.2fr_1.4fr_1fr_1fr_1.6fr_0.9fr] lg:px-6"
            >
              <div>
                <p className="text-[16px] font-medium text-text-strong">
                  {reminder.recipientName}
                </p>
                <p className="mt-1 text-[14px] text-text-muted">{reminder.recipientEmail}</p>
              </div>
              <div>
                <p className="text-[16px] font-medium text-text-strong">
                  {reminder.requirementName}
                </p>
                <p className="mt-1 text-[14px] text-text-muted">{reminder.eventName}</p>
              </div>
              <div className="text-[15px] text-text-body">
                {reminder.scheduledFor.slice(0, 10)}
              </div>
              <div className="text-[15px] text-text-body">
                {reminder.dueDate ? reminder.dueDate.slice(0, 10) : "No due date"}
              </div>
              <div>
                <p className="text-[15px] font-medium text-text-strong">{reminder.subject}</p>
                <p className="mt-1 line-clamp-2 text-[14px] text-text-muted">
                  {reminder.message}
                </p>
              </div>
              <div>
                <StatusBadge status={reminder.status} />
              </div>
            </article>
          ))}

          {filteredReminders.length === 0 ? (
            <div className="px-5 py-12 text-center lg:px-10">
              <p className="text-[18px] font-medium text-text-strong">
                No reminders found
              </p>
              <p className="mt-2 text-[15px] text-text-body">
                Add fighters and requirements to start building the email reminder queue.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function EventTab({
  children,
  href,
  active = false,
}: {
  children: string;
  href?: string;
  active?: boolean;
}) {
  const className = `border-b-2 px-3 pb-3 text-[15px] font-medium transition ${
    active
      ? "border-brand text-brand"
      : "border-transparent text-text-body hover:text-text-strong"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {children}
    </button>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "warning";
}) {
  return (
    <section className="rounded-[18px] border border-border-subtle bg-panel px-4 py-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p className={`mt-3 text-[42px] font-semibold ${tone === "warning" ? "text-warning" : "text-text-strong"}`}>
        {value}
      </p>
      <p className="mt-1 text-[15px] text-text-body">{hint}</p>
    </section>
  );
}

function StatusBadge({ status }: { status: ReminderLogRecord["status"] }) {
  const styles =
    status === "SENT"
      ? "bg-[#e7f8ee] text-[#15924c]"
      : status === "FAILED"
        ? "bg-[#fff0f0] text-danger"
        : status === "SKIPPED"
          ? "bg-panel-muted text-text-body"
          : "bg-[#edf3ff] text-brand";

  return (
    <span className={`inline-flex rounded-[8px] px-2.5 py-1 text-sm font-medium ${styles}`}>
      {status === "PENDING" ? "Pending" : status === "SENT" ? "Sent" : status === "FAILED" ? "Failed" : "Skipped"}
    </span>
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
