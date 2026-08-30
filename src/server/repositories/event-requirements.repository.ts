import type {
  CreateEventRequirementInput,
  EventRequirementRecord,
} from "@/types/readiness";
import { connectToDatabase } from "@/server/db/mongoose";
import { EventRequirementMongoModel } from "@/server/models/event-requirement.model";

export const eventRequirementsRepository = {
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

    return mapEventRequirement(requirement.toObject());
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
  reminderEnabled: boolean;
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
    reminderEnabled: requirement.reminderEnabled,
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
    humanVerificationRequired: requirement.humanVerificationRequired,
    isSignedAgreement: requirement.isSignedAgreement,
    acceptedFileTypes: requirement.acceptedFileTypes ?? [],
    sortOrder: requirement.sortOrder,
    isActive: requirement.isActive,
    createdAt: requirement.createdAt.toISOString(),
    updatedAt: requirement.updatedAt.toISOString(),
  };
}
