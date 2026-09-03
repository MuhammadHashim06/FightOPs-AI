import { connectToDatabase } from "@/server/db/mongoose";
import { AuditLogMongoModel } from "@/server/models/audit-log.model";

export const auditLogsRepository = {
  async create(input: {
    eventId: string;
    fighterId: string | null;
    fightId: string | null;
    requirementId: string | null;
    actorUserId: string;
    action: string;
    stateFrom: string;
    stateTo: string;
    note?: string | null;
  }) {
    await connectToDatabase();

    const log = await AuditLogMongoModel.create({
      eventId: input.eventId,
      fighterId: input.fighterId,
      fightId: input.fightId,
      requirementId: input.requirementId,
      actorUserId: input.actorUserId,
      action: input.action,
      stateFrom: input.stateFrom,
      stateTo: input.stateTo,
      note: input.note?.trim() || null,
    });

    return log._id.toString();
  },
  async deleteByEventId(eventId: string) {
    await connectToDatabase();

    const result = await AuditLogMongoModel.deleteMany({ eventId });
    return result.deletedCount ?? 0;
  },
  async listByEventIds(eventIds: string[]) {
    await connectToDatabase();

    const logs = await AuditLogMongoModel.find({ eventId: { $in: eventIds } })
      .sort({ createdAt: -1 })
      .lean();

    return logs.map((log) => ({
      id: log._id.toString(),
      eventId: log.eventId.toString(),
      fighterId: log.fighterId?.toString() ?? null,
      requirementId: log.requirementId?.toString() ?? null,
      actorUserId: log.actorUserId.toString(),
      action: log.action,
      stateFrom: log.stateFrom,
      stateTo: log.stateTo,
      note: log.note ?? null,
      createdAt: log.createdAt.toISOString(),
    }));
  },
  async listByEventIdsOrActor(eventIds: string[], actorUserId: string) {
    await connectToDatabase();

    const logs = await AuditLogMongoModel.find({
      $or: [{ eventId: { $in: eventIds } }, { actorUserId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    return logs.map((log) => ({
      id: log._id.toString(),
      eventId: log.eventId.toString(),
      fighterId: log.fighterId?.toString() ?? null,
      requirementId: log.requirementId?.toString() ?? null,
      actorUserId: log.actorUserId.toString(),
      action: log.action,
      stateFrom: log.stateFrom,
      stateTo: log.stateTo,
      note: log.note ?? null,
      createdAt: log.createdAt.toISOString(),
    }));
  },
};
