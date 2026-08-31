import type { ReminderLogRecord, ReminderLogStatus } from "@/types/readiness";
import { connectToDatabase } from "@/server/db/mongoose";
import { ReminderLogMongoModel } from "@/server/models/reminder-log.model";

export const reminderLogsRepository = {
  async listByEventId(eventId: string) {
    await connectToDatabase();

    const logs = await ReminderLogMongoModel.find({ eventId })
      .sort({ scheduledFor: 1, createdAt: 1 })
      .lean();

    return logs.map(mapReminderLog);
  },
  async listByEventAndFighter(eventId: string, fighterId: string) {
    await connectToDatabase();

    const logs = await ReminderLogMongoModel.find({
      eventId,
      fighterId,
    })
      .sort({ scheduledFor: -1, createdAt: -1 })
      .lean();

    return logs.map(mapReminderLog);
  },
  async upsertReminder(input: {
    eventId: string;
    fighterId: string;
    fightId: string | null;
    eventRequirementId: string;
    recipientName: string;
    recipientEmail: string;
    requirementName: string;
    eventName: string;
    scheduledFor: string;
    dueDate: string | null;
    subject: string;
    message: string;
  }) {
    await connectToDatabase();

    const log = await ReminderLogMongoModel.findOneAndUpdate(
      {
        eventId: input.eventId,
        fighterId: input.fighterId,
        eventRequirementId: input.eventRequirementId,
        scheduledFor: new Date(input.scheduledFor),
      },
      {
        $setOnInsert: {
          eventId: input.eventId,
          fighterId: input.fighterId,
          fightId: input.fightId,
          eventRequirementId: input.eventRequirementId,
          recipientName: input.recipientName,
          recipientEmail: input.recipientEmail.toLowerCase(),
          requirementName: input.requirementName,
          eventName: input.eventName,
          scheduledFor: new Date(input.scheduledFor),
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          subject: input.subject,
          message: input.message,
          status: "PENDING",
          sentAt: null,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    ).lean();

    return mapReminderLog(log);
  },
  async markManyAsSent(reminderIds: string[], sentAt: Date) {
    await connectToDatabase();

    if (reminderIds.length === 0) {
      return 0;
    }

    const result = await ReminderLogMongoModel.updateMany(
      {
        _id: { $in: reminderIds },
        status: "PENDING",
      },
      {
        $set: {
          status: "SENT",
          sentAt,
        },
      },
    );

    return result.modifiedCount;
  },
  async updateStatus(reminderId: string, status: ReminderLogStatus) {
    await connectToDatabase();

    const reminder = await ReminderLogMongoModel.findByIdAndUpdate(
      reminderId,
      {
        status,
        sentAt: status === "SENT" ? new Date() : null,
      },
      { returnDocument: "after" },
    ).lean();

    return reminder ? mapReminderLog(reminder) : null;
  },
  async deleteByFightId(fightId: string) {
    await connectToDatabase();

    const result = await ReminderLogMongoModel.deleteMany({ fightId });
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
};

function mapReminderLog(log: {
  _id: { toString(): string };
  eventId: { toString(): string };
  fighterId: { toString(): string };
  fightId: { toString(): string } | null;
  eventRequirementId: { toString(): string };
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
  createdAt: Date;
  updatedAt: Date;
}): ReminderLogRecord {
  return {
    id: log._id.toString(),
    eventId: log.eventId.toString(),
    fighterId: log.fighterId.toString(),
    fightId: log.fightId ? log.fightId.toString() : null,
    eventRequirementId: log.eventRequirementId.toString(),
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
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  };
}
