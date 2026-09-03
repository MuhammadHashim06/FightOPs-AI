import type {
  CreateEventRequirementInput,
  EventRequirementRecord,
} from "@/types/readiness";
import { connectToDatabase } from "@/server/db/mongoose";
import { EventRequirementMongoModel } from "@/server/models/event-requirement.model";

export const eventRequirementsRepository = {
  async listByIds(eventRequirementIds: string[]) {
    await connectToDatabase();

    if (eventRequirementIds.length === 0) {
      return [];
    }

    const requirements = await EventRequirementMongoModel.find({
      _id: { $in: eventRequirementIds },
      isActive: true,
    }).lean();

    return requirements.map(mapEventRequirement);
  },
  async listByEventId(eventId: string) {
    await connectToDatabase();

    const requirements = await EventRequirementMongoModel.find({
      eventId,
      isActive: true,
    })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return requirements.map(mapEventRequirement);
  },
  async create(
    eventId: string,
    input: CreateEventRequirementInput & { sortOrder: number },
  ) {
    await connectToDatabase();

    const requirement = await EventRequirementMongoModel.create({
      eventId,
      category: input.category,
      name: input.name,
      description: normalizeOptionalText(input.description),
      inputType: input.inputType,
      required: input.required,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
      dueAnchor: input.dueAnchor ?? "before_event",
      dueOffsetDays: typeof input.dueOffsetDays === "number" ? input.dueOffsetDays : null,
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
    });

    return mapEventRequirement(requirement.toObject());
  },
  async update(eventId: string, requirementId: string, input: CreateEventRequirementInput) {
    await connectToDatabase();

    const requirement = await EventRequirementMongoModel.findOneAndUpdate(
      { _id: requirementId, eventId, isActive: true },
      {
        $set: {
          category: input.category,
          name: input.name,
          description: normalizeOptionalText(input.description),
          inputType: input.inputType,
          required: input.required,
          priority: input.priority,
          dueDate: input.dueDate ?? null,
          dueAnchor: input.dueAnchor ?? "before_event",
          dueOffsetDays: typeof input.dueOffsetDays === "number" ? input.dueOffsetDays : null,
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
        },
      },
      { returnDocument: "after" },
    ).lean();

    return requirement ? mapEventRequirement(requirement) : null;
  },
  async deactivate(eventId: string, requirementId: string) {
    await connectToDatabase();

    const requirement = await EventRequirementMongoModel.findOneAndUpdate(
      { _id: requirementId, eventId, isActive: true },
      { $set: { isActive: false } },
      { returnDocument: "after" },
    ).lean();

    return requirement ? mapEventRequirement(requirement) : null;
  },
  async getNextSortOrder(eventId: string) {
    await connectToDatabase();

    const latestRequirement = await EventRequirementMongoModel.findOne({
      eventId,
      isActive: true,
    })
      .sort({ sortOrder: -1 })
      .select({ sortOrder: 1 })
      .lean();

    return (latestRequirement?.sortOrder ?? 0) + 1;
  },
  async deleteByEventId(eventId: string) {
    await connectToDatabase();

    const result = await EventRequirementMongoModel.deleteMany({ eventId });
    return result.deletedCount ?? 0;
  },
};

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function mapStructuredFieldInput(field: {
  key: string;
  label: string;
  type: EventRequirementRecord["structuredFields"][number]["type"];
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

function normalizeDocumentBlocks(input: CreateEventRequirementInput) {
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

function mapDocumentBlockInput(block: EventRequirementRecord["documentBlocks"][number]) {
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

function mapEventRequirement(requirement: {
  _id: { toString(): string };
  eventId: { toString(): string };
  category: string;
  name: string;
  description: string | null;
  inputType: EventRequirementRecord["inputType"];
  required: boolean;
  priority: EventRequirementRecord["priority"];
  dueDate: Date | null;
  dueAnchor?: EventRequirementRecord["dueAnchor"];
  dueOffsetDays?: number | null;
  reminderEnabled: boolean;
  reminderCadence?: EventRequirementRecord["reminderCadence"];
  reminderDaysBeforeDue: number[];
  reminderSubject: string | null;
  reminderMessage: string | null;
  structuredFields: Array<{
    key: string;
    label: string;
    type: EventRequirementRecord["structuredFields"][number]["type"];
    required: boolean;
    placeholder: string | null;
  }>;
  documentBlocks?: EventRequirementRecord["documentBlocks"];
  humanVerificationRequired: boolean;
  isSignedAgreement: boolean;
  acceptedFileTypes: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): EventRequirementRecord {
  return {
    id: requirement._id.toString(),
    eventId: requirement.eventId.toString(),
    category: requirement.category,
    name: requirement.name,
    description: requirement.description ?? null,
    inputType: requirement.inputType,
    required: requirement.required,
    priority: requirement.priority,
    dueDate: requirement.dueDate ? requirement.dueDate.toISOString() : null,
    dueAnchor: requirement.dueAnchor ?? "before_event",
    dueOffsetDays: requirement.dueOffsetDays ?? null,
    reminderEnabled: requirement.reminderEnabled,
    reminderCadence:
      requirement.reminderCadence ??
      (requirement.reminderEnabled ? "daily_until_resolved" : "off"),
    reminderDaysBeforeDue: requirement.reminderDaysBeforeDue ?? [],
    reminderSubject: requirement.reminderSubject ?? null,
    reminderMessage: requirement.reminderMessage ?? null,
    structuredFields: (requirement.structuredFields ?? []).map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder ?? null,
    })),
    documentBlocks: normalizeMappedDocumentBlocks(requirement),
    humanVerificationRequired: requirement.humanVerificationRequired,
    isSignedAgreement: requirement.isSignedAgreement,
    acceptedFileTypes: requirement.acceptedFileTypes ?? [],
    sortOrder: requirement.sortOrder,
    isActive: requirement.isActive,
    createdAt: requirement.createdAt.toISOString(),
    updatedAt: requirement.updatedAt.toISOString(),
  };
}

function normalizeMappedDocumentBlocks(requirement: {
  name: string;
  description: string | null;
  inputType: EventRequirementRecord["inputType"];
  required: boolean;
  acceptedFileTypes: string[];
  humanVerificationRequired: boolean;
  documentBlocks?: EventRequirementRecord["documentBlocks"];
}) {
  if (requirement.documentBlocks && requirement.documentBlocks.length > 0) {
    return requirement.documentBlocks
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

  if (requirement.inputType !== "document") {
    return [];
  }

  return [
    {
      key: slugify(requirement.name),
      title: requirement.name,
      description: requirement.description ?? null,
      required: requirement.required,
      acceptedFileTypes: requirement.acceptedFileTypes ?? [],
      humanVerificationRequired: requirement.humanVerificationRequired,
      sortOrder: 1,
    },
  ];
}
