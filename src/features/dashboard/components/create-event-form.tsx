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
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Operations");
  const [templateInputType, setTemplateInputType] = useState("document");
  const [templatePriority, setTemplatePriority] = useState("medium");
  const [templateDueAnchor, setTemplateDueAnchor] = useState("before_event");
  const [templateDueDays, setTemplateDueDays] = useState("3");
  const [templateReminderCadence, setTemplateReminderCadence] = useState("daily_until_resolved");
  const [templateReminderDays, setTemplateReminderDays] = useState("3");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const [templateRequired, setTemplateRequired] = useState(true);
  const [templateHumanReview, setTemplateHumanReview] = useState(false);
  const [templateSignedAgreement, setTemplateSignedAgreement] = useState(false);
  const [saveTemplateAsDefault, setSaveTemplateAsDefault] = useState(false);
  const [isTemplateSaving, setIsTemplateSaving] = useState(false);
  const [createdTemplates, setCreatedTemplates] = useState<RequirementTemplateRecord[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(
    initialTemplates.map((template) => template.id),
  );
  const availableTemplates = useMemo(() => {
    const templates = [...initialTemplates, ...createdTemplates];
    return templates.filter(
      (template, index) => templates.findIndex((item) => item.id === template.id) === index,
    );
  }, [createdTemplates, initialTemplates]);

  const groupedTemplates = useMemo(() => {
    return availableTemplates.reduce<Record<string, RequirementTemplateRecord[]>>(
      (groups, template) => {
        const key = template.category;
        groups[key] = groups[key] ? [...groups[key], template] : [template];
        return groups;
      },
      {},
    );
  }, [availableTemplates]);

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

  async function handleCreateTemplate() {
    if (!templateName.trim()) return;
    setIsTemplateSaving(true);

    try {
      const response = await fetch("/api/v1/requirement-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          category: templateCategory,
          inputType: templateInputType,
          required: templateRequired,
          priority: templatePriority,
          dueAnchor: templateDueAnchor,
          dueDaysBeforeEvent: templateDueAnchor === "before_event" ? Number(templateDueDays) : undefined,
          dueOffsetDays: Number(templateDueDays),
          reminderEnabled: templateReminderCadence !== "off",
          reminderCadence: templateReminderCadence,
          reminderDaysBeforeDue: templateReminderDays ? [Number(templateReminderDays)] : [],
          description: templateDescription,
          reminderSubject: templateSubject,
          reminderMessage: templateMessage,
          humanVerificationRequired: templateHumanReview,
          isSignedAgreement: templateSignedAgreement,
          acceptedFileTypes: templateInputType === "document" ? ["pdf", "jpg", "jpeg", "png"] : [],
          isDefault: saveTemplateAsDefault,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to create template.");
      }

      setCreatedTemplates((current) => [...current, result.data.template]);
      setSelectedTemplateIds((current) => [...current, result.data.template.id]);
      setTemplateName("");
      setTemplateDescription("");
      setTemplateSubject("");
      setTemplateMessage("");
      setSaveTemplateAsDefault(false);
      setIsTemplateModalOpen(false);
      showToast({ title: saveTemplateAsDefault ? "Template created, selected, and saved as a default." : "Template created and selected for this event.", variant: "success" });
      startTransition(() => router.refresh());
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to create template.",
        variant: "error",
      });
    } finally {
      setIsTemplateSaving(false);
    }
  }

  return (
    <main className="space-y-6 pb-6">
      <Link
        href="/dashboard/promoter/events"
        className="inline-flex items-center gap-2 rounded-[8px] text-[15px] text-text-body transition hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to events</span>
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Create Event
          </h1>
          <p className="text-lg text-text-body">
            Add the event details and choose requirements.
          </p>
        </div>
        <p className="text-sm text-text-muted">Step {currentStep} of 2</p>
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
            <div className="border-b border-border-subtle bg-panel-muted/50 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                Step 1
              </p>
              <h2 className="mt-1 text-[21px] font-semibold text-text-strong">Event details</h2>
              <p className="mt-1 text-sm text-text-body">
                Tell us where and when the event is happening.
              </p>
            </div>

            <div className="space-y-5 p-6">
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

              <div className="grid gap-5 lg:grid-cols-2">
                <FormField label="Date" required>
                  <input
                    name="date"
                    type="date"
                    className={inputClassName}
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                </FormField>
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
              </div>

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

          <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-muted">Required fields are marked with *</p>
            <div className="flex flex-wrap justify-end gap-3">
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
                  {availableTemplates.length === 0
                    ? "No default templates yet"
                    : `${selectedTemplateIds.length} of ${availableTemplates.length} selected`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="inline-flex h-9 items-center justify-center rounded-[10px] bg-brand px-4 text-sm font-medium text-text-inverse transition hover:bg-brand-strong"
                  >
                    + Add template
                  </button>
                  {availableTemplates.length > 0 ? (
                    <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTemplateIds(availableTemplates.map((template) => template.id))
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
                    </>
                  ) : null}
                </div>
              </div>

              {availableTemplates.length === 0 ? (
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

          {isTemplateModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/40 p-4">
              <section className="w-full max-w-lg rounded-[18px] border border-border-subtle bg-panel p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-[21px] font-semibold text-text-strong">Add template</h2>
                <p className="mt-1 text-sm text-text-body">Create a reusable document requirement and select it for this event.</p>
                <div className="mt-5 space-y-4">
                  <FormField label="Template name" required>
                    <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="e.g. Visa Information" className={inputClassName} required />
                  </FormField>
                  <FormField label="Category" required>
                    <select value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)} className={inputClassName}>
                      {['Legal', 'Medical', 'Insurance', 'Travel', 'Media', 'Operations'].map((category) => <option key={category}>{category}</option>)}
                    </select>
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Input type" required>
                      <select value={templateInputType} onChange={(event) => setTemplateInputType(event.target.value)} className={inputClassName}>
                        <option value="document">Document upload</option><option value="text">Text field</option><option value="date">Date</option><option value="number">Number</option><option value="choice">Choice</option><option value="confirmation">Confirmation</option>
                      </select>
                    </FormField>
                    <FormField label="Priority" required>
                      <select value={templatePriority} onChange={(event) => setTemplatePriority(event.target.value)} className={inputClassName}>
                        <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                      </select>
                    </FormField>
                    <FormField label="Deadline rule" required>
                      <select value={templateDueAnchor} onChange={(event) => setTemplateDueAnchor(event.target.value)} className={inputClassName}>
                        <option value="before_event">Deadline before event</option><option value="after_fight_scheduled">After fight scheduling</option><option value="after_invite_accepted">After invite acceptance</option><option value="after_signed_agreement_approved">After agreement approval</option>
                      </select>
                    </FormField>
                    <FormField label="Deadline days" required>
                      <input type="number" min="0" value={templateDueDays} onChange={(event) => setTemplateDueDays(event.target.value)} className={inputClassName} />
                    </FormField>
                    <FormField label="Reminder cadence" required>
                      <select value={templateReminderCadence} onChange={(event) => setTemplateReminderCadence(event.target.value)} className={inputClassName}>
                        <option value="daily_until_resolved">Daily until resolved</option><option value="once_before_due">Once before deadline</option><option value="off">No reminder</option>
                      </select>
                    </FormField>
                    <FormField label="Start reminders (days before)">
                      <input type="number" min="0" value={templateReminderDays} onChange={(event) => setTemplateReminderDays(event.target.value)} className={inputClassName} />
                    </FormField>
                  </div>
                  <FormField label="Description (optional)">
                    <textarea rows={3} value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} placeholder="Describe what needs to be submitted or confirmed." className={textareaClassName} />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Reminder email subject (optional)"><input value={templateSubject} onChange={(event) => setTemplateSubject(event.target.value)} className={inputClassName} /></FormField>
                    <FormField label="Reminder email message (optional)"><textarea rows={3} value={templateMessage} onChange={(event) => setTemplateMessage(event.target.value)} placeholder="Please submit {{requirementName}} before {{dueDate}}." className={textareaClassName} /><p className="mt-1 text-xs text-text-muted">Variables: {"{{requirementName}}"}, {"{{fighterName}}"}, {"{{eventName}}"}, {"{{dueDate}}"}, {"{{daysRemaining}}"}, {"{{uploadLink}}"}</p></FormField>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[[templateRequired, setTemplateRequired, "Required for readiness"], [templateHumanReview, setTemplateHumanReview, "Human verification"], [templateSignedAgreement, setTemplateSignedAgreement, "Signed agreement"], [saveTemplateAsDefault, setSaveTemplateAsDefault, "Also add to default templates"]].map(([checked, setter, label]) => <label key={String(label)} className="flex items-center gap-2 rounded-[10px] border border-border-subtle px-3 py-2 text-sm text-text-body"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} className="accent-[var(--brand)]" />{String(label)}</label>)}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="inline-flex h-10 items-center rounded-[10px] border border-border-subtle bg-panel px-4 text-sm font-medium text-text-strong">Cancel</button>
                    <button type="button" onClick={() => void handleCreateTemplate()} disabled={isTemplateSaving || !templateName.trim()} className="inline-flex h-10 items-center rounded-[10px] bg-brand px-4 text-sm font-medium text-text-inverse disabled:opacity-60">{isTemplateSaving ? "Saving..." : "Create template"}</button>
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-end">
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
        {complete ? "\u2713" : step}
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
