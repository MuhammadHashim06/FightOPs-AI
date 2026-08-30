import type {
  CreateRequirementTemplateInput,
  RequirementTemplateRecord,
  UpdateRequirementTemplateInput,
} from "@/types/readiness";
import { connectToDatabase } from "@/server/db/mongoose";
import { RequirementTemplateMongoModel } from "@/server/models/requirement-template.model";

export const requirementTemplatesRepository = {
  async listByOwnerUserId(ownerUserId: string) {
    await connectToDatabase();

    const templates = await RequirementTemplateMongoModel.find({
      ownerUserId,
      isActive: true,
    })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return templates.map(mapRequirementTemplate);
  },
  async create(
    ownerUserId: string,
    input: CreateRequirementTemplateInput & { sortOrder: number },
  ) {
    await connectToDatabase();

    const template = await RequirementTemplateMongoModel.create({
      ownerUserId,
      category: input.category,
      name: input.name,
      description: normalizeOptionalText(input.description),
      inputType: input.inputType,
      required: input.required,
      priority: input.priority,
      dueDaysBeforeEvent:
        typeof input.dueDaysBeforeEvent === "number" ? input.dueDaysBeforeEvent : null,
      reminderEnabled: input.reminderEnabled ?? false,
      reminderDaysBeforeDue: input.reminderDaysBeforeDue ?? [],
      reminderSubject: normalizeOptionalText(input.reminderSubject),
      reminderMessage: normalizeOptionalText(input.reminderMessage),
      structuredFields: (input.structuredFields ?? []).map(mapStructuredFieldInput),
      humanVerificationRequired: input.humanVerificationRequired ?? false,
      isSignedAgreement: input.isSignedAgreement ?? false,
      acceptedFileTypes: input.acceptedFileTypes ?? [],
      sortOrder: input.sortOrder,
      isActive: true,
    });

    return mapRequirementTemplate(template.toObject());
  },
  async update(templateId: string, input: UpdateRequirementTemplateInput) {
    await connectToDatabase();

    const updatePayload: Record<string, unknown> = {};

    if (typeof input.category === "string") {
      updatePayload.category = input.category;
    }

    if (typeof input.name === "string") {
      updatePayload.name = input.name;
    }

    if (typeof input.description !== "undefined") {
      updatePayload.description = normalizeOptionalText(input.description);
    }

    if (typeof input.inputType === "string") {
      updatePayload.inputType = input.inputType;
    }

    if (typeof input.required === "boolean") {
      updatePayload.required = input.required;
    }

    if (typeof input.priority === "string") {
      updatePayload.priority = input.priority;
    }

    if (typeof input.dueDaysBeforeEvent !== "undefined") {
      updatePayload.dueDaysBeforeEvent =
        typeof input.dueDaysBeforeEvent === "number" ? input.dueDaysBeforeEvent : null;
    }

    if (typeof input.reminderEnabled === "boolean") {
      updatePayload.reminderEnabled = input.reminderEnabled;
    }

    if (Array.isArray(input.reminderDaysBeforeDue)) {
      updatePayload.reminderDaysBeforeDue = input.reminderDaysBeforeDue;
    }

    if (typeof input.reminderSubject !== "undefined") {
      updatePayload.reminderSubject = normalizeOptionalText(input.reminderSubject);
    }

    if (typeof input.reminderMessage !== "undefined") {
      updatePayload.reminderMessage = normalizeOptionalText(input.reminderMessage);
    }

    if (Array.isArray(input.structuredFields)) {
      updatePayload.structuredFields = input.structuredFields.map(mapStructuredFieldInput);
    }

    if (typeof input.humanVerificationRequired === "boolean") {
      updatePayload.humanVerificationRequired = input.humanVerificationRequired;
    }

    if (typeof input.isSignedAgreement === "boolean") {
      updatePayload.isSignedAgreement = input.isSignedAgreement;
    }

    if (Array.isArray(input.acceptedFileTypes)) {
      updatePayload.acceptedFileTypes = input.acceptedFileTypes;
    }

    if (typeof input.sortOrder === "number") {
      updatePayload.sortOrder = input.sortOrder;
    }

    if (typeof input.isActive === "boolean") {
      updatePayload.isActive = input.isActive;
    }

    const template = await RequirementTemplateMongoModel.findByIdAndUpdate(
      templateId,
      updatePayload,
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return template ? mapRequirementTemplate(template) : null;
  },
  async updateOwned(
    ownerUserId: string,
    templateId: string,
    input: UpdateRequirementTemplateInput,
  ) {
    await connectToDatabase();

    const updatePayload: Record<string, unknown> = {};

    if (typeof input.category === "string") {
      updatePayload.category = input.category;
    }

    if (typeof input.name === "string") {
      updatePayload.name = input.name;
    }

    if (typeof input.description !== "undefined") {
      updatePayload.description = normalizeOptionalText(input.description);
    }

    if (typeof input.inputType === "string") {
      updatePayload.inputType = input.inputType;
    }

    if (typeof input.required === "boolean") {
      updatePayload.required = input.required;
    }

    if (typeof input.priority === "string") {
      updatePayload.priority = input.priority;
    }

    if (typeof input.dueDaysBeforeEvent !== "undefined") {
      updatePayload.dueDaysBeforeEvent =
        typeof input.dueDaysBeforeEvent === "number" ? input.dueDaysBeforeEvent : null;
    }

    if (typeof input.reminderEnabled === "boolean") {
      updatePayload.reminderEnabled = input.reminderEnabled;
    }

    if (Array.isArray(input.reminderDaysBeforeDue)) {
      updatePayload.reminderDaysBeforeDue = input.reminderDaysBeforeDue;
    }

    if (typeof input.reminderSubject !== "undefined") {
      updatePayload.reminderSubject = normalizeOptionalText(input.reminderSubject);
    }

    if (typeof input.reminderMessage !== "undefined") {
      updatePayload.reminderMessage = normalizeOptionalText(input.reminderMessage);
    }

    if (Array.isArray(input.structuredFields)) {
      updatePayload.structuredFields = input.structuredFields.map(mapStructuredFieldInput);
    }

    if (typeof input.humanVerificationRequired === "boolean") {
      updatePayload.humanVerificationRequired = input.humanVerificationRequired;
    }

    if (typeof input.isSignedAgreement === "boolean") {
      updatePayload.isSignedAgreement = input.isSignedAgreement;
    }

    if (Array.isArray(input.acceptedFileTypes)) {
      updatePayload.acceptedFileTypes = input.acceptedFileTypes;
    }

    if (typeof input.sortOrder === "number") {
      updatePayload.sortOrder = input.sortOrder;
    }

    if (typeof input.isActive === "boolean") {
      updatePayload.isActive = input.isActive;
    }

    const template = await RequirementTemplateMongoModel.findOneAndUpdate(
      {
        _id: templateId,
        ownerUserId,
        isActive: true,
      },
      updatePayload,
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return template ? mapRequirementTemplate(template) : null;
  },
  async delete(templateId: string) {
    await connectToDatabase();

    const template = await RequirementTemplateMongoModel.findByIdAndUpdate(
      templateId,
      { isActive: false },
      { new: true },
    ).lean();

    return Boolean(template);
  },
  async deleteOwned(ownerUserId: string, templateId: string) {
    await connectToDatabase();

    const template = await RequirementTemplateMongoModel.findOneAndUpdate(
      {
        _id: templateId,
        ownerUserId,
        isActive: true,
      },
      { isActive: false },
      { new: true },
    ).lean();

    return Boolean(template);
  },
  async getNextSortOrder(ownerUserId: string) {
    await connectToDatabase();

    const latestTemplate = await RequirementTemplateMongoModel.findOne({
      ownerUserId,
      isActive: true,
    })
      .sort({ sortOrder: -1 })
      .select({ sortOrder: 1 })
      .lean();

    return (latestTemplate?.sortOrder ?? 0) + 1;
  },
};

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mapStructuredFieldInput(field: {
  key: string;
  label: string;
  type: RequirementTemplateRecord["structuredFields"][number]["type"];
  required: boolean;
  placeholder?: string | null;
}) {
  return {
    key: field.key.trim(),
    label: field.label.trim(),
    type: field.type,
    required: field.required,
    placeholder: normalizeOptionalText(field.placeholder ?? undefined),
  };
}

function mapRequirementTemplate(template: {
  _id: { toString(): string };
  ownerUserId: { toString(): string };
  category: string;
  name: string;
  description: string | null;
  inputType: RequirementTemplateRecord["inputType"];
  required: boolean;
  priority: RequirementTemplateRecord["priority"];
  dueDaysBeforeEvent: number | null;
  reminderEnabled: boolean;
  reminderDaysBeforeDue: number[];
  reminderSubject: string | null;
  reminderMessage: string | null;
  structuredFields: Array<{
    key: string;
    label: string;
    type: RequirementTemplateRecord["structuredFields"][number]["type"];
    required: boolean;
    placeholder: string | null;
  }>;
  humanVerificationRequired: boolean;
  isSignedAgreement: boolean;
  acceptedFileTypes: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: template._id.toString(),
    ownerUserId: template.ownerUserId.toString(),
    category: template.category,
    name: template.name,
    description: template.description ?? null,
    inputType: template.inputType,
    required: template.required,
    priority: template.priority,
    dueDaysBeforeEvent: template.dueDaysBeforeEvent ?? null,
    reminderEnabled: template.reminderEnabled,
    reminderDaysBeforeDue: template.reminderDaysBeforeDue ?? [],
    reminderSubject: template.reminderSubject ?? null,
    reminderMessage: template.reminderMessage ?? null,
    structuredFields: (template.structuredFields ?? []).map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder ?? null,
    })),
    humanVerificationRequired: template.humanVerificationRequired,
    isSignedAgreement: template.isSignedAgreement,
    acceptedFileTypes: template.acceptedFileTypes ?? [],
    sortOrder: template.sortOrder,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  } satisfies RequirementTemplateRecord;
}
