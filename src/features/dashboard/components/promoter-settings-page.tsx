"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import { useToast } from "@/providers/toast-provider";
import type { SafeAuthUser } from "@/types/auth";
import type {
  EventRequirementInputType,
  RequirementDueAnchor,
  RequirementPriority,
  RequirementReminderCadence,
  RequirementTemplateRecord,
} from "@/types/readiness";

const notificationDefaults = [
  {
    key: "missing-docs",
    title: "Missing document alerts",
    description: "Notify when a fighter's required document is overdue.",
  },
  {
    key: "human-action",
    title: "Human Action alerts",
    description: "Notify when a case is escalated for human review.",
  },
  {
    key: "event-reminders",
    title: "Event reminders",
    description: "Reminders for upcoming event deadlines.",
  },
  {
    key: "email-notifications",
    title: "Email notifications",
    description: "Send all alerts to your contact email.",
  },
];

const reviewTypes = [
  "Signed Contracts",
  "Medical Clearance",
  "Insurance Certificates",
  "Passports / ID",
];

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
  { value: "document", label: "Document Upload" },
  { value: "text", label: "Information Field" },
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

const dueAnchorOptions: Array<{
  value: RequirementDueAnchor;
  label: string;
}> = [
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
  { value: "once_before_due", label: "Once before due date" },
  { value: "off", label: "No reminder" },
];

