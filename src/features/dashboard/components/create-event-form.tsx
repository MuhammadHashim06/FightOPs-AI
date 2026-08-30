"use client";

import type { FormEvent, ReactNode } from "react";
import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";
import type { RequirementTemplateRecord } from "@/types/readiness";

export function CreateEventForm({
  initialTemplates,
}: {
  initialTemplates: RequirementTemplateRecord[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStatus, setEventStatus] = useState("draft");
  const [eventLocation, setEventLocation] = useState("");
  const [eventNote, setEventNote] = useState("");
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(
    initialTemplates.map((template) => template.id),
  );

  const groupedTemplates = useMemo(() => {
    return initialTemplates.reduce<Record<string, RequirementTemplateRecord[]>>(
      (groups, template) => {
        const key = template.category;
        groups[key] = groups[key] ? [...groups[key], template] : [template];
        return groups;
      },
      {},
    );
  }, [initialTemplates]);

  function handleContinue() {
    if (eventName.trim().length < 3) {
      showToast({
        title: "Event name must be at least 3 characters.",
        variant: "error",
      });
      return;
    }

    if (!eventDate.trim()) {
      showToast({
        title: "Event date is required.",
        variant: "error",
      });
      return;
    }

    if (eventLocation.trim().length < 3) {
      showToast({
        title: "Event location must be at least 3 characters.",
        variant: "error",
      });
      return;
    }

    setCurrentStep(2);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    try {
      const response = await fetch("/api/v1/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: eventName,
          date: eventDate,
          location: eventLocation,
          status: eventStatus.toLowerCase(),
          note: eventNote,
          templateIds: selectedTemplateIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to create event.");
      }

      showToast({
        title: "Event draft saved successfully.",
        variant: "success",
      });

      startTransition(() => {
        router.push(`/dashboard/promoter/events/${result.data.event.slug}`);
        router.refresh();
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create event.";

      showToast({
        title: message,
        variant: "error",
      });
    } finally {
      setIsPending(false);
    }
  }

  function toggleTemplate(templateId: string) {
    setSelectedTemplateIds((current) =>
      current.includes(templateId)
        ? current.filter((item) => item !== templateId)
        : [...current, templateId],
    );
  }

  function isSelected(templateId: string) {
    return selectedTemplateIds.includes(templateId);
  }

  return (
    <main className="space-y-5">
      <Link
        href="/dashboard/promoter/events"
        className="inline-flex items-center gap-2 text-[15px] text-text-body transition hover:text-text-strong"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to events</span>
      </Link>

      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Create Event
        </h1>
        <p className="text-lg text-text-body">
          First add the event details, then choose the templates for this event.
        </p>
      </div>

      <section className="rounded-[20px] border border-border-subtle bg-panel p-5 shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
        <div className="grid gap-4 md:grid-cols-2">
          <StepCard
            step="01"
            title="Event Info"
            description="Name, date, status, and venue details."
            active={currentStep === 1}
            complete={currentStep === 2}
          />
          <StepCard
            step="02"
            title="Templates"
            description="Choose the requirements to add."
            active={currentStep === 2}
          />
        </div>
      </section>

      {currentStep === 1 ? (
        <>
          <section className="overflow-hidden rounded-[20px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
            <div className="space-y-6 p-6">
              <FormField label="Event name">
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Desert Clash 14"
                  className={inputClassName}
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                />
              </FormField>

              <div className="grid gap-6 lg:grid-cols-2">
                <FormField label="Date">
                  <input
                    name="date"
                    type="date"
                    className={inputClassName}
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                </FormField>

                <FormField label="Status">
                  <div className="relative">
                    <select
                      name="status"
                      value={eventStatus}
                      onChange={(event) => setEventStatus(event.target.value)}
                      className="h-11 w-full appearance-none rounded-[12px] border border-border-subtle bg-white px-4 pr-10 text-[15px] text-text-strong outline-none transition focus:border-brand"
                    >
                      <option value="draft">Draft</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  </div>
                </FormField>
              </div>

              <FormField label="Location / place">
                <input
                  name="location"
                  type="text"
                  placeholder="e.g. Etihad Arena, Abu Dhabi"
                  className={inputClassName}
                  value={eventLocation}
                  onChange={(event) => setEventLocation(event.target.value)}
                />
              </FormField>

              <FormField label="Basic note (optional)">
                <textarea
                  name="note"
                  rows={4}
                  placeholder="Internal note..."
                  className={textareaClassName}
                  value={eventNote}
                  onChange={(event) => setEventNote(event.target.value)}
                />
              </FormField>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/dashboard/promoter/events"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-white px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-white transition hover:bg-brand-strong"
            >
              Continue
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="overflow-hidden rounded-[20px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
            <div className="space-y-6 p-6">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="text-[20px] font-semibold text-text-strong">
                  Event Templates
                </h2>
                <p className="mt-1 text-[15px] text-text-body">
                  Selected templates will be copied into this event as readiness
                  requirements.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border-subtle bg-white px-4 py-3">
                <p className="text-[15px] text-text-body">
                  {selectedTemplateIds.length} of {initialTemplates.length} templates
                  selected
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTemplateIds(initialTemplates.map((template) => template.id))
                    }
                    className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border-subtle bg-white px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateIds([])}
                    className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border-subtle bg-white px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {Object.entries(groupedTemplates).map(([category, templates]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {category}
                  </h3>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {templates.map((template) => {
                      const selected = isSelected(template.id);

                      return (
                        <label
                          key={template.id}
                          className={`flex cursor-pointer gap-3 rounded-[16px] border px-4 py-4 transition ${
                            selected
                              ? "border-brand bg-[#f4f7ff]"
                              : "border-border-subtle bg-white hover:bg-panel-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleTemplate(template.id)}
                            className="mt-1 h-4 w-4 rounded border-border-strong accent-[var(--brand)]"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[16px] font-semibold text-text-strong">
                                {template.name}
                              </span>
                              <TemplateTag>{capitalize(template.priority)}</TemplateTag>
                              <TemplateTag>{labelForInputType(template.inputType)}</TemplateTag>
                            </div>
                            <p className="mt-1 text-[14px] text-text-body">
                              {template.description ?? "No description added yet."}
                            </p>
                            <p className="mt-2 text-[13px] text-text-muted">
                              {buildScheduleLabel(template)}
                            </p>
                            {template.structuredFields.length > 0 ? (
                              <p className="mt-2 text-[13px] text-text-muted">
                                Fields:{" "}
                                {template.structuredFields
                                  .map((field) => field.label)
                                  .join(", ")}
                              </p>
                            ) : null}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/dashboard/promoter/events"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-white px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-white px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save event"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

function StepCard({
  step,
  title,
  description,
  active,
  complete,
}: {
  step: string;
  title: string;
  description: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <div
      className={`rounded-[16px] border px-4 py-4 transition ${
        active
          ? "border-brand bg-[#f4f7ff]"
          : complete
            ? "border-[#b7ead1] bg-[#ecfbf2]"
            : "border-border-subtle bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
            active
              ? "bg-brand text-white"
              : complete
                ? "bg-success text-white"
                : "bg-panel-muted text-text-body"
          }`}
        >
          {complete ? "2" : step}
        </div>
        <div>
          <p className="text-[16px] font-semibold text-text-strong">{title}</p>
          <p className="text-[14px] text-text-body">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold text-text-strong">{label}</span>
      {children}
    </label>
  );
}

function TemplateTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-[8px] bg-panel-muted px-2.5 py-1 text-xs font-medium text-text-body">
      {children}
    </span>
  );
}

function buildScheduleLabel(template: RequirementTemplateRecord) {
  const dueLabel =
    typeof template.dueDaysBeforeEvent === "number"
      ? `Due ${template.dueDaysBeforeEvent} day${
          template.dueDaysBeforeEvent === 1 ? "" : "s"
        } before event`
      : "No due offset";

  const reminderDay = template.reminderDaysBeforeDue[0];
  const reminderLabel = template.reminderEnabled
    ? `Reminder ${reminderDay ?? 0} day${reminderDay === 1 ? "" : "s"} before due`
    : "Reminder off";

  return `${dueLabel} - ${reminderLabel}`;
}

function labelForInputType(inputType: RequirementTemplateRecord["inputType"]) {
  if (inputType === "document") {
    return "Document";
  }

  if (inputType === "text") {
    return "Form";
  }

  return capitalize(inputType);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const inputClassName =
  "h-11 w-full rounded-[12px] border border-border-subtle bg-white px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

const textareaClassName =
  "w-full rounded-[12px] border border-border-subtle bg-white px-4 py-3 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

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

function ChevronDownIcon({ className }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
