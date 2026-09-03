"use client";

import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [templateState, setTemplateState] = useState(initialTemplates);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
    phone: user.profile.phone ?? "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const editingTemplate =
    templateState.find((template) => template.id === editingTemplateId) ?? null;

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const response = await fetch("/api/v1/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone.trim() || null,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to update account details.");
      }

      const updatedUser = result.data.user as SafeAuthUser;
      setProfile({
        firstName: updatedUser.profile.firstName,
        lastName: updatedUser.profile.lastName,
        phone: updatedUser.profile.phone ?? "",
      });
      showToast({
        title: "Account details saved successfully.",
        variant: "success",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update account details.";
      setProfileError(message);
      showToast({ title: message, variant: "error" });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsChangingPassword(true);
    setPasswordError(null);

    try {
      const response = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: String(formData.get("currentPassword") ?? ""),
          newPassword: String(formData.get("newPassword") ?? ""),
          confirmPassword: String(formData.get("confirmPassword") ?? ""),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Unable to change password.");
      }

      form.reset();
      showToast({
        title: "Password updated successfully.",
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change password.";
      setPasswordError(message);
      showToast({ title: message, variant: "error" });
    } finally {
      setIsChangingPassword(false);
    }
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

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-strong sm:text-[40px]">
          Settings
        </h1>
        <p className="text-lg text-text-body">
          Manage your promoter account and reusable event readiness rules.
        </p>
      </div>

      <SettingsCard
        title="Account"
        description="Manage your promoter profile, contact details, and sign-in credentials."
      >
        <div className="space-y-8">
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {profileError ? (
              <div className="rounded-[12px] border border-danger-border bg-danger-surface px-4 py-3 text-[15px] text-danger">
                {profileError}
              </div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-2">
              <SettingsField label="First name">
                <input
                  name="firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, firstName: event.target.value }))
                  }
                  autoComplete="given-name"
                  className={inputClassName}
                  required
                />
              </SettingsField>
              <SettingsField label="Last name">
                <input
                  name="lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, lastName: event.target.value }))
                  }
                  autoComplete="family-name"
                  className={inputClassName}
                  required
                />
              </SettingsField>
            </div>

            <SettingsField label="Email">
              <input
                type="email"
                value={user.email}
                readOnly
                className={`${inputClassName} bg-panel-muted text-text-muted`}
              />
              <p className="text-sm text-text-muted">
                This is your login email and cannot be changed here.
              </p>
            </SettingsField>

            <div className="space-y-3 rounded-[14px] border border-border-subtle bg-panel-muted p-4">
              <div>
                <h3 className="text-[18px] font-semibold text-text-strong">Optional contact</h3>
                <p className="text-sm text-text-muted">
                  Add a phone number for operational contact when needed.
                </p>
              </div>
              <SettingsField label="Phone (optional)">
                <input
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, phone: event.target.value }))
                  }
                  autoComplete="tel"
                  placeholder="e.g. +971 50 123 4567"
                  className={inputClassName}
                />
              </SettingsField>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setProfile({
                    firstName: user.profile.firstName,
                    lastName: user.profile.lastName,
                    phone: user.profile.phone ?? "",
                  });
                  setProfileError(null);
                }}
                className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfile ? "Saving..." : "Save account details"}
              </button>
            </div>
          </form>

          <div className="border-t border-border-subtle pt-8">
            <div className="space-y-1">
              <h3 className="text-[18px] font-semibold text-text-strong">Password</h3>
              <p className="text-sm text-text-muted">Update your sign-in password.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-5">
              {passwordError ? (
                <div className="rounded-[12px] border border-danger-border bg-danger-surface px-4 py-3 text-[15px] text-danger">
                  {passwordError}
                </div>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-3">
                <SettingsField label="Current password">
                  <input
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    className={inputClassName}
                    required
                  />
                </SettingsField>
                <SettingsField label="New password">
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    className={inputClassName}
                    required
                  />
                </SettingsField>
                <SettingsField label="Confirm new password">
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={inputClassName}
                    required
                  />
                </SettingsField>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="reset"
                  onClick={() => setPasswordError(null)}
                  className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border-subtle bg-panel px-5 text-[15px] font-medium text-text-strong transition hover:bg-panel-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex h-10 items-center justify-center rounded-[10px] bg-brand px-5 text-[15px] font-medium text-text-inverse transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isChangingPassword ? "Updating..." : "Change password"}
                </button>
              </div>
            </form>
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
  const formatted = value.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
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