export function PromoterSettingsPage({
  user,
  initialTemplates,
}: {
  user: SafeAuthUser;
  initialTemplates: RequirementTemplateRecord[];
}) {
  const { showToast } = useToast();
  const [templateState, setTemplateState] = useState(initialTemplates);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "missing-docs": true,
    "human-action": true,
    "event-reminders": true,
    "email-notifications": true,
  });
  const [aiVerificationEnabled, setAiVerificationEnabled] = useState(true);
  const [reviewSelections, setReviewSelections] = useState<string[]>([
    "Signed Contracts",
    "Medical Clearance",
  ]);

  const displayName =
    user.profile.displayName || `${user.profile.firstName} ${user.profile.lastName}`;
  const editingTemplate =
    templateState.find((template) => template.id === editingTemplateId) ?? null;

  function handleSave(message: string) {
    showToast({
      title: message,
      variant: "success",
    });
  }

  async function handleTemplateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const templateId = String(formData.get("templateId") ?? "");

    setIsSubmittingTemplate(true);
    setTemplateError(null);

    try {
      const dueDaysValue = String(formData.get("dueDaysBeforeEvent") ?? "").trim();
      const dueOffsetDaysValue = String(formData.get("dueOffsetDays") ?? "").trim();
      const reminderDaysValue = String(formData.get("reminderDaysBeforeDue") ?? "").trim();
      const dueAnchor = String(
        formData.get("dueAnchor") ?? "before_event",
      ) as RequirementDueAnchor;
      const reminderCadence = String(
        formData.get("reminderCadence") ?? "daily_until_resolved",
      ) as RequirementReminderCadence;
      const dueOffsetDays = dueOffsetDaysValue
        ? Number(dueOffsetDaysValue)
        : dueDaysValue
          ? Number(dueDaysValue)
          : undefined;

      const payload = {
        category: String(formData.get("category") ?? ""),
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        inputType: String(formData.get("inputType") ?? "document"),
        required: formData.get("required") === "on",
        priority: String(formData.get("priority") ?? "medium"),
        dueAnchor,
        dueOffsetDays,
        dueDaysBeforeEvent: dueAnchor === "before_event" ? dueOffsetDays : undefined,
        reminderEnabled: reminderCadence !== "off",
        reminderCadence,
        reminderDaysBeforeDue: reminderDaysValue ? [Number(reminderDaysValue)] : [],
        reminderSubject: String(formData.get("reminderSubject") ?? ""),
        reminderMessage: String(formData.get("reminderMessage") ?? ""),
        structuredFields: editingTemplate?.structuredFields ?? [],
        humanVerificationRequired: formData.get("humanVerificationRequired") === "on",
        isSignedAgreement: formData.get("isSignedAgreement") === "on",
        acceptedFileTypes:
          String(formData.get("inputType") ?? "document") === "document"
            ? ["pdf", "jpg", "jpeg", "png"]
            : [],
      };

      const response = await fetch(
        templateId
          ? `/api/v1/requirement-templates/${templateId}`
          : "/api/v1/requirement-templates",
        {
          method: templateId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message ?? "Unable to save requirement template.",
        );
      }

      const nextTemplate = result.data.template as RequirementTemplateRecord;

      setTemplateState((current) =>
        templateId
          ? current.map((template) =>
              template.id === templateId ? nextTemplate : template,
            )
          : [...current, nextTemplate].sort(
              (left, right) => left.sortOrder - right.sortOrder,
            ),
      );

      setEditingTemplateId(null);
      setIsTemplateModalOpen(false);
      form.reset();

      showToast({
        title: templateId
          ? "Requirement template updated."
          : "Requirement template created.",
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save requirement template.";

      setTemplateError(message);
      showToast({
        title: message,
        variant: "error",
      });
    } finally {
      setIsSubmittingTemplate(false);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    try {
      const response = await fetch(`/api/v1/requirement-templates/${templateId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to delete template.");
      }

      setTemplateState((current) =>
        current.filter((template) => template.id !== templateId),
      );

      if (editingTemplateId === templateId) {
        setEditingTemplateId(null);
        setIsTemplateModalOpen(false);
      }

      showToast({
        title: "Requirement template removed.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to delete template.",
        variant: "error",
      });
    }
  }

  async function handleQuickToggle(
    templateId: string,
    field: "required" | "humanVerificationRequired",
    value: boolean,
  ) {
    try {
      const response = await fetch(`/api/v1/requirement-templates/${templateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: value,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to update template.");
      }

      const nextTemplate = result.data.template as RequirementTemplateRecord;
      setTemplateState((current) =>
        current.map((template) =>
          template.id === templateId ? nextTemplate : template,
        ),
      );
    } catch (error) {
      showToast({
        title: error instanceof Error ? error.message : "Unable to update template.",
        variant: "error",
      });
    }
  }

  function toggleNotification(key: string) {
    setNotifications((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleReviewType(type: string) {
    setReviewSelections((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  }

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Settings
        </h1>
        <p className="text-lg text-text-body">
          Configure your workspace defaults and event readiness rules.
        </p>
      </div>

      <SettingsCard
        title="Organization"
        description="Basic promotion information shown across the workspace."
        footer={
          <>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave("Organization settings saved successfully.")}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong"
            >
              Save changes
            </button>
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[96px_1fr]">
          <UploadSlot />
          <div className="space-y-5">
            <SettingsField label="Promotion name">
              <input
                type="text"
                defaultValue="Desert Strike Promotions"
                className={inputClassName}
              />
            </SettingsField>

            <div className="grid gap-5 lg:grid-cols-2">
              <SettingsField label="Contact email">
                <input type="email" defaultValue={user.email} className={inputClassName} />
              </SettingsField>
              <SettingsField label="Contact phone (optional)">
                <input
                  type="text"
                  defaultValue="+971 50 123 4567"
                  className={inputClassName}
                />
              </SettingsField>
            </div>

            <SettingsField label="Organization information">
              <textarea
                rows={3}
                placeholder="Short description, location, season..."
                className={textareaClassName}
              />
            </SettingsField>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Account"
        description="Your personal account and sign-in credentials."
      >
        <div className="grid gap-6 lg:grid-cols-[64px_1fr]">
          <ProfileUploadSlot />
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <SettingsField label="Name">
                <input type="text" defaultValue={displayName} className={inputClassName} />
              </SettingsField>
              <SettingsField label="Email">
                <input type="email" defaultValue={user.email} className={inputClassName} />
              </SettingsField>
            </div>

            <div className="space-y-1">
              <h3 className="text-[18px] font-semibold text-text-strong">Password</h3>
              <p className="text-sm text-text-muted">Update your sign-in password.</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <SettingsField label="Current password">
                <input type="password" className={inputClassName} />
              </SettingsField>
              <SettingsField label="New password">
                <input type="password" className={inputClassName} />
              </SettingsField>
              <SettingsField label="Confirm new">
                <input type="password" className={inputClassName} />
              </SettingsField>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSave("Password updated successfully.")}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
              >
                Change password
              </button>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Requirement Templates"
        description="Reusable readiness rules that are applied automatically to every new event."
      >
        <div className="space-y-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setEditingTemplateId(null);
                setTemplateError(null);
                setIsTemplateModalOpen(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-brand px-4 text-sm font-medium text-text-inverse transition hover:bg-brand-strong"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Template</span>
            </button>
          </div>

          {isTemplateModalOpen ? (
            <FormModal
              title={editingTemplate ? "Edit template" : "Add template"}
              description="These defaults will auto-populate new events when they are created."
              onClose={() => {
                setEditingTemplateId(null);
                setTemplateError(null);
                setIsTemplateModalOpen(false);
              }}
            >
              <form
                onSubmit={handleTemplateSubmit}
                className="space-y-4"
          >
            {templateError ? (
              <div className="rounded-[12px] border border-danger-border bg-danger-surface px-4 py-3 text-[15px] text-danger">
                {templateError}
              </div>
            ) : null}

            <input name="templateId" type="hidden" value={editingTemplate?.id ?? ""} />

            <div className="grid gap-4 lg:grid-cols-2">
              <SettingsField label="Template name">
                <input
                  key={`name-${editingTemplate?.id ?? "new"}`}
                  name="name"
                  type="text"
                  defaultValue={editingTemplate?.name ?? ""}
                  placeholder="e.g. Passport / ID"
                  className={inputClassName}
                  required
                />
              </SettingsField>

              <SettingsField label="Category">
                <select
                  key={`category-${editingTemplate?.id ?? "new"}`}
                  name="category"
                  defaultValue={editingTemplate?.category ?? "Legal"}
                  className={inputClassName}
                >
                  {templateCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </SettingsField>

              <SettingsField label="Input type">
                <select
                  key={`inputType-${editingTemplate?.id ?? "new"}`}
                  name="inputType"
                  defaultValue={editingTemplate?.inputType ?? "document"}
                  className={inputClassName}
                >
                  {templateInputTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </SettingsField>

              <SettingsField label="Priority">
                <select
                  key={`priority-${editingTemplate?.id ?? "new"}`}
                  name="priority"
                  defaultValue={editingTemplate?.priority ?? "medium"}
                  className={inputClassName}
                >
                  {templatePriorities.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </SettingsField>

              <SettingsField label="Deadline rule">
                <select
                  key={`due-anchor-${editingTemplate?.id ?? "new"}`}
                  name="dueAnchor"
                  defaultValue={editingTemplate?.dueAnchor ?? "before_event"}
                  className={inputClassName}
                >
                  {dueAnchorOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </SettingsField>

              <SettingsField label="Deadline days">
                <input
                  key={`due-offset-${editingTemplate?.id ?? "new"}`}
                  name="dueOffsetDays"
                  type="number"
                  min="0"
                  defaultValue={
                    editingTemplate?.dueOffsetDays ??
                    editingTemplate?.dueDaysBeforeEvent ??
                    ""
                  }
                  className={inputClassName}
                />
              </SettingsField>

              <SettingsField label="Reminder cadence">
                <select
                  key={`reminder-cadence-${editingTemplate?.id ?? "new"}`}
                  name="reminderCadence"
                  defaultValue={
                    editingTemplate?.reminderCadence ?? "daily_until_resolved"
                  }
                  className={inputClassName}
                >
                  {reminderCadenceOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </SettingsField>

              <SettingsField label="Start daily reminders">
                <input
                  key={`reminder-${editingTemplate?.id ?? "new"}`}
                  name="reminderDaysBeforeDue"
                  type="number"
                  min="0"
                  defaultValue={editingTemplate?.reminderDaysBeforeDue[0] ?? ""}
                  placeholder="0"
                  className={inputClassName}
                />
                <p className="text-sm text-text-muted">
                  Daily reminders begin this many days before the deadline and stop once the
                  requirement is resolved.
                </p>
              </SettingsField>
            </div>

            <SettingsField label="Description (optional)">
              <textarea
                key={`description-${editingTemplate?.id ?? "new"}`}
                name="description"
                rows={3}
                defaultValue={editingTemplate?.description ?? ""}
                placeholder="Describe what needs to be submitted or confirmed."
                className={textareaClassName}
              />
            </SettingsField>

            <div className="grid gap-4 lg:grid-cols-2">
              <SettingsField label="Reminder email subject (optional)">
                <input
                  key={`subject-${editingTemplate?.id ?? "new"}`}
                  name="reminderSubject"
                  type="text"
                  defaultValue={editingTemplate?.reminderSubject ?? ""}
                  placeholder="e.g. Medical clearance reminder"
                  className={inputClassName}
                />
              </SettingsField>

              <SettingsField label="Reminder email message (optional)">
                <textarea
                  key={`message-${editingTemplate?.id ?? "new"}`}
                  name="reminderMessage"
                  rows={3}
                  defaultValue={editingTemplate?.reminderMessage ?? ""}
                  placeholder="Write the reminder message sent to the manager."
                  className={textareaClassName}
                />
              </SettingsField>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InlineCheckbox
                key={`required-${editingTemplate?.id ?? "new"}`}
                name="required"
                label="Required"
                defaultChecked={editingTemplate?.required ?? true}
              />
              <InlineCheckbox
                key={`human-${editingTemplate?.id ?? "new"}`}
                name="humanVerificationRequired"
                label="Human verify"
                defaultChecked={editingTemplate?.humanVerificationRequired ?? false}
              />
              <InlineCheckbox
                key={`agreement-${editingTemplate?.id ?? "new"}`}
                name="isSignedAgreement"
                label="Signed agreement"
                defaultChecked={editingTemplate?.isSignedAgreement ?? false}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingTemplate}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-brand px-4 text-sm font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon className="h-4 w-4" />
                <span>
                  {isSubmittingTemplate
                    ? "Saving..."
                    : editingTemplate
                      ? "Update Template"
                      : "Add Template"}
                </span>
              </button>
            </div>
              </form>
            </FormModal>
          ) : null}

          <div className="space-y-3">
            {templateState.map((template) => (
              <div
                key={template.id}
                className="flex flex-col gap-4 rounded-[14px] border border-border-subtle bg-panel px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[18px] font-semibold text-text-strong">
                      {template.name}
                    </span>
                    <InfoTag tone="info">{labelForInputType(template.inputType)}</InfoTag>
                    <InfoTag tone={template.priority === "critical" ? "critical" : "high"}>
                      {capitalize(template.priority)}
                    </InfoTag>
                  </div>
                  <p className="text-sm text-text-muted">{buildScheduleLabel(template)}</p>
                  {template.structuredFields.length > 0 ? (
                    <p className="text-sm text-text-muted">
                      Fields:{" "}
                      {template.structuredFields.map((field) => field.label).join(", ")}
                    </p>
                  ) : null}
                  {template.documentBlocks.length > 0 ? (
                    <p className="text-sm text-text-muted">
                      Document blocks:{" "}
                      {template.documentBlocks.map((block) => block.title).join(", ")}
                    </p>
                  ) : null}
                  <p className="text-sm text-text-muted">
                    {template.description?.trim() || "No description added yet."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-5 lg:justify-end">
                  <ToggleField
                    label="Required"
                    checked={template.required}
                    onToggle={() =>
                      handleQuickToggle(template.id, "required", !template.required)
                    }
                  />
                  <ToggleField
                    label="Human verify"
                    checked={template.humanVerificationRequired}
                    onToggle={() =>
                      handleQuickToggle(
                        template.id,
                        "humanVerificationRequired",
                        !template.humanVerificationRequired,
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplateId(template.id);
                      setTemplateError(null);
                      setIsTemplateModalOpen(true);
                    }}
                    className="rounded-full p-2 text-text-muted transition hover:bg-panel-muted hover:text-text-strong"
                    aria-label="Edit template"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="rounded-full p-2 text-text-muted transition hover:bg-panel-muted hover:text-danger"
                    aria-label="Delete template"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {templateState.length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-border-strong bg-panel px-4 py-8 text-center">
                <p className="text-[18px] font-semibold text-text-strong">
                  No templates configured
                </p>
                <p className="mt-2 text-sm text-text-muted">
                  Add your first template and it will be copied into every new event.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Notification Preferences"
        description="Choose which operational alerts you receive."
        footer={
          <>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave("Notification preferences saved successfully.")}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong"
            >
              Save changes
            </button>
          </>
        }
      >
        <div className="divide-y divide-border-subtle">
          {notificationDefaults.map((item) => (
            <div
              key={item.key}
              className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="text-[18px] font-medium text-text-strong">{item.title}</p>
                <p className="text-sm text-text-muted">{item.description}</p>
              </div>

              <ToggleSwitch
                checked={notifications[item.key]}
                onToggle={() => toggleNotification(item.key)}
              />
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        title="AI Verification Preferences"
        description="How the AI verifies documents and handles uncertain results."
        footer={
          <>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave("AI verification settings saved successfully.")}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong"
            >
              Save changes
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-[14px] border border-border-subtle bg-panel px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[18px] font-medium text-text-strong">
                Automatic document verification
              </p>
              <p className="text-sm text-text-muted">
                Let the AI read and accept documents that match expected fields.
              </p>
            </div>

            <ToggleSwitch
              checked={aiVerificationEnabled}
              onToggle={() => setAiVerificationEnabled((value) => !value)}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-[18px] font-semibold text-text-strong">
              Documents requiring human review
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {reviewTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-3 rounded-[12px] border border-border-subtle bg-panel px-4 py-3 text-[15px] text-text-body"
                >
                  <input
                    type="checkbox"
                    checked={reviewSelections.includes(type)}
                    onChange={() => toggleReviewType(type)}
                    className="h-4 w-4 rounded border-border-strong accent-[var(--brand)]"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <SettingsField label="Low-confidence review handling">
            <div className="relative">
              <select defaultValue="Escalate to Human Action" className={inputClassName}>
                <option>Escalate to Human Action</option>
                <option>Mark as under review</option>
                <option>Request re-upload automatically</option>
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">
              Applied when the AI is not confident enough to accept a document automatically.
            </p>
          </SettingsField>
        </div>
      </SettingsCard>
    </main>
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

function labelForDueAnchor(anchor: RequirementDueAnchor) {
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

function labelForInputType(inputType: EventRequirementInputType) {
  return templateInputTypes.find((item) => item.value === inputType)?.label ?? inputType;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function SettingsCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-border-subtle bg-panel shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-4 border-b border-border-subtle px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-text-strong">{title}</h2>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
      </div>

      <div className="p-5">{children}</div>

      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border-subtle px-5 py-4">
          {footer}
        </div>
      ) : null}
    </section>
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--overlay)] px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[22px] border border-border-subtle bg-panel shadow-[var(--shadow-overlay)]">
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

function SettingsField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const isOptional = label.toLowerCase().includes("optional");

  return (
    <label className="flex flex-col gap-2">
      <span className="text-[15px] font-semibold text-text-strong">
        {label}
        {!isOptional ? <span className="ml-1 text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function InlineCheckbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[12px] border border-border-subtle bg-panel px-4 py-3 text-[15px] text-text-body">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border-strong accent-[var(--brand)]"
      />
      <span>{label}</span>
    </label>
  );
}

function UploadSlot() {
  return (
    <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[14px] border border-dashed border-border-strong bg-panel-muted text-text-muted">
      <UploadIcon className="h-4 w-4" />
    </div>
  );
}

function ProfileUploadSlot() {
  return (
    <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full border border-dashed border-border-strong bg-panel-muted text-text-muted">
      <UploadIcon className="h-4 w-4" />
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <ToggleSwitch checked={checked} onToggle={onToggle} />
      <span className="text-sm text-text-body">{label}</span>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? "bg-brand" : "bg-border-strong"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-panel shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function InfoTag({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "info" | "critical" | "high";
}) {
  const styles =
    tone === "critical"
      ? "border-danger-border bg-danger-surface text-danger"
      : tone === "high"
        ? "border-warning-border bg-warning-surface text-warning"
        : "border-brand-border bg-brand-surface-muted text-brand";

  return (
    <span className={`inline-flex rounded-[8px] border px-2 py-1 text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
}

const inputClassName =
  "h-11 w-full rounded-[12px] border border-border-subtle bg-panel px-4 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

const textareaClassName =
  "w-full rounded-[12px] border border-border-subtle bg-panel px-4 py-3 text-[15px] text-text-strong outline-none transition placeholder:text-text-muted focus:border-brand";

function UploadIcon({ className }: { className?: string }) {
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
      <path d="M12 16V6" />
      <path d="m8 10 4-4 4 4" />
      <path d="M5 18h14" />
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
      strokeWidth="2"
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

function EditIcon({ className }: { className?: string }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6" />
      <path d="M19 6l-1 13a1.8 1.8 0 0 1-1.8 1.7H7.8A1.8 1.8 0 0 1 6 19L5 6" />
      <path d="M10 10v6" />
      <path d="M14 10v6" />
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
