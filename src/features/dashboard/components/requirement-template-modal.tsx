"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type {
  EventRequirementInputType,
  EventRequirementRecord,
  RequirementDueAnchor,
  RequirementPriority,
  RequirementReminderCadence,
  RequirementTemplateRecord,
} from "@/types/readiness";

const templateCategories = [
  "Legal",
  "Medical",
  "Insurance",
  "Travel",
  "Media",
  "Operations",
] as const;

const templateInputTypes: Array<{
  value: EventRequirementInputType;
  label: string;
}> = [
  { value: "document", label: "Document upload" },
  { value: "text", label: "Text / Information Field" },
  { value: "date", label: "Date Field" },
  { value: "number", label: "Number Field" },
  { value: "choice", label: "Choice Field" },
  { value: "confirmation", label: "Confirmation" },
];

const templatePriorities: Array<{
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
  availableInTemplate?: boolean;
}> = [
  {
    value: "custom_date",
    label: "Use exact deadline date",
    availableInTemplate: false,
  },
  {
    value: "before_event",
    label: "Deadline X days before event",
    availableInTemplate: true,
  },
  {
    value: "after_invite_accepted",
    label: "Due in X days after invite acceptance",
    availableInTemplate: true,
  },
  {
    value: "after_fight_scheduled",
    label: "Due in X days after fight scheduling",
    availableInTemplate: true,
  },
  {
    value: "after_signed_agreement_approved",
    label: "Due in X days after agreement approval",
    availableInTemplate: true,
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

export type RequirementTemplateModalMode =
  | "template"
  | "create-event"
  | "event-requirement";

export type RequirementTemplateModalPayload = {
  name: string;
  category: string;
  inputType: EventRequirementInputType;
  priority: RequirementPriority;
  dueAnchor: RequirementDueAnchor;
  dueDate?: string;
  dueOffsetDays?: number;
  dueDaysBeforeEvent?: number;
  reminderEnabled: boolean;
  reminderCadence: RequirementReminderCadence;
  reminderDaysBeforeDue: number[];
  description: string;
  required: boolean;
  humanVerificationRequired: boolean;
  isSignedAgreement: boolean;
  acceptedFileTypes: string[];
  saveAsDefault?: boolean;
};

export function RequirementTemplateModal({
  isOpen,
  mode,
  editingItem,
  isSubmitting = false,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: RequirementTemplateModalMode;
  editingItem?: RequirementTemplateRecord | EventRequirementRecord | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: RequirementTemplateModalPayload) => Promise<void> | void;
}) {
  const isEditing = Boolean(editingItem);

  const initialDueAnchor =
    editingItem?.dueAnchor ??
    (mode === "event-requirement" ? "custom_date" : "before_event");

  const [dueAnchor, setDueAnchor] = useState<RequirementDueAnchor>(initialDueAnchor);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalTitle = isEditing
    ? mode === "event-requirement"
      ? "Edit requirement"
      : "Edit template"
    : mode === "event-requirement"
      ? "Add requirement"
      : mode === "create-event"
        ? "Add template"
        : "Add template";

  const modalDescription =
    mode === "template"
      ? "These defaults will auto-populate new events when they are created."
      : mode === "create-event"
        ? "Create a reusable requirement and select it for this event."
        : "Every fight on this event card will inherit this readiness requirement.";

  const availableRules = deadlineRuleOptions.filter(
    (option) => mode === "event-requirement" || option.availableInTemplate,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "Legal");
    const inputType = String(
      formData.get("inputType") ?? "document",
    ) as EventRequirementInputType;
    const priority = String(
      formData.get("priority") ?? "medium",
    ) as RequirementPriority;
    const dueAnchorValue = String(
      formData.get("dueAnchor") ?? initialDueAnchor,
    ) as RequirementDueAnchor;
    const dueDate = String(formData.get("dueDate") ?? "").trim();
    const dueOffsetDaysValue = String(formData.get("dueOffsetDays") ?? "").trim();
    const dueOffsetDays = dueOffsetDaysValue ? Number(dueOffsetDaysValue) : undefined;
    const reminderCadence = String(
      formData.get("reminderCadence") ?? "daily_until_resolved",
    ) as RequirementReminderCadence;
    const reminderDaysValue = String(formData.get("reminderDaysBeforeDue") ?? "").trim();
    const reminderDaysBeforeDue = reminderDaysValue ? [Number(reminderDaysValue)] : [];
    const description = String(formData.get("description") ?? "").trim();
    const required = formData.get("required") === "on";
    const humanVerificationRequired = formData.get("humanVerificationRequired") === "on";
    const isSignedAgreement = formData.get("isSignedAgreement") === "on";
    const saveAsDefault = formData.get("saveAsDefault") === "on";

    const payload: RequirementTemplateModalPayload = {
      name,
      category,
      inputType,
      priority,
      dueAnchor: dueAnchorValue,
      dueDate: dueAnchorValue === "custom_date" ? dueDate || undefined : undefined,
      dueOffsetDays: dueAnchorValue === "custom_date" ? undefined : dueOffsetDays,
      dueDaysBeforeEvent:
        dueAnchorValue === "before_event" ? dueOffsetDays : undefined,
      reminderEnabled: reminderCadence !== "off",
      reminderCadence,
      reminderDaysBeforeDue,
      description,
      required,
      humanVerificationRequired,
      isSignedAgreement,
      acceptedFileTypes: inputType === "document" ? ["pdf", "jpg", "jpeg", "png"] : [],
      saveAsDefault,
    };

    await onSubmit(payload);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--overlay)] px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[22px] border border-border-subtle bg-panel shadow-[var(--shadow-overlay)]">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5">
          <div>
            <h2 className="text-[22px] font-semibold text-text-strong">{modalTitle}</h2>
            <p className="mt-1 text-[15px] text-text-body">{modalDescription}</p>
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

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label="Requirement name" required>
              <input
                name="name"
                type="text"
                defaultValue={editingItem?.name ?? ""}
                placeholder="e.g. Medical Clearance"
                className={inputClassName}
                required
              />
            </FormField>

            <FormField label="Category" required>
              <select
                name="category"
                defaultValue={editingItem?.category ?? "Legal"}
                className={inputClassName}
              >
                {templateCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Input type" required>
              <select
                name="inputType"
                defaultValue={editingItem?.inputType ?? "document"}
                className={inputClassName}
              >
                {templateInputTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Priority" required>
              <select
                name="priority"
                defaultValue={editingItem?.priority ?? "medium"}
                className={inputClassName}
              >
                {templatePriorities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Deadline rule" required>
              <select
                name="dueAnchor"
                value={dueAnchor}
                onChange={(event) =>
                  setDueAnchor(event.target.value as RequirementDueAnchor)
                }
                className={inputClassName}
              >
                {availableRules.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            {dueAnchor === "custom_date" ? (
              <FormField label="Exact deadline" required>
                <input
                  name="dueDate"
                  type="date"
                  defaultValue={
                    editingItem && "dueDate" in editingItem && editingItem.dueDate
                      ? String(editingItem.dueDate).slice(0, 10)
                      : ""
                  }
                  className={inputClassName}
                  required
                />
              </FormField>
            ) : (
              <FormField label="Deadline days" required>
                <input
                  name="dueOffsetDays"
                  type="number"
                  min="0"
                  defaultValue={
                    editingItem?.dueOffsetDays ??
                    ("dueDaysBeforeEvent" in (editingItem ?? {})
                      ? (editingItem as RequirementTemplateRecord).dueDaysBeforeEvent ?? 3
                      : 3)
                  }
                  placeholder="3"
                  className={inputClassName}
                  required
                />
              </FormField>
            )}

            <FormField label="Reminder cadence" required>
              <select
                name="reminderCadence"
                defaultValue={editingItem?.reminderCadence ?? "daily_until_resolved"}
                className={inputClassName}
              >
                {reminderCadenceOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Start daily reminders (days before due)">
              <input
                name="reminderDaysBeforeDue"
                type="number"
                min="0"
                defaultValue={editingItem?.reminderDaysBeforeDue?.[0] ?? 3}
                placeholder="3"
                className={inputClassName}
              />
              <p className="text-xs text-text-muted">
                Reminders trigger automatically before the deadline and stop when resolved.
              </p>
            </FormField>
          </div>

          <FormField label="Description (optional)">
            <textarea
              name="description"
              rows={3}
              defaultValue={editingItem?.description ?? ""}
              placeholder="Provide instructions for what needs to be submitted or confirmed."
              className={textareaClassName}
            />
          </FormField>

          <div className="grid gap-3 md:grid-cols-3">
            <ToggleOption
              name="required"
              label="Required for readiness"
              defaultChecked={editingItem?.required ?? true}
            />
            <ToggleOption
              name="humanVerificationRequired"
              label="Human verification"
              defaultChecked={editingItem?.humanVerificationRequired ?? false}
            />
            <ToggleOption
              name="isSignedAgreement"
              label="Signed agreement"
              defaultChecked={editingItem?.isSignedAgreement ?? false}
            />
          </div>

          {mode === "create-event" ? (
            <ToggleOption
              name="saveAsDefault"
              label="Also add to default promoter templates"
              defaultChecked={false}
            />
          ) : mode === "event-requirement" && !isEditing ? (
            <ToggleOption
              name="saveAsDefault"
              label="Also save as a default template for future events"
              defaultChecked={false}
            />
          ) : null}

          <div className="flex justify-end gap-3 border-t border-border-subtle pt-5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Update"
                  : mode === "event-requirement"
                    ? "Save requirement"
                    : "Create template"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
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

function ToggleOption({
  name,
  label,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[12px] border border-border-subtle bg-panel px-4 py-3 text-[15px] text-text-strong">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border-subtle text-brand focus:ring-brand accent-[var(--brand)]"
      />
      <span>{label}</span>
    </label>
  );
}

const inputClassName =
  "h-11 w-full rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

const textareaClassName =
  "w-full rounded-[12px] border border-border-subtle bg-panel px-4 py-3 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

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
