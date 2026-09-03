import { randomUUID } from "node:crypto";

import type {
  EventRequirementRecord,
  FighterRequirementRecord,
  FighterRequirementStatus,
} from "@/types/readiness";
import { connectToDatabase } from "@/server/db/mongoose";
import { FighterRequirementMongoModel } from "@/server/models/fighter-requirement.model";

const actionableStatuses: FighterRequirementStatus[] = ["WAITING", "NEEDS_RESUBMISSION"];

type ReminderScheduleUpdate = {
  fighterRequirementId: string;
  nextReminderAt: string | null;
  nextDeadlineAlertAt: string | null;
  reminderStoppedReason: string | null;
  resetDeliveryState?: boolean;
};

type ReminderClaimCompletion = {
  fighterRequirementId: string;
  claimToken: string;
  nextReminderAt: string | null;
  lastReminderAt?: string | null;
  reminderAttemptCount: number;
  nextDeadlineAlertAt: string | null;
  deadlineAlertSentAt?: string | null;
  deadlineAlertAttemptCount: number;
  reminderStoppedReason?: string | null;
};

export const fighterRequirementsRepository = {
  async findById(fighterRequirementId: string) {
    await connectToDatabase();

    const requirement = await FighterRequirementMongoModel.findById(
      fighterRequirementId,
    ).lean();

    return requirement ? mapFighterRequirement(requirement) : null;
  },
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
  async listByIds(fighterRequirementIds: string[]) {
    await connectToDatabase();

    if (fighterRequirementIds.length === 0) {
      return [];
    }

    const requirements = await FighterRequirementMongoModel.find({
      _id: { $in: fighterRequirementIds },
    }).lean();

    return requirements.map(mapFighterRequirement);
  },
  async listByEventRequirementId(eventId: string, eventRequirementId: string) {
    await connectToDatabase();

    const requirements = await FighterRequirementMongoModel.find({
      eventId,
      eventRequirementId,
    }).lean();

    return requirements.map(mapFighterRequirement);
  },
  async ensureForFighter(params: {
    eventId: string;
    fighterId: string;
    fightId: string | null;
    eventRequirements: EventRequirementRecord[];
    dueDateByRequirementId?: Map<string, string | null>;
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
            dueDate:
              params.dueDateByRequirementId?.get(requirement.id) ??
              requirement.dueDate,
            humanVerificationRequired: requirement.humanVerificationRequired,
            overrideReason: null,
            aiConfidence: null,
            aiReason: null,
            latestSubmissionId: null,
            completedAt: null,
            nextReminderAt: null,
            lastReminderAt: null,
            reminderAttemptCount: 0,
            reminderLockedUntil: null,
            reminderClaimToken: null,
            nextDeadlineAlertAt: null,
            deadlineAlertSentAt: null,
            deadlineAlertAttemptCount: 0,
            reminderStoppedReason: "schedule_not_initialized",
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await FighterRequirementMongoModel.bulkWrite(operations, { ordered: false });
    }
  },
  async ensureRequirementForFighters(params: {
    eventId: string;
    eventRequirement: EventRequirementRecord;
    assignments: Array<{
      fighterId: string;
      fightId: string | null;
      dueDate: string | null;
    }>;
  }) {
    await connectToDatabase();

    if (params.assignments.length === 0) {
      return 0;
    }

    const result = await FighterRequirementMongoModel.bulkWrite(
      params.assignments.map((assignment) => ({
        updateOne: {
          filter: {
            eventId: params.eventId,
            fighterId: assignment.fighterId,
            eventRequirementId: params.eventRequirement.id,
          },
          update: {
            $setOnInsert: {
              eventId: params.eventId,
              fighterId: assignment.fighterId,
              fightId: assignment.fightId,
              eventRequirementId: params.eventRequirement.id,
              status: "WAITING",
              required: params.eventRequirement.required,
              priority: params.eventRequirement.priority,
              dueDate: assignment.dueDate,
              humanVerificationRequired:
                params.eventRequirement.humanVerificationRequired,
              overrideReason: null,
              aiConfidence: null,
              aiReason: null,
              latestSubmissionId: null,
              completedAt: null,
              nextReminderAt: null,
              lastReminderAt: null,
              reminderAttemptCount: 0,
              reminderLockedUntil: null,
              reminderClaimToken: null,
              nextDeadlineAlertAt: null,
              deadlineAlertSentAt: null,
              deadlineAlertAttemptCount: 0,
              reminderStoppedReason: "schedule_not_initialized",
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    return result.upsertedCount ?? 0;
  },
  async updateStatus(params: {
    fighterRequirementId: string;
    status: FighterRequirementStatus;
    overrideReason?: string | null;
    aiConfidence?: number | null;
    aiReason?: string | null;
    latestSubmissionId?: string | null;
  }) {
    await connectToDatabase();

    const requirement = await FighterRequirementMongoModel.findByIdAndUpdate(
      params.fighterRequirementId,
      {
        status: params.status,
        overrideReason: params.overrideReason ?? null,
        aiConfidence: params.aiConfidence ?? null,
        aiReason: params.aiReason ?? null,
        ...(typeof params.latestSubmissionId !== "undefined"
          ? { latestSubmissionId: params.latestSubmissionId }
          : {}),
        completedAt:
          params.status === "ACCEPTED" || params.status === "NOT_APPLICABLE"
            ? new Date()
            : null,
        reminderLockedUntil: null,
        reminderClaimToken: null,
        ...(!actionableStatuses.includes(params.status)
          ? {
              nextReminderAt: null,
              nextDeadlineAlertAt: null,
              reminderStoppedReason: `status_${params.status.toLowerCase()}`,
            }
          : {}),
      },
      { returnDocument: "after" },
    ).lean();

    return requirement ? mapFighterRequirement(requirement) : null;
  },
  async updateDueDatesForFighter(params: {
    eventId: string;
    fighterId: string;
    dueDateByRequirementId: Map<string, string | null>;
  }) {
    await connectToDatabase();

    const operations = Array.from(params.dueDateByRequirementId.entries()).map(
      ([eventRequirementId, dueDate]) => ({
        updateOne: {
          filter: {
            eventId: params.eventId,
            fighterId: params.fighterId,
            eventRequirementId,
          },
          update: {
            $set: {
              dueDate,
              nextReminderAt: null,
              nextDeadlineAlertAt: null,
              deadlineAlertSentAt: null,
              reminderAttemptCount: 0,
              deadlineAlertAttemptCount: 0,
              reminderStoppedReason: "schedule_refresh_required",
            },
          },
        },
      }),
    );

    if (operations.length === 0) {
      return 0;
    }

    const result = await FighterRequirementMongoModel.bulkWrite(operations, {
      ordered: false,
    });

    return result.modifiedCount ?? 0;
  },
  async updateReminderSchedules(updates: ReminderScheduleUpdate[]) {
    await connectToDatabase();

    if (updates.length === 0) {
      return 0;
    }

    const result = await FighterRequirementMongoModel.bulkWrite(
      updates.map((update) => ({
        updateOne: {
          filter: { _id: update.fighterRequirementId },
          update: {
            $set: {
              nextReminderAt: update.nextReminderAt
                ? new Date(update.nextReminderAt)
                : null,
              nextDeadlineAlertAt: update.nextDeadlineAlertAt
                ? new Date(update.nextDeadlineAlertAt)
                : null,
              reminderStoppedReason: update.reminderStoppedReason,
              reminderLockedUntil: null,
              reminderClaimToken: null,
              ...(update.resetDeliveryState
                ? {
                    reminderAttemptCount: 0,
                    deadlineAlertAttemptCount: 0,
                  }
                : {}),
            },
          },
        },
      })),
      { ordered: false },
    );

    return result.modifiedCount ?? 0;
  },
  async claimDueReminderBatch(params: {
    now: string;
    lockedUntil: string;
    limit: number;
    eventId?: string;
  }) {
    await connectToDatabase();

    const now = new Date(params.now);
    const eligibilityFilter = {
      status: { $in: actionableStatuses },
      ...(params.eventId ? { eventId: params.eventId } : {}),
      $and: [
        {
          $or: [
            { reminderLockedUntil: null },
            { reminderLockedUntil: { $exists: false } },
            { reminderLockedUntil: { $lte: now } },
          ],
        },
        {
          $or: [
            { nextReminderAt: { $lte: now } },
            { nextDeadlineAlertAt: { $lte: now } },
          ],
        },
      ],
    };
    const candidates = await FighterRequirementMongoModel.find(eligibilityFilter)
      .sort({ nextReminderAt: 1, nextDeadlineAlertAt: 1, updatedAt: 1 })
      .limit(Math.max(1, Math.min(params.limit, 100)))
      .select({ _id: 1 })
      .lean();

    if (candidates.length === 0) {
      return { claimToken: null, requirements: [] };
    }

    const claimToken = randomUUID();
    const candidateIds = candidates.map((candidate) => candidate._id);
    await FighterRequirementMongoModel.updateMany(
      { ...eligibilityFilter, _id: { $in: candidateIds } },
      {
        $set: {
          reminderLockedUntil: new Date(params.lockedUntil),
          reminderClaimToken: claimToken,
        },
      },
    );

    const claimed = await FighterRequirementMongoModel.find({
      reminderClaimToken: claimToken,
    }).lean();

    return {
      claimToken,
      requirements: claimed.map(mapFighterRequirement),
    };
  },
  async completeReminderBatch(completions: ReminderClaimCompletion[]) {
    await connectToDatabase();

    if (completions.length === 0) {
      return 0;
    }

    const result = await FighterRequirementMongoModel.bulkWrite(
      completions.map((completion) => ({
        updateOne: {
          filter: {
            _id: completion.fighterRequirementId,
            reminderClaimToken: completion.claimToken,
          },
          update: {
            $set: {
              nextReminderAt: completion.nextReminderAt
                ? new Date(completion.nextReminderAt)
                : null,
              ...(typeof completion.lastReminderAt !== "undefined"
                ? {
                    lastReminderAt: completion.lastReminderAt
                      ? new Date(completion.lastReminderAt)
                      : null,
                  }
                : {}),
              reminderAttemptCount: completion.reminderAttemptCount,
              nextDeadlineAlertAt: completion.nextDeadlineAlertAt
                ? new Date(completion.nextDeadlineAlertAt)
                : null,
              ...(typeof completion.deadlineAlertSentAt !== "undefined"
                ? {
                    deadlineAlertSentAt: completion.deadlineAlertSentAt
                      ? new Date(completion.deadlineAlertSentAt)
                      : null,
                  }
                : {}),
              deadlineAlertAttemptCount: completion.deadlineAlertAttemptCount,
              ...(typeof completion.reminderStoppedReason !== "undefined"
                ? { reminderStoppedReason: completion.reminderStoppedReason }
                : {}),
              reminderLockedUntil: null,
              reminderClaimToken: null,
            },
          },
        },
      })),
      { ordered: false },
    );

    return result.modifiedCount ?? 0;
  },
  async deleteByFightId(fightId: string) {
    await connectToDatabase();

    const result = await FighterRequirementMongoModel.deleteMany({ fightId });
    return result.deletedCount ?? 0;
  },
  async deleteByEventId(eventId: string) {
    await connectToDatabase();

    const result = await FighterRequirementMongoModel.deleteMany({ eventId });
    return result.deletedCount ?? 0;
  },
  async deleteByEventAndFighter(eventId: string, fighterId: string) {
    await connectToDatabase();

    const result = await FighterRequirementMongoModel.deleteMany({
      eventId,
      fighterId,
    });

    return result.deletedCount ?? 0;
  },
  async deleteByEventRequirementId(eventId: string, eventRequirementId: string) {
    await connectToDatabase();

    const result = await FighterRequirementMongoModel.deleteMany({ eventId, eventRequirementId });
    return result.deletedCount ?? 0;
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
  nextReminderAt?: Date | null;
  lastReminderAt?: Date | null;
  reminderAttemptCount?: number;
  reminderLockedUntil?: Date | null;
  reminderClaimToken?: string | null;
  nextDeadlineAlertAt?: Date | null;
  deadlineAlertSentAt?: Date | null;
  deadlineAlertAttemptCount?: number;
  reminderStoppedReason?: string | null;
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
    nextReminderAt: requirement.nextReminderAt
      ? requirement.nextReminderAt.toISOString()
      : null,
    lastReminderAt: requirement.lastReminderAt
      ? requirement.lastReminderAt.toISOString()
      : null,
    reminderAttemptCount: requirement.reminderAttemptCount ?? 0,
    reminderLockedUntil: requirement.reminderLockedUntil
      ? requirement.reminderLockedUntil.toISOString()
      : null,
    reminderClaimToken: requirement.reminderClaimToken ?? null,
    nextDeadlineAlertAt: requirement.nextDeadlineAlertAt
      ? requirement.nextDeadlineAlertAt.toISOString()
      : null,
    deadlineAlertSentAt: requirement.deadlineAlertSentAt
      ? requirement.deadlineAlertSentAt.toISOString()
      : null,
    deadlineAlertAttemptCount: requirement.deadlineAlertAttemptCount ?? 0,
    reminderStoppedReason: requirement.reminderStoppedReason ?? null,
    createdAt: requirement.createdAt.toISOString(),
    updatedAt: requirement.updatedAt.toISOString(),
  };
}
