"use client";

import type { FormEvent, ReactNode } from "react";
import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";
import type { EventRecord } from "@/types/event";

export function EditEventForm({ event }: { event: EventRecord }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(toDateInputValue(event.date));
  const [location, setLocation] = useState(event.location);
  const [note, setNote] = useState(event.note ?? "");

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setIsPending(true);

    try {
      const response = await fetch(`/api/v1/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, location, note }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to update event.");
      }

      showToast({
        title: "Event updated successfully.",
        variant: "success",
      });

      startTransition(() => {
        router.push(`/dashboard/promoter/events/${result.data.event.slug}`);
        router.refresh();
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to update event.",
        variant: "error",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="space-y-6 pb-6">
      <Link
        href={`/dashboard/promoter/events/${event.slug}`}
        className="inline-flex items-center gap-2 rounded-[8px] text-[15px] text-text-body transition hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to event</span>
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Edit Event
          </h1>
          <p className="text-lg text-text-body">
            Update the event information used across your workspace.
          </p>
        </div>
        <p className="text-sm text-text-muted">Event details</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-[20px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]"
      >
        <div className="border-b border-border-subtle bg-panel-muted/50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Event settings
          </p>
          <h2 className="mt-1 text-[21px] font-semibold text-text-strong">
            Update event details
          </h2>
          <p className="mt-1 text-sm text-text-body">
            Keep the event information accurate for everyone working on this event.
          </p>
        </div>

        <div className="space-y-5 p-6">
          <FormField label="Event name" required>
            <input
              type="text"
              value={name}
              onChange={(inputEvent) => setName(inputEvent.target.value)}
              className={inputClassName}
              placeholder="e.g. Desert Clash 14"
            />
          </FormField>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label="Date" required>
              <input
                type="date"
                value={date}
                onChange={(inputEvent) => setDate(inputEvent.target.value)}
                className={inputClassName}
              />
            </FormField>
            <FormField label="Location / place" required>
              <input
                type="text"
                value={location}
                onChange={(inputEvent) => setLocation(inputEvent.target.value)}
                className={inputClassName}
                placeholder="e.g. Etihad Arena, Abu Dhabi"
              />
            </FormField>
          </div>

          <FormField label="Basic note (optional)">
            <textarea
              rows={4}
              value={note}
              onChange={(inputEvent) => setNote(inputEvent.target.value)}
              className={textareaClassName}
              placeholder="Internal note..."
            />
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border-subtle px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted">Required fields are marked with *</p>
          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href={`/dashboard/promoter/events/${event.slug}`}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold text-text-strong">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function toDateInputValue(isoDate: string) {
  return new Date(isoDate).toISOString().slice(0, 10);
}

const inputClassName =
  "h-11 w-full rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

const textareaClassName =
  "w-full rounded-[12px] border border-border-subtle bg-panel px-4 py-3 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </svg>
  );
}
