import type {
  ReminderLogKind,
  ReminderLogRecord,
  ReminderLogStatus,
} from "@/types/readiness";
import { connectToDatabase } from "@/server/db/mongoose";
import { ReminderLogMongoModel } from "@/server/models/reminder-log.model";

type ReminderDeliveryInput = {
  eventId: string;
  fighterId: string;
  fightId: string | null;
  eventRequirementId: string;
  kind?: ReminderLogKind;
  recipientName: string;
  recipientEmail: string;
  requirementName: string;
  eventName: string;
  scheduledFor: string;
  dueDate: string | null;
  subject: string;
  message: string;
  status: "SENT" | "FAILED";
  attemptedAt: string;
  attemptCount: number;
  errorMessage?: string | null;
};

export const reminderLogsRepository = {
  async listByEventId(eventId: string, limit = 250) {
    await connectToDatabase();

    const logs = await ReminderLogMongoModel.find({
      eventId,
      status: { $in: ["SENT", "FAILED"] },
    })
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(limit, 500)))
      .lean();

    return logs.map(mapReminderLog);
  },
  async listByEventAndFighter(eventId: string, fighterId: string, limit = 100) {
    await connectToDatabase();

    const logs = await ReminderLogMongoModel.find({
      eventId,
      fighterId,
      status: { $in: ["SENT", "FAILED"] },
    })
      .sort({ scheduledFor: -1, createdAt: -1 })
      .limit(Math.max(1, Math.min(limit, 250)))
      .lean();

    return logs.map(mapReminderLog);
  },
  async recordDeliveries(inputs: ReminderDeliveryInput[]) {
    await connectToDatabase();

    if (inputs.length === 0) {
      return 0;
    }

    const result = await ReminderLogMongoModel.bulkWrite(
      inputs.map((input) => ({
        updateOne: {
          filter: {
            eventId: input.eventId,
            fighterId: input.fighterId,
            eventRequirementId: input.eventRequirementId,
            kind: input.kind ?? "fighter_reminder",
            scheduledFor: new Date(input.scheduledFor),
          },
          update: {
            $setOnInsert: {
              eventId: input.eventId,
              fighterId: input.fighterId,
              fightId: input.fightId,
              eventRequirementId: input.eventRequirementId,
              kind: input.kind ?? "fighter_reminder",
              recipientName: input.recipientName,
              recipientEmail: input.recipientEmail.toLowerCase(),
              requirementName: input.requirementName,
              eventName: input.eventName,
              scheduledFor: new Date(input.scheduledFor),
              dueDate: input.dueDate ? new Date(input.dueDate) : null,
              subject: input.subject,
              message: input.message,
            },
            $set: {
              status: input.status,
              sentAt: input.status === "SENT" ? new Date(input.attemptedAt) : null,
              attemptCount: input.attemptCount,
              lastError:
                input.status === "FAILED"
                  ? normalizeOptionalText(input.errorMessage)
                  : null,
              nextAttemptAt: null,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    return (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
  },
  async deleteByFightId(fightId: string) {
    await connectToDatabase();

    const result = await ReminderLogMongoModel.deleteMany({ fightId });
    return result.deletedCount ?? 0;
  },
  async deleteByEventId(eventId: string) {
    await connectToDatabase();

    const result = await ReminderLogMongoModel.deleteMany({ eventId });
    return result.deletedCount ?? 0;
  },
  async deleteByEventAndFighter(eventId: string, fighterId: string) {
    await connectToDatabase();

    const result = await ReminderLogMongoModel.deleteMany({
      eventId,
      fighterId,
    });

    return result.deletedCount ?? 0;
  },
  async deleteByEventRequirementId(eventId: string, eventRequirementId: string) {
    await connectToDatabase();

    const result = await ReminderLogMongoModel.deleteMany({ eventId, eventRequirementId });
    return result.deletedCount ?? 0;
  },
};

function mapReminderLog(log: {
  _id: { toString(): string };
  eventId: { toString(): string };
  fighterId: { toString(): string };
  fightId: { toString(): string } | null;
  eventRequirementId: { toString(): string };
  kind?: ReminderLogKind;
  recipientName: string;
  recipientEmail: string;
  requirementName: string;
  eventName: string;
  scheduledFor: Date;
  dueDate: Date | null;
  subject: string;
  message: string;
  status: ReminderLogStatus;
  sentAt: Date | null;
  attemptCount?: number;
  lastError?: string | null;
  nextAttemptAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ReminderLogRecord {
  return {
    id: log._id.toString(),
    eventId: log.eventId.toString(),
    fighterId: log.fighterId.toString(),
    fightId: log.fightId ? log.fightId.toString() : null,
    eventRequirementId: log.eventRequirementId.toString(),
    kind: log.kind ?? "fighter_reminder",
    recipientName: log.recipientName,
    recipientEmail: log.recipientEmail,
    requirementName: log.requirementName,
    eventName: log.eventName,
    scheduledFor: log.scheduledFor.toISOString(),
    dueDate: log.dueDate ? log.dueDate.toISOString() : null,
    subject: log.subject,
    message: log.message,
    status: log.status,
    sentAt: log.sentAt ? log.sentAt.toISOString() : null,
    attemptCount: log.attemptCount ?? 0,
    lastError: log.lastError ?? null,
    nextAttemptAt: log.nextAttemptAt ? log.nextAttemptAt.toISOString() : null,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  };
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
