import type {
  EventRequirementRecord,
  FighterRequirementRecord,
  FighterRequirementStatus,
} from "@/types/readiness";
import { connectToDatabase } from "@/server/db/mongoose";
import { FighterRequirementMongoModel } from "@/server/models/fighter-requirement.model";

export const fighterRequirementsRepository = {
  async listByEventId(eventId: string) {
    await connectToDatabase();

    const requirements = await FighterRequirementMongoModel.find({
      eventId,
    })
      .sort({ dueDate: 1, createdAt: 1 })
      .lean();

    return requirements.map(mapFighterRequirement);
  },
  async listByEventAndFighter(eventId: string, fighterId: string) {
    await connectToDatabase();

    const requirements = await FighterRequirementMongoModel.find({
      eventId,
      fighterId,
    })
      .sort({ createdAt: 1 })
      .lean();

    return requirements.map(mapFighterRequirement);
  },
  async ensureForFighter(params: {
    eventId: string;
    fighterId: string;
    fightId: string | null;
    eventRequirements: EventRequirementRecord[];
  }) {
    await connectToDatabase();

    const operations = params.eventRequirements.map((requirement) => ({
      updateOne: {
        filter: {
          eventId: params.eventId,
          fighterId: params.fighterId,
          eventRequirementId: requirement.id,
        },
        update: {
          $setOnInsert: {
            eventId: params.eventId,
            fighterId: params.fighterId,
            fightId: params.fightId,
            eventRequirementId: requirement.id,
            status: "WAITING",
            required: requirement.required,
            priority: requirement.priority,
            dueDate: requirement.dueDate,
            humanVerificationRequired: requirement.humanVerificationRequired,
            overrideReason: null,
            aiConfidence: null,
            aiReason: null,
            latestSubmissionId: null,
            completedAt: null,
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await FighterRequirementMongoModel.bulkWrite(operations, { ordered: false });
    }
  },
  async updateStatus(params: {
    fighterRequirementId: string;
    status: FighterRequirementStatus;
    overrideReason?: string | null;
    aiConfidence?: number | null;
    aiReason?: string | null;
  }) {
    await connectToDatabase();

    const requirement = await FighterRequirementMongoModel.findByIdAndUpdate(
      params.fighterRequirementId,
      {
        status: params.status,
        overrideReason: params.overrideReason ?? null,
        aiConfidence: params.aiConfidence ?? null,
        aiReason: params.aiReason ?? null,
        completedAt:
          params.status === "ACCEPTED" || params.status === "NOT_APPLICABLE"
            ? new Date()
            : null,
      },
      { new: true },
    ).lean();

    return requirement ? mapFighterRequirement(requirement) : null;
  },
};

function mapFighterRequirement(requirement: {
  _id: { toString(): string };
  eventId: { toString(): string };
  fighterId: { toString(): string };
  fightId: { toString(): string } | null;
  eventRequirementId: { toString(): string };
  status: FighterRequirementRecord["status"];
  required: boolean;
  priority: FighterRequirementRecord["priority"];
  dueDate: Date | null;
  humanVerificationRequired: boolean;
  overrideReason: string | null;
  aiConfidence: number | null;
  aiReason: string | null;
  latestSubmissionId: { toString(): string } | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): FighterRequirementRecord {
  return {
    id: requirement._id.toString(),
    eventId: requirement.eventId.toString(),
    fighterId: requirement.fighterId.toString(),
    fightId: requirement.fightId ? requirement.fightId.toString() : null,
    eventRequirementId: requirement.eventRequirementId.toString(),
    status: requirement.status,
    required: requirement.required,
    priority: requirement.priority,
    dueDate: requirement.dueDate ? requirement.dueDate.toISOString() : null,
    humanVerificationRequired: requirement.humanVerificationRequired,
    overrideReason: requirement.overrideReason ?? null,
    aiConfidence: requirement.aiConfidence ?? null,
    aiReason: requirement.aiReason ?? null,
    latestSubmissionId: requirement.latestSubmissionId
      ? requirement.latestSubmissionId.toString()
      : null,
    completedAt: requirement.completedAt ? requirement.completedAt.toISOString() : null,
    createdAt: requirement.createdAt.toISOString(),
    updatedAt: requirement.updatedAt.toISOString(),
  };
}
