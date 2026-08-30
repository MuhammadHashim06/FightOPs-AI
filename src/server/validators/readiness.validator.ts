import type {
  CreateEventRequirementInput,
  CreateRequirementTemplateInput,
  RequirementStructuredField,
  RequirementPriority,
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

  if (typeof input.sortOrder !== "undefined" && input.sortOrder < 0) {
    throw new Error("Requirement sort order must be zero or greater.");
  }

  if (Array.isArray(input.structuredFields)) {
    validateStructuredFields(input.structuredFields);
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
    reminderDaysBeforeDue: input.reminderDaysBeforeDue,
    humanVerificationRequired: input.humanVerificationRequired,
    isSignedAgreement: input.isSignedAgreement,
    acceptedFileTypes: input.acceptedFileTypes,
    sortOrder: input.sortOrder,
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
