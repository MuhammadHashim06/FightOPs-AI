"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/providers/toast-provider";
import type {
  EventRequirementInputType,
  EventRequirementRecord,
  RequirementDueAnchor,
  RequirementPriority,
  RequirementReminderCadence,
} from "@/types/readiness";

const requirementCategories = [
  "Legal",
  "Medical",
  "Insurance",
  "Travel",
  "Media",
  "Operations",
] as const;

const requirementInputTypes: Array<{
  value: EventRequirementInputType;
  label: string;
}> = [
  { value: "document", label: "Document upload" },
  { value: "text", label: "Text field" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "choice", label: "Choice" },
  { value: "confirmation", label: "Confirmation" },
];

const requirementPriorities: Array<{
  value: RequirementPriority;
  label: string;
}> = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const deadlineRuleOptions: Array<{
  value: RequirementDueAnchor;
  label: string;
}> = [
  { value: "custom_date", label: "Use exact deadline date" },
  { value: "after_invite_accepted", label: "Due in X days after invite acceptance" },
  { value: "after_fight_scheduled", label: "Due in X days after fight scheduling" },
  { value: "before_event", label: "Deadline X days before event" },
  {
    value: "after_signed_agreement_approved",
    label: "Due in X days after agreement approval",
  },
];

const reminderCadenceOptions: Array<{
  value: RequirementReminderCadence;
  label: string;
}> = [
  { value: "daily_until_resolved", label: "Daily until resolved" },
  { value: "once_before_due", label: "Once before deadline" },
  { value: "off", label: "No reminder" },
];

