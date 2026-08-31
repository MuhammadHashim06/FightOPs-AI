import type {
  CreateEventRequirementInput,
  CreateRequirementTemplateInput,
  RequirementDocumentBlock,
  RequirementStructuredField,
  RequirementPriority,
  RequirementDueAnchor,
  RequirementReminderCadence,
} from "@/types/readiness";

const requirementPriorities: RequirementPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
];

const inputTypes = [
  "document",
  "text",
  "date",
  "number",
  "choice",
  "confirmation",
] as const;

const dueAnchors: RequirementDueAnchor[] = [
  "custom_date",
  "before_event",
  "after_fight_scheduled",
  "after_invite_accepted",
  "after_signed_agreement_approved",
];

const reminderCadences: RequirementReminderCadence[] = [
  "daily_until_resolved",
  "once_before_due",
  "off",
];

export function validateCreateEventRequirementInput(
  input: CreateEventRequirementInput,
) {
  if (!input.category.trim()) {
    throw new Error("Requirement category is required.");
  }

  if (!input.name.trim() || input.name.trim().length < 2) {
    throw new Error("Requirement name must be at least 2 characters.");
  }

  if (!inputTypes.includes(input.inputType)) {
    throw new Error("A valid requirement input type is required.");
  }

  if (!requirementPriorities.includes(input.priority)) {
    throw new Error("A valid requirement priority is required.");
  }

  if (typeof input.dueDate !== "undefined" && input.dueDate.trim()) {
    const parsed = new Date(input.dueDate);

    if (Number.isNaN(parsed.getTime())) {
      throw new Error("A valid requirement due date is required.");
    }
  }

  if (input.dueAnchor === "custom_date" && !input.dueDate?.trim()) {
    throw new Error("Exact deadline is required for custom date requirements.");
  }

  if (typeof input.sortOrder !== "undefined" && input.sortOrder < 0) {
    throw new Error("Requirement sort order must be zero or greater.");
  }

  if (typeof input.dueAnchor !== "undefined" && !dueAnchors.includes(input.dueAnchor)) {
    throw new Error("A valid requirement due timing is required.");
  }

  if (typeof input.dueOffsetDays !== "undefined" && input.dueOffsetDays < 0) {
    throw new Error("Due offset days must be zero or greater.");
  }

  if (
    typeof input.reminderCadence !== "undefined" &&
    !reminderCadences.includes(input.reminderCadence)
  ) {
    throw new Error("A valid reminder cadence is required.");
  }

  if (Array.isArray(input.structuredFields)) {
    validateStructuredFields(input.structuredFields);
  }

  if (Array.isArray(input.documentBlocks)) {
    validateDocumentBlocks(input.documentBlocks);
  }
}

export function validateCreateRequirementTemplateInput(
  input: CreateRequirementTemplateInput,
) {
  validateCreateEventRequirementInput({
    category: input.category,
    name: input.name,
    description: input.description,
    inputType: input.inputType,
    required: input.required,
    priority: input.priority,
    reminderEnabled: input.reminderEnabled,
    reminderCadence: input.reminderCadence,
    reminderDaysBeforeDue: input.reminderDaysBeforeDue,
    humanVerificationRequired: input.humanVerificationRequired,
    isSignedAgreement: input.isSignedAgreement,
    acceptedFileTypes: input.acceptedFileTypes,
    sortOrder: input.sortOrder,
    dueAnchor: input.dueAnchor,
    dueOffsetDays: input.dueOffsetDays,
  });

  if (
    typeof input.dueDaysBeforeEvent !== "undefined" &&
    input.dueDaysBeforeEvent < 0
  ) {
    throw new Error("Due days before event must be zero or greater.");
  }

  if (
    Array.isArray(input.reminderDaysBeforeDue) &&
    input.reminderDaysBeforeDue.some((value) => value < 0)
  ) {
    throw new Error("Reminder days before due must be zero or greater.");
  }
}

function validateStructuredFields(fields: RequirementStructuredField[]) {
  for (const field of fields) {
    if (!field.key.trim()) {
      throw new Error("Structured field key is required.");
    }

    if (!field.label.trim()) {
      throw new Error("Structured field label is required.");
    }
  }
}

function validateDocumentBlocks(blocks: RequirementDocumentBlock[]) {
  for (const block of blocks) {
    if (!block.key.trim()) {
      throw new Error("Document block key is required.");
    }

    if (!block.title.trim()) {
      throw new Error("Document block title is required.");
    }

    if (block.sortOrder < 0) {
      throw new Error("Document block sort order must be zero or greater.");
    }
  }
}
