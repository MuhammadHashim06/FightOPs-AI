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
          note: eventNote,
          templateIds: selectedTemplateIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to create event.");
      }

      showToast({
        title: "Event saved successfully.",
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
          Add the event details and choose requirements.
        </p>
      </div>

      <section className="rounded-[18px] border border-border-subtle bg-panel px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <StepCard
            step="01"
            title="Event Info"
            active={currentStep === 1}
            complete={currentStep === 2}
          />
          <div className="h-px flex-1 bg-border-subtle" />
          <StepCard
            step="02"
            title="Templates"
            active={currentStep === 2}
          />
        </div>
      </section>

      {currentStep === 1 ? (
        <>
          <section className="overflow-hidden rounded-[20px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
            <div className="space-y-6 p-6">
              <FormField label="Event name" required>
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
                <FormField label="Date" required>
                  <input
                    name="date"
                    type="date"
                    className={inputClassName}
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Location / place" required>
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
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleContinue}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong"
            >
              Continue
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="overflow-hidden rounded-[20px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
            <div className="space-y-6 p-6">
              <div className="border-b border-border-subtle pb-4">
                <h2 className="text-[20px] font-semibold text-text-strong">
                  Event Templates
                </h2>
                <p className="mt-1 text-[15px] text-text-body">
                  Choose only the requirements needed for this event.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border-subtle bg-panel px-4 py-3">
                <p className="text-[15px] text-text-body">
                  {initialTemplates.length === 0
                    ? "No default templates yet"
                    : `${selectedTemplateIds.length} of ${initialTemplates.length} selected`}
                </p>
                {initialTemplates.length > 0 ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTemplateIds(initialTemplates.map((template) => template.id))
                      }
                      className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplateIds([])}
                      className="inline-flex h-9 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-4 text-sm font-medium text-text-strong transition hover:bg-panel-muted"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
              </div>

              {initialTemplates.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-border-strong bg-panel-muted px-5 py-8 text-center">
                  <p className="text-[17px] font-semibold text-text-strong">
                    No templates configured
                  </p>
                  <p className="mt-2 text-sm text-text-body">
                    Save the event now, then add event-specific requirements from
                    the event detail page.
                  </p>
                </div>
              ) : null}

              {Object.entries(groupedTemplates).map(([category, templates]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {category}
                  </h3>

                  <div className="grid gap-2 lg:grid-cols-2">
                    {templates.map((template) => {
                      const selected = isSelected(template.id);

                      return (
                        <label
                          key={template.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-[14px] border px-4 py-3 transition ${
                            selected
                              ? "border-brand bg-brand-surface"
                              : "border-border-subtle bg-panel hover:bg-panel-muted"
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
                            <p className="mt-2 text-[13px] text-text-muted">
                              {buildScheduleLabel(template)}
                            </p>
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
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
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
  active,
  complete,
}: {
  step: string;
  title: string;
  active?: boolean;
  complete?: boolean;
}) {
  return (
    <div className="flex min-w-fit items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
          active
            ? "bg-brand text-text-inverse"
            : complete
              ? "bg-success text-text-inverse"
              : "bg-panel-muted text-text-body"
        }`}
      >
        {complete ? "OK" : step}
      </div>
      <p
        className={`text-sm font-semibold ${
          active || complete ? "text-text-strong" : "text-text-body"
        }`}
      >
        {title}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
  required = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
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

function TemplateTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-[8px] bg-panel-muted px-2.5 py-1 text-xs font-medium text-text-body">
      {children}
    </span>
  );
}

function buildScheduleLabel(template: RequirementTemplateRecord) {
  const dueOffsetDays = template.dueOffsetDays ?? template.dueDaysBeforeEvent;
  const dueLabel =
    typeof dueOffsetDays === "number"
      ? `Due ${dueOffsetDays} day${dueOffsetDays === 1 ? "" : "s"} ${labelForDueAnchor(
          template.dueAnchor,
        )}`
      : "No due offset";

  const reminderDay = template.reminderDaysBeforeDue[0];
  const reminderLabel =
    template.reminderCadence === "off" || !template.reminderEnabled
      ? "Reminder off"
      : template.reminderCadence === "once_before_due"
        ? `One reminder ${reminderDay ?? 0} day${reminderDay === 1 ? "" : "s"} before due`
        : `Daily reminders from ${reminderDay ?? 0} day${
            reminderDay === 1 ? "" : "s"
          } before due`;

  return `${dueLabel} - ${reminderLabel}`;
}

function labelForDueAnchor(anchor: RequirementTemplateRecord["dueAnchor"]) {
  if (anchor === "custom_date") {
    return "on custom deadline";
  }

  if (anchor === "before_event") {
    return "before event";
  }

  if (anchor === "after_fight_scheduled") {
    return "after fight scheduled";
  }

  if (anchor === "after_invite_accepted") {
    return "after invite accepted";
  }

  return "after signed agreement approved";
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
  "h-11 w-full rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

const textareaClassName =
  "w-full rounded-[12px] border border-border-subtle bg-panel px-4 py-3 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

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