export function EventRequirementsPage({
  eventSlug,
  eventId,
  eventName,
  requirements,
}: {
  eventSlug: string;
  eventId?: string;
  eventName: string;
  requirements: EventRequirementRecord[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [deadlineRule, setDeadlineRule] =
    useState<RequirementDueAnchor>("custom_date");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!eventId) {
      showToast({
        title: "Demo events do not save requirements yet.",
        variant: "warning",
      });
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const formData = new FormData(form);
    const dueDate = String(formData.get("dueDate") ?? "").trim();
    const dueOffsetDays = String(formData.get("dueOffsetDays") ?? "").trim();
    const reminderStartDays = Number(
      String(formData.get("reminderDaysBeforeDue") ?? "0"),
    );
    const reminderCadence = String(
      formData.get("reminderCadence") ?? "daily_until_resolved",
    ) as RequirementReminderCadence;
    const dueAnchor = String(
      formData.get("dueAnchor") ?? "custom_date",
    ) as RequirementDueAnchor;

    try {
      const response = await fetch(`/api/v1/events/${eventId}/requirements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: String(formData.get("category") ?? ""),
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          inputType: String(formData.get("inputType") ?? "document"),
          required: formData.get("required") === "on",
          priority: String(formData.get("priority") ?? "medium"),
          dueAnchor,
          dueDate: dueAnchor === "custom_date" ? dueDate || undefined : undefined,
          dueOffsetDays:
            dueAnchor === "custom_date" || !dueOffsetDays
              ? undefined
              : Number(dueOffsetDays),
          reminderEnabled: reminderCadence !== "off",
          reminderCadence,
          reminderDaysBeforeDue:
            reminderStartDays > 0 ? [reminderStartDays] : [0],
          reminderSubject: String(formData.get("reminderSubject") ?? ""),
          reminderMessage: String(formData.get("reminderMessage") ?? ""),
          humanVerificationRequired:
            formData.get("humanVerificationRequired") === "on",
          isSignedAgreement: formData.get("isSignedAgreement") === "on",
          acceptedFileTypes: ["pdf", "jpg", "jpeg", "png"],
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to save requirement.");
      }

      showToast({
        title: "Requirement added successfully.",
        variant: "success",
      });

      form.reset();
      setDeadlineRule("custom_date");
      setIsRequirementModalOpen(false);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save requirement.";
      setFormError(message);
      showToast({
        title: message,
        variant: "error",
      });
    } finally {
      setIsSaving(false);
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
            Required Documents
          </h1>
          <p className="text-lg text-text-body">
            Configure the checklist for {eventName} and reuse it across every fight on the card.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setIsRequirementModalOpen(true);
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-brand px-5 text-[15px] font-medium text-white transition hover:bg-brand-strong"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add requirement</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-8 border-b border-border-subtle">
        <EventTab href={`/dashboard/promoter/events/${eventSlug}`}>Fight Card</EventTab>
        <EventTab href={`/dashboard/promoter/events/${eventSlug}/requirements`} active>
          Required Documents
        </EventTab>
        <EventTab>Human Action</EventTab>
        <EventTab href={`/dashboard/promoter/events/${eventSlug}/post-reminders`}>
          Post Reminders
        </EventTab>
        <EventTab>Event Knowledge</EventTab>
        <EventTab>Communications</EventTab>
      </div>

      {!eventId ? (
        <section className="rounded-[16px] border border-[#ffe3b3] bg-[#fff8ea] px-4 py-3 text-[15px] text-[#a36500]">
          This is a demo event. Requirement creation is enabled automatically once the event
          exists in the database.
        </section>
      ) : null}

      {isRequirementModalOpen ? (
        <FormModal
          title="Add requirement"
          description="Every new fight will inherit this event-level readiness requirement."
          onClose={() => setIsRequirementModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
          {formError ? (
            <div className="rounded-[12px] border border-[#ffc9c9] bg-[#fff2f2] px-4 py-3 text-[15px] text-danger">
              {formError}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <FormField label="Requirement name">
              <input
                name="name"
                type="text"
                placeholder="e.g. Medical Clearance"
                className={inputClassName}
                required
              />
            </FormField>

            <FormField label="Category">
              <select name="category" className={inputClassName} defaultValue="Medical">
                {requirementCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Input type">
              <select name="inputType" className={inputClassName} defaultValue="document">
                {requirementInputTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Priority">
              <select name="priority" className={inputClassName} defaultValue="medium">
                {requirementPriorities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Deadline rule">
              <select
                name="dueAnchor"
                className={inputClassName}
                value={deadlineRule}
                onChange={(event) =>
                  setDeadlineRule(event.target.value as RequirementDueAnchor)
                }
              >
                {deadlineRuleOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            {deadlineRule === "custom_date" ? (
              <FormField label="Exact deadline">
                <input name="dueDate" type="date" className={inputClassName} required />
              </FormField>
            ) : (
              <FormField label="Deadline days">
                <input
                  name="dueOffsetDays"
                  type="number"
                  min="0"
                  defaultValue="3"
                  className={inputClassName}
                  required
                />
              </FormField>
            )}

            <FormField label="Reminder cadence">
              <select
                name="reminderCadence"
                className={inputClassName}
                defaultValue="daily_until_resolved"
              >
                {reminderCadenceOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Start daily reminders">
              <input
                name="reminderDaysBeforeDue"
                type="number"
                min="0"
                defaultValue="3"
                className={inputClassName}
              />
              <p className="text-sm text-text-muted">
                For daily cadence, reminders start this many days before the deadline and
                continue until the item is resolved.
              </p>
            </FormField>
          </div>

          <FormField label="Description (optional)">
            <textarea
              name="description"
              rows={4}
              placeholder="What should the fighter or manager upload here?"
              className={textareaClassName}
            />
          </FormField>

          <div className="grid gap-4 lg:grid-cols-2">
            <FormField label="Reminder email subject (optional)">
              <input
                name="reminderSubject"
                type="text"
                placeholder="e.g. Document reminder"
                className={inputClassName}
              />
            </FormField>

            <FormField label="Reminder email message (optional)">
              <textarea
                name="reminderMessage"
                rows={4}
                placeholder="Share the message managers receive before the due date."
                className={textareaClassName}
              />
            </FormField>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ToggleField
              name="required"
              label="Required for readiness"
              defaultChecked
            />
            <ToggleField
              name="humanVerificationRequired"
              label="Human verification"
            />
            <ToggleField name="isSignedAgreement" label="Signed agreement" />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRequirementModalOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-white px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save requirement"}
            </button>
          </div>
          </form>
        </FormModal>
      ) : null}

      <section className="rounded-[20px] border border-border-subtle bg-panel shadow-[0_10px_24px_rgba(23,32,51,0.03)]">
        <div className="border-b border-border-subtle px-5 py-4">
          <h2 className="text-[20px] font-semibold text-text-strong">Current checklist</h2>
          <p className="mt-1 text-[15px] text-text-body">
            {requirements.length} requirement{requirements.length === 1 ? "" : "s"} configured
            for this event.
          </p>
        </div>

        {requirements.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[19px] font-semibold text-text-strong">
              No requirements configured yet
            </p>
            <p className="mt-2 text-[15px] text-text-body">
              Add your first requirement above and new fights will inherit it automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle text-xs uppercase tracking-[0.18em] text-text-muted">
                  <th className="px-5 py-4 font-semibold">Requirement</th>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Due Date</th>
                  <th className="px-5 py-4 font-semibold">Rules</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement) => (
                  <tr key={requirement.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-5 py-4 align-top">
                      <div className="text-[16px] font-semibold text-text-strong">
                        {requirement.name}
                      </div>
                      <div className="mt-1 text-[14px] text-text-body">
                        {requirement.description?.trim() || "No description added yet."}
                      </div>
                      {requirement.structuredFields.length > 0 ? (
                        <div className="mt-2 text-[13px] text-text-muted">
                          Fields:{" "}
                          {requirement.structuredFields
                            .map((field) => field.label)
                            .join(", ")}
                        </div>
                      ) : null}
                      {requirement.documentBlocks.length > 0 ? (
                        <div className="mt-2 text-[13px] text-text-muted">
                          Document blocks:{" "}
                          {requirement.documentBlocks
                            .map((block) => block.title)
                            .join(", ")}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-[15px] text-text-body">{requirement.category}</td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={requirement.priority} />
                    </td>
                    <td className="px-5 py-4 text-[15px] text-text-body">
                      {buildDeadlineLabel(requirement)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <RuleBadge>{labelForInputType(requirement.inputType)}</RuleBadge>
                        {requirement.required ? <RuleBadge>Required</RuleBadge> : null}
                        {requirement.humanVerificationRequired ? (
                          <RuleBadge>Human review</RuleBadge>
                        ) : null}
                        {requirement.isSignedAgreement ? (
                          <RuleBadge>Signed agreement</RuleBadge>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function EventTab({
  children,
  href,
  active = false,
}: {
  children: ReactNode;
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

function ToggleField({
  name,
  label,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[14px] border border-border-subtle bg-white px-4 py-3 text-[15px] text-text-strong">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand"
      />
      <span>{label}</span>
    </label>
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

function PriorityBadge({ priority }: { priority: RequirementPriority }) {
  const styles =
    priority === "critical"
      ? "border-[#ffcfcf] bg-[#fff4f4] text-[#dc2626]"
      : priority === "high"
        ? "border-[#ffdca8] bg-[#fff8ea] text-[#d97706]"
        : priority === "medium"
          ? "border-[#cedcff] bg-[#f4f7ff] text-[#356ae6]"
          : "border-border-subtle bg-panel-muted text-text-body";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>
      {capitalize(priority)}
    </span>
  );
}

function RuleBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-panel-muted px-3 py-1 text-xs font-medium text-text-body">
      {children}
    </span>
  );
}

function FormModal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0f172a]/40 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[22px] border border-border-subtle bg-panel shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-[20px] font-semibold text-text-strong">{title}</h2>
            <p className="mt-1 text-[15px] text-text-body">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-muted transition hover:bg-panel-muted hover:text-text-strong"
            aria-label="Close modal"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function labelForInputType(inputType: EventRequirementInputType) {
  return requirementInputTypes.find((item) => item.value === inputType)?.label ?? inputType;
}

function buildDeadlineLabel(requirement: EventRequirementRecord) {
  if (requirement.dueAnchor === "custom_date") {
    return requirement.dueDate
      ? `Exact deadline ${requirement.dueDate.slice(0, 10)}`
      : "Exact deadline not set";
  }

  const days = requirement.dueOffsetDays;

  if (typeof days !== "number") {
    return requirement.dueDate ? requirement.dueDate.slice(0, 10) : "No deadline";
  }

  if (requirement.dueAnchor === "before_event") {
    return `${days} day${days === 1 ? "" : "s"} before event`;
  }

  if (requirement.dueAnchor === "after_fight_scheduled") {
    return `${days} day${days === 1 ? "" : "s"} after fight scheduling`;
  }

  if (requirement.dueAnchor === "after_invite_accepted") {
    return `${days} day${days === 1 ? "" : "s"} after invite acceptance`;
  }

  return `${days} day${days === 1 ? "" : "s"} after agreement approval`;
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

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
