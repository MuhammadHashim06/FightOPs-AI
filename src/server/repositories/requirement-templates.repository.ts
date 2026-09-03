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
      isDefault: { $ne: false },
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
      dueAnchor: input.dueAnchor ?? "before_event",
      dueOffsetDays:
        typeof input.dueOffsetDays === "number"
          ? input.dueOffsetDays
          : typeof input.dueDaysBeforeEvent === "number"
            ? input.dueDaysBeforeEvent
            : null,
      reminderEnabled: input.reminderEnabled ?? false,
      reminderCadence: input.reminderCadence ?? "daily_until_resolved",
      reminderDaysBeforeDue: input.reminderDaysBeforeDue ?? [],
      reminderSubject: normalizeOptionalText(input.reminderSubject),
      reminderMessage: normalizeOptionalText(input.reminderMessage),
      structuredFields: (input.structuredFields ?? []).map(mapStructuredFieldInput),
      documentBlocks: normalizeDocumentBlocks(input),
      humanVerificationRequired: input.humanVerificationRequired ?? false,
      isSignedAgreement: input.isSignedAgreement ?? false,
      acceptedFileTypes: input.acceptedFileTypes ?? [],
      sortOrder: input.sortOrder,
      isActive: true,
      isDefault: input.isDefault ?? true,
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

    if (typeof input.dueAnchor === "string") {
      updatePayload.dueAnchor = input.dueAnchor;
    }

    if (typeof input.dueOffsetDays !== "undefined") {
      updatePayload.dueOffsetDays =
        typeof input.dueOffsetDays === "number" ? input.dueOffsetDays : null;
      updatePayload.dueDaysBeforeEvent =
        input.dueAnchor === "before_event" && typeof input.dueOffsetDays === "number"
          ? input.dueOffsetDays
          : null;
    }

    if (typeof input.reminderEnabled === "boolean") {
      updatePayload.reminderEnabled = input.reminderEnabled;
    }

    if (typeof input.reminderCadence === "string") {
      updatePayload.reminderCadence = input.reminderCadence;
      updatePayload.reminderEnabled = input.reminderCadence !== "off";
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

    if (Array.isArray(input.documentBlocks)) {
      updatePayload.documentBlocks = input.documentBlocks.map(mapDocumentBlockInput);
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

    if (typeof input.isDefault === "boolean") {
      updatePayload.isDefault = input.isDefault;
    }

    const template = await RequirementTemplateMongoModel.findByIdAndUpdate(
      templateId,
      updatePayload,
      {
        returnDocument: "after",
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

    if (typeof input.dueAnchor === "string") {
      updatePayload.dueAnchor = input.dueAnchor;
    }

    if (typeof input.dueOffsetDays !== "undefined") {
      updatePayload.dueOffsetDays =
        typeof input.dueOffsetDays === "number" ? input.dueOffsetDays : null;
      updatePayload.dueDaysBeforeEvent =
        input.dueAnchor === "before_event" && typeof input.dueOffsetDays === "number"
          ? input.dueOffsetDays
          : null;
    }

    if (typeof input.reminderEnabled === "boolean") {
      updatePayload.reminderEnabled = input.reminderEnabled;
    }

    if (typeof input.reminderCadence === "string") {
      updatePayload.reminderCadence = input.reminderCadence;
      updatePayload.reminderEnabled = input.reminderCadence !== "off";
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

    if (Array.isArray(input.documentBlocks)) {
      updatePayload.documentBlocks = input.documentBlocks.map(mapDocumentBlockInput);
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
        returnDocument: "after",
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
      { returnDocument: "after" },
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
      { returnDocument: "after" },
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

function normalizeDocumentBlocks(input: CreateRequirementTemplateInput) {
  if (Array.isArray(input.documentBlocks) && input.documentBlocks.length > 0) {
    return input.documentBlocks.map(mapDocumentBlockInput);
  }

  if (input.inputType !== "document") {
    return [];
  }

  return [
    {
      key: slugify(input.name),
      title: input.name.trim(),
      description: normalizeOptionalText(input.description),
      required: input.required,
      acceptedFileTypes: input.acceptedFileTypes ?? [],
      humanVerificationRequired: input.humanVerificationRequired ?? false,
      sortOrder: 1,
    },
  ];
}

function mapDocumentBlockInput(block: RequirementTemplateRecord["documentBlocks"][number]) {
  return {
    key: block.key.trim(),
    title: block.title.trim(),
    description: normalizeOptionalText(block.description ?? undefined),
    required: block.required,
    acceptedFileTypes: block.acceptedFileTypes ?? [],
    humanVerificationRequired: block.humanVerificationRequired,
    sortOrder: block.sortOrder,
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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
  dueAnchor?: RequirementTemplateRecord["dueAnchor"];
  dueOffsetDays?: number | null;
  reminderEnabled: boolean;
  reminderCadence?: RequirementTemplateRecord["reminderCadence"];
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
  documentBlocks?: RequirementTemplateRecord["documentBlocks"];
  humanVerificationRequired: boolean;
  isSignedAgreement: boolean;
  acceptedFileTypes: string[];
  sortOrder: number;
  isActive: boolean;
  isDefault?: boolean;
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
    dueAnchor: template.dueAnchor ?? "before_event",
    dueOffsetDays:
      typeof template.dueOffsetDays === "number"
        ? template.dueOffsetDays
        : template.dueDaysBeforeEvent ?? null,
    reminderEnabled: template.reminderEnabled,
    reminderCadence:
      template.reminderCadence ??
      (template.reminderEnabled ? "daily_until_resolved" : "off"),
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
    documentBlocks: normalizeMappedDocumentBlocks(template),
    humanVerificationRequired: template.humanVerificationRequired,
    isSignedAgreement: template.isSignedAgreement,
    acceptedFileTypes: template.acceptedFileTypes ?? [],
    sortOrder: template.sortOrder,
    isActive: template.isActive,
    isDefault: template.isDefault !== false,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  } satisfies RequirementTemplateRecord;
}

function normalizeMappedDocumentBlocks(template: {
  name: string;
  description: string | null;
  inputType: RequirementTemplateRecord["inputType"];
  required: boolean;
  acceptedFileTypes: string[];
  humanVerificationRequired: boolean;
  documentBlocks?: RequirementTemplateRecord["documentBlocks"];
}) {
  if (template.documentBlocks && template.documentBlocks.length > 0) {
    return template.documentBlocks
      .map((block) => ({
        key: block.key,
        title: block.title,
        description: block.description ?? null,
        required: block.required,
        acceptedFileTypes: block.acceptedFileTypes ?? [],
        humanVerificationRequired: block.humanVerificationRequired,
        sortOrder: block.sortOrder,
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }

  if (template.inputType !== "document") {
    return [];
  }

  return [
    {
      key: slugify(template.name),
      title: template.name,
      description: template.description ?? null,
      required: template.required,
      acceptedFileTypes: template.acceptedFileTypes ?? [],
      humanVerificationRequired: template.humanVerificationRequired,
      sortOrder: 1,
    },
  ];
}
